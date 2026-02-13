# Playlist Proxy (server)

Minimal Express server providing two endpoints used by the wedding site playlist page.

- `GET /api/search?q=...&limit=...` — returns mock tracks (from `mock-data/tracks.json`).
- `POST /api/add-track` — appends the track URI to `mock-data/playlist-log.json` (dedupe included).

Later, swap mocks for real Spotify calls (see `PLAYLIST-BACKEND.md`).

## Quick start

```zsh
cd server
cp .env.example .env
npm install
npm run start
# Server listens on http://localhost:8888
```

Update your front-end `playlist.js`:

```js
const API_BASE = 'http://localhost:8888';
```

## Notes
- CORS is currently permissive for dev (`*`). Tighten to your domain in production.
- Rate limits applied: 60 searches/hour, 30 adds/hour.
- Mock data uses Picsum for images; replace with your own if preferred.
