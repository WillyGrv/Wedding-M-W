# Server environment

This server can run in two modes:

## Mode A — Mock (no Spotify credentials)
You can use the mock data in `server/mock-data/`.

## Mode B — Real Spotify search (Client Credentials)
Create a file `server/.env` (do **not** commit it) and provide:

- `SPOTIFY_CLIENT_ID=...`
- `SPOTIFY_CLIENT_SECRET=...`

Optional (only for the future "add to playlist" step):

- `SPOTIFY_REFRESH_TOKEN=...`
- `SPOTIFY_PLAYLIST_ID=...`

`server/.env.example` is only a template and must not contain real secrets.
