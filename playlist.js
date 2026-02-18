// Minimal front-end for Spotify search and add-to-playlist via backend proxy
// Configure your backend base URL:
// - Local dev: http://localhost:8888
// - GitHub Pages: set to your deployed backend (Render/Railway/etc.)
// - Same-origin deployments (frontend + backend on same domain): set to ''
//
// ✅ Update this value after deploying your backend (Render):
const PROD_API_BASE = 'https://wedding-m-w.onrender.com';

const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
const isGitHubPages = location.hostname.endsWith('.github.io');
const API_BASE = isLocal ? 'http://localhost:8888' : (isGitHubPages ? PROD_API_BASE : '');
const SEARCH_ENDPOINT = `${API_BASE}/api/search`;
const ADD_ENDPOINT = `${API_BASE}/api/add-track`;

const $q = document.getElementById('spotifyQuery');
const $btn = document.getElementById('spotifySearchBtn');
const $results = document.getElementById('spotifyResults');
const $status = document.getElementById('playlistStatus');

// If the current page doesn't have the playlist UI, exit early (safe to include on index.html)
if (!$q || !$btn || !$results || !$status) {
  // eslint-disable-next-line no-console
  console.warn('[playlist] UI not found on this page; playlist.js not activated.');
} else {

function setStatus(msg, type = 'info') {
  $status.textContent = msg || '';
  $status.style.color = type === 'error' ? '#b00020' : 'var(--sage)';
}

function debounce(fn, wait = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function normalizeSpotifyTrack(item) {
  // Supports both raw Spotify search payload (tracks.items[]) and a custom normalized API payload
  // Raw item example: { name, artists: [{name}], album: { images: [{url}] }, uri, id, preview_url }
  const name = item.name || item.track_name || '';
  const artists = item.artists || item.track_artists || [];
  const artistNames = Array.isArray(artists) ? artists.map(a => a.name || a).join(', ') : String(artists || '');
  const images = (item.album && item.album.images) || item.images || [];
  const imageUrl = images[0]?.url || images[images.length - 1]?.url || '';
  const uri = item.uri || item.track_uri || (item.id ? `spotify:track:${item.id}` : '');
  const previewUrl = item.preview_url || item.track_preview_url || '';
  const id = item.id || (uri && uri.startsWith('spotify:track:') ? uri.replace('spotify:track:', '') : '');
  return { name, artistNames, imageUrl, uri, previewUrl, id };
}

function getSpotifyTrackId(track) {
  if (!track) return '';
  if (track.id) return String(track.id);
  if (track.uri && track.uri.startsWith('spotify:track:')) return track.uri.replace('spotify:track:', '');
  return '';
}

function createSpotifyEmbed(trackId) {
  const wrap = document.createElement('div');
  wrap.className = 'spotify-preview';

  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  iframe.src = `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}`;

  wrap.appendChild(iframe);
  return wrap;
}

async function searchTracks(query) {
  if (!query || query.trim().length < 2) {
    setStatus('Tapez au moins 2 caractères pour rechercher.');
    $results.innerHTML = '';
    return;
  }
  setStatus('Recherche en cours… (Cela peut prendre 30 sec)');
  try {
    const params = new URLSearchParams({ q: query.trim(), limit: '10' });
    const resp = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`);
    if (!resp.ok) throw new Error(`Recherche échouée (${resp.status})`);
    const data = await resp.json();

    // Accept raw Spotify payload or normalized payload
    const items = (data.tracks && data.tracks.items) || data.items || [];
    const tracks = items.map(normalizeSpotifyTrack);

    renderResults(tracks);
    setStatus(`Résultats: ${tracks.length}`);
  } catch (err) {
    console.error(err);
    setStatus('Erreur pendant la recherche. Réessayez dans un instant.', 'error');
  }
}

function renderResults(tracks) {
  $results.innerHTML = '';
  if (!tracks.length) {
    const empty = document.createElement('div');
    empty.textContent = 'Aucun résultat.';
    empty.style.color = '#666';
    $results.appendChild(empty);
    return;
  }

  tracks.forEach(t => {
    const row = document.createElement('div');
    row.className = 'result-item';

    const img = document.createElement('img');
    img.alt = `Pochette de ${t.name}`;
    img.src = t.imageUrl || 'images/asset-placeholder.png';
    row.appendChild(img);

    const info = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = t.name;
    const artists = document.createElement('p');
    artists.textContent = t.artistNames;
    info.appendChild(title);
    info.appendChild(artists);
    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'actions';

    // Preview (Spotify embed)
    const trackId = getSpotifyTrackId(t);
    const hasEmbed = Boolean(trackId);
    let previewEl = null;
    if (hasEmbed) {
      const previewBtn = document.createElement('button');
      previewBtn.type = 'button';
      previewBtn.textContent = 'Pré-écouter';
      previewBtn.style.marginRight = '0.5rem';

      previewBtn.addEventListener('click', () => {
        if (previewEl) {
          previewEl.remove();
          previewEl = null;
          previewBtn.textContent = 'Pré-écouter';
          return;
        }
        previewEl = createSpotifyEmbed(trackId);
        row.appendChild(previewEl);
        previewBtn.textContent = 'Masquer';
      });

      actions.appendChild(previewBtn);
    }

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Ajouter à la playlist';
    addBtn.addEventListener('click', () => addTrack(t.uri, addBtn));
    actions.appendChild(addBtn);
    row.appendChild(actions);

    // Optional 30s preview
    if (t.previewUrl) {
      const audio = document.createElement('audio');
      audio.src = t.previewUrl;
      audio.controls = true;
      audio.style.gridColumn = '1 / -1';
      audio.style.marginTop = '0.25rem';
      row.appendChild(audio);
    }

    $results.appendChild(row);
  });
}

async function addTrack(uri, btn) {
  if (!uri) {
    setStatus('URI invalide pour la piste.', 'error');
    return;
  }

  const originalLabel = btn.textContent;
  try {
    btn.disabled = true;
    btn.textContent = 'Ajout…';
    setStatus('Ajout en cours…');
    const resp = await fetch(ADD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });

    // UX: more explicit handling
    if (resp.status === 409) {
      setStatus('Déjà proposé — merci !', 'info');
      btn.textContent = 'Déjà ajouté';
      return;
    }

    if (!resp.ok) {
      const msg = `Ajout impossible (${resp.status})`;
      setStatus(msg, 'error');
      return;
    }

    const data = await resp.json().catch(() => ({}));
    if (data.success) {
      setStatus('Chanson ajoutée (enregistrée). Merci !');
      btn.textContent = 'Ajouté ✓';
      return;
    }

    setStatus(data.message || 'Impossible d\'ajouter la chanson.', 'error');
  } catch (err) {
    console.error(err);
    setStatus('Erreur réseau. Réessayez.', 'error');
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }, 1500);
  }
}

// Wire events
$btn.addEventListener('click', () => searchTracks($q.value));
$q.addEventListener('input', debounce(() => searchTracks($q.value), 500));
}
