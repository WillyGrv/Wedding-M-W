// Minimal Express server for playlist proxy (mock now, Spotify later)
// CommonJS for compatibility
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Node 18+ includes global fetch.
// If you ever run this server on older Node, you'll need to polyfill fetch.

const app = express();
const PORT = process.env.PORT || 8888;

// Spotify (Client Credentials) token cache
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * In-memory token cache.
 * Token is valid ~1h, but we refresh a bit before expiry (skew) to avoid edge cases.
 */
const spotifyTokenCache = {
  accessToken: null,
  expiresAtMs: 0
};

function isSpotifyConfigured() {
  return Boolean(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
}

async function fetchSpotifyAccessToken() {
  if (!isSpotifyConfigured()) {
    throw new Error('Spotify client credentials are not configured (SPOTIFY_CLIENT_ID/SECRET)');
  }

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  // https://developer.spotify.com/documentation/web-api/concepts/access-token
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Spotify token request failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  const accessToken = data.access_token;
  const expiresInSec = Number(data.expires_in || 3600);

  if (!accessToken) {
    throw new Error('Spotify token response missing access_token');
  }

  // Refresh early: 60s or 10% of ttl (whichever is bigger), capped to 5 minutes.
  const skewSec = Math.min(300, Math.max(60, Math.floor(expiresInSec * 0.1)));
  spotifyTokenCache.accessToken = accessToken;
  spotifyTokenCache.expiresAtMs = Date.now() + Math.max(0, (expiresInSec - skewSec)) * 1000;

  return accessToken;
}

async function getSpotifyAccessToken() {
  if (spotifyTokenCache.accessToken && Date.now() < spotifyTokenCache.expiresAtMs) {
    return spotifyTokenCache.accessToken;
  }
  return fetchSpotifyAccessToken();
}

async function spotifySearchTracks({ q, limit = 10 }) {
  const token = await getSpotifyAccessToken();
  const params = new URLSearchParams({ q, type: 'track', limit: String(limit) });

  const resp = await fetch(`https://api.spotify.com/v1/search?${params.toString()}` , {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Spotify search failed (${resp.status}): ${text}`);
  }

  return resp.json();
}

// CORS: loosen for dev, tighten in prod to your site domain
app.use(cors({
  origin: '*', // e.g. ["http://localhost:8080", "https://yourdomain"]
  credentials: false
}));
app.use(express.json());

// Rate limits (tweak as needed)
const searchLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 60 });
const addLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30 });

// Data files (use __dirname so it works regardless of where node is launched from)
const dataDir = path.join(__dirname, 'mock-data');
const tracksFile = path.join(dataDir, 'tracks.json');
const logFile = path.join(dataDir, 'playlist-log.json');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    const msg = err && err.code === 'ENOENT'
      ? `Missing file: ${file}`
      : `Failed to read JSON: ${file}`;
    const e = new Error(msg);
    e.cause = err;
    throw e;
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Debug (safe): do NOT expose the token value, only status/expiry
app.get('/api/debug/token-status', (_req, res) => {
  const now = Date.now();
  const expiresInMs = spotifyTokenCache.expiresAtMs ? (spotifyTokenCache.expiresAtMs - now) : 0;
  return res.json({
    configured: isSpotifyConfigured(),
    cached: Boolean(spotifyTokenCache.accessToken) && now < spotifyTokenCache.expiresAtMs,
    expiresInSec: Math.max(0, Math.floor(expiresInMs / 1000))
  });
});

// GET /api/search?q=...&limit=...
app.get('/api/search', searchLimiter, async (req, res) => {
  const qRaw = String(req.query.q || '').trim();
  const q = qRaw.toLowerCase();
  const limit = parseInt(req.query.limit || '10', 10);

  if (q.length < 2) {
    return res.json({ items: [] });
  }

  // If Spotify creds are configured, use real Spotify search.
  // Otherwise keep the mock-data happy path for local/dev.
  if (isSpotifyConfigured()) {
    try {
      const data = await spotifySearchTracks({ q: qRaw, limit: Number.isFinite(limit) ? limit : 10 });
      return res.json(data);
    } catch (err) {
      console.error(err);
      // Fallback to mock (useful if Spotify is temporarily down / network issues)
    }
  }

  let all;
  try {
    all = readJSON(tracksFile);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'mock_data_unavailable',
      message: err.message
    });
  }
  const filtered = all.filter(t => {
    const name = (t.track_name || '').toLowerCase();
    const artists = (t.track_artists || []).join(', ').toLowerCase();
    return name.includes(q) || artists.includes(q);
  }).slice(0, Number.isFinite(limit) ? limit : 10);

  return res.json({ items: filtered });
});

// POST /api/add-track { uri }
app.post('/api/add-track', addLimiter, (req, res) => {
  const { uri } = req.body || {};
  if (!uri) return res.status(400).json({ success: false, message: 'Missing uri' });

  let log;
  try {
    log = readJSON(logFile);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
  if (log.find(entry => entry.uri === uri)) {
    return res.status(409).json({ success: false, message: 'Track already added' });
  }

  log.push({ uri, ts: Date.now(), ip: req.ip });
  writeJSON(logFile, log);

  // TODO: Later call Spotify API to add track to organizer playlist
  return res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Playlist proxy running on http://localhost:${PORT}`);
});
