# Google Apps Script — phase 1

Ce dossier contient la base de migration **phase 1** pour remplacer Render par Google Apps Script **sans casser le comportement actuel**.

## Objectif

Conserver ce qui fonctionne déjà :

- recherche Spotify
- enregistrement des demandes (`pending`)
- listing admin
- confirmation admin en mode manuel
- suppression
- marquage `manualAddedAt`
- lookup exact d'une track pour enrichir l'admin

## Endpoints compatibles

- `GET /api/health`
- `GET /api/search?q=...&limit=...`
- `GET /api/track/:id`
- `POST /api/add-track`
- `GET /api/admin/requests?status=pending|confirmed|all`
- `POST /api/admin/confirm`
- `POST /api/admin/manual-added`
- `POST /api/admin/delete`
- `POST /api/admin/remove`

## Mise en place rapide

1. Crée un Google Sheet
2. Ouvre **Extensions → Apps Script**
3. Copie le contenu de `Code.gs`
4. Ajoute les Script Properties :
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
5. Déploie en **Web App**

## Déploiement Web App

- Deploy → New deployment
- Type : Web app
- Execute as : Me
- Who has access : Anyone

Tu obtiendras une URL de type :

`https://script.google.com/macros/s/.../exec`

## Stratégie de migration

- on garde Render en fallback
- on valide Apps Script localement
- on bascule ensuite le front vers l'URL Apps Script
- on n'active pas encore l'écriture directe Spotify dans la playlist
