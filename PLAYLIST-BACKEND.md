# Backend proxy pour la playlist Spotify

Ce document décrit comment mettre en place un petit backend (serverless ou Node) pour permettre aux invités de rechercher une chanson et l'ajouter à une playlist Spotify organisée par vous, sans que les invités aient besoin de se connecter.

## Vue d'ensemble

- Front-end (déjà prêt dans `playlist.html` / `playlist.js`):
  - `/playlist.html` offre une recherche et des résultats avec un bouton "Ajouter à la playlist".
  - Les appels se font vers deux endpoints backend: `GET /api/search` et `POST /api/add-track`.
- Backend (à déployer par vos soins):
  - `GET /api/search?q=...&limit=...` utilise **Client Credentials** pour interroger l'API Spotify (pas de scope utilisateur).
  - `POST /api/add-track` utilise un **refresh token** de l'organisateur obtenu une fois via le **Authorization Code flow** avec les scopes playlist-modify-public/playlist-modify-private.

## Prérequis Spotify

1. Créez une application Spotify Developer: https://developer.spotify.com/dashboard
   - Récupérez le **Client ID** et **Client Secret**.
   - Ajoutez une **Redirect URI** (ex: `https://playlist.yourdomain.com/callback` ou `http://localhost:8888/callback`). Elle servira uniquement pour l'étape d'obtention du refresh token.

2. Scopes nécessaires pour le token de l'organisateur:
   - `playlist-modify-public` (si la playlist est publique)
   - `playlist-modify-private` (si privée)

3. Id de la playlist cible (celle sous votre compte). Vous pouvez le récupérer via l'URL de la playlist ou l'API.

## Vue API et formats

- `GET /api/search`
  - Entrées: `q` (string), `limit` (optionnel, défaut 10), `offset` (optionnel)
  - Sortie (JSON):
    ```json
    {
      "items": [
        {
          "track_name": "...",
          "track_artists": ["Artist 1", "Artist 2"],
          "images": [{"url": "https://..."}],
          "track_uri": "spotify:track:...",
          "track_preview_url": "https://..." // optionnel
        }
      ]
    }
    ```
  - Vous pouvez aussi relayer tel quel le payload Spotify (`tracks.items[]`), le front accepte les deux.

- `POST /api/add-track`
  - Entrée (JSON): `{ "uri": "spotify:track:..." }`
  - Action: ajoute la piste à la playlist définie côté backend.
  - Sortie (JSON): `{ "success": true }` ou `{ "success": false, "message": "..." }`

## Flux d'authentification (organisateur)

1. **Authorization Code (one-time)** pour obtenir un **refresh token**:
   - Ouvrez une URL d'autorisation Spotify: `https://accounts.spotify.com/authorize?client_id=...&response_type=code&redirect_uri=...&scope=playlist-modify-public%20playlist-modify-private`
   - Après consentement, Spotify redirige vers `redirect_uri` avec `code`.
   - Echangez `code` contre `access_token` et `refresh_token` via `POST https://accounts.spotify.com/api/token`.
   - Stockez **sécuritairement** le `refresh_token` côté backend.

2. **Renouvellement token** à chaque appel `add-track`:
   - Utilisez `refresh_token` et `client_id/client_secret` pour obtenir un **access_token**.
   - Appelez `POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks` avec `Authorization: Bearer ACCESS_TOKEN`.

## Exemple serverless (pseudo-code Node)

```js
// /api/search
export default async (req, res) => {
  const q = req.query.q || '';
  const limit = req.query.limit || '10';
  // Client Credentials: get app access token
  const appToken = await getAppToken();
  const r = await fetch(`https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(q)}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${appToken}` }
  });
  const data = await r.json();
  // Optionally normalize to { items: [...] }
  const items = (data.tracks && data.tracks.items) || [];
  const normalized = items.map(t => ({
    track_name: t.name,
    track_artists: t.artists.map(a => a.name),
    images: t.album.images,
    track_uri: t.uri,
    track_preview_url: t.preview_url
  }));
  res.json({ items: normalized });
};

// /api/add-track
export default async (req, res) => {
  const { uri } = req.body || {};
  if (!uri) return res.status(400).json({ success: false, message: 'Missing uri' });
  const accessToken = await getOrganizerAccessTokenFromRefresh();
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
  const r = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ uris: [uri] })
  });
  if (r.ok) return res.json({ success: true });
  const e = await r.json().catch(() => ({}));
  return res.status(400).json({ success: false, message: e.error?.message || 'Add failed' });
};
```

> Vous devez implémenter `getAppToken()` (Client Credentials) et `getOrganizerAccessTokenFromRefresh()` (Authorization Code + refresh) côté backend, et stocker **Client Secret + Refresh Token** uniquement en serveur.

## Sécurité & anti-abus

- Activez CORS uniquement pour votre domaine public.
- Ajoutez un petit **rate-limit** (ex: 30 ajouts/heure, 60 recherches/heure par IP).
- Dédoublonnage: optionnel, vérifiez si la piste est déjà présente.
- Journalisation: loggez piste/heure/IP (sans données sensibles) pour monitoring.

## Déploiement

- Choisissez Netlify/Vercel/Cloudflare (ou Node sur un hébergeur):
  - Créez les endpoints `/api/search` et `/api/add-track`.
  - Variables d'environnement: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `SPOTIFY_PLAYLIST_ID`.
  - Mettez à jour `API_BASE` dans `playlist.js` si votre backend est sur un autre domaine.

## Test

- Ouvrez `/playlist.html` localement.
- Cherchez une chanson: vous devez voir un résultat et (si preview disponible) un audio 30s.
- Cliquez "Ajouter à la playlist": le backend ajoute la piste.
- Vérifiez la playlist dans Spotify.

## Liens utiles

- Spotify Web API: https://developer.spotify.com/documentation/web-api
- Authorization Guide: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
- Client Credentials Flow: https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
