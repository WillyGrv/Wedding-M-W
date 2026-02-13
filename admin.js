// Admin UI for reviewing and confirming playlist requests
// Uses the same API_BASE strategy as playlist.js
const PROD_API_BASE = 'https://wedding-m-w.onrender.com';

const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
const isGitHubPages = location.hostname.endsWith('.github.io');
const API_BASE = isLocal ? 'http://localhost:8888' : (isGitHubPages ? PROD_API_BASE : '');

const LIST_ENDPOINT = `${API_BASE}/api/admin/requests`;
const CONFIRM_ENDPOINT = `${API_BASE}/api/admin/confirm`;
const DELETE_ENDPOINT = `${API_BASE}/api/admin/delete`;
const MANUAL_ADDED_ENDPOINT = `${API_BASE}/api/admin/manual-added`;
const SEARCH_ENDPOINT = `${API_BASE}/api/search`;

const $list = document.getElementById('adminList');
const $msg = document.getElementById('adminStatusMsg');
const $refresh = document.getElementById('adminRefreshBtn');
const $status = document.getElementById('adminStatus');

function setMsg(text, type = 'info') {
  $msg.textContent = text || '';
  $msg.style.color = type === 'error' ? '#b00020' : 'var(--sage)';
}

function fmtDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('fr-FR');
  } catch {
    return String(ts);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function load() {
  const desired = $status.value;
  setMsg('Chargement…');
  $list.innerHTML = '';

  try {
    const url = new URL(LIST_ENDPOINT, location.href);
    url.searchParams.set('status', desired);

    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    const items = data.items || [];

    // If the backend didn't persist track metadata (only URI), resolve it on the fly for nicer admin display.
    const enriched = await enrichEntriesWithTrack(items);
    render(enriched);
    setMsg(`Demandes: ${items.length}`);
  } catch (err) {
    console.error(err);
    setMsg('Impossible de charger les demandes (serveur non joignable ?).', 'error');
  }
}

function getSpotifyTrackIdFromUri(uri) {
  if (!uri) return '';
  if (uri.startsWith('spotify:track:')) return uri.replace('spotify:track:', '');
  return '';
}

async function fetchTrackById(trackId) {
  if (!trackId) return null;
  try {
    const url = new URL(SEARCH_ENDPOINT, location.href);
    // Spotify search is text-based. Using the URI tends to match the exact track reliably.
    url.searchParams.set('q', `spotify:track:${trackId}`);
    url.searchParams.set('limit', '5');

    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    const data = await resp.json();
    const items = data.items || data.tracks || [];
    const list = Array.isArray(items) ? items : (items.items || []);
    const best = list.find(t => (t.id && t.id === trackId) || (t.uri && t.uri === `spotify:track:${trackId}`));
    return best || null;
  } catch {
    return null;
  }
}

async function enrichEntriesWithTrack(items) {
  // Only enrich rows that don't already have track info.
  const needs = items.filter(e => !e.track || (!e.track.name && !e.track.artists));
  if (!needs.length) return items;

  // Dedupe by trackId to avoid spamming the API.
  const ids = Array.from(new Set(needs.map(e => getSpotifyTrackIdFromUri(e.uri)).filter(Boolean)));

  const map = new Map();
  // Small concurrency to keep things snappy & polite.
  const batchSize = 4;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchTrackById));
    results.forEach((track, idx) => {
      if (track) map.set(batch[idx], track);
    });
  }

  return items.map(e => {
    if (e.track && (e.track.name || (e.track.artists && e.track.artists.length))) return e;
    const id = getSpotifyTrackIdFromUri(e.uri);
    const track = map.get(id);
    if (!track) return e;
    return { ...e, track };
  });
}

function render(items) {
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'admin-empty';
    empty.textContent = 'Aucune demande.';
    $list.appendChild(empty);
    return;
  }

  items.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'admin-item';

    const meta = document.createElement('div');
    meta.className = 'admin-meta';

    const track = entry.track;
    const hasTrack = track && (track.name || (track.artists && track.artists.length));
    const shortId = getSpotifyTrackIdFromUri(entry.uri);
    const title = hasTrack
      ? `${track.name || ''}`
      : (shortId ? `Track ${shortId.slice(0, 10)}…` : (entry.uri || ''));
    const subtitle = hasTrack
      ? `${(track.artists || []).join(', ')}${track.album ? ` • ${track.album}` : ''}`
      : '';
    const img = hasTrack && track.imageUrl ? `<img class="admin-cover" src="${escapeHtml(track.imageUrl)}" alt="" loading="lazy">` : '';

    const spotifyOpenUrl = (entry.uri && entry.uri.startsWith('spotify:track:'))
      ? `https://open.spotify.com/track/${encodeURIComponent(entry.uri.replace('spotify:track:', ''))}`
      : '';

    const spotifyEmbedUrl = (entry.uri && entry.uri.startsWith('spotify:track:'))
      ? `https://open.spotify.com/embed/track/${encodeURIComponent(entry.uri.replace('spotify:track:', ''))}`
      : '';

    meta.innerHTML = `
      <div class="admin-track">
        ${img}
        <div class="admin-track-text">
          <div class="admin-title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="admin-subtitle">${escapeHtml(subtitle)}</div>` : ''}
          <div class="admin-uri"><code>${escapeHtml(entry.uri || '')}</code></div>
        </div>
      </div>
      <div class="admin-sub">
        <span class="pill">${escapeHtml(entry.status || 'pending')}</span>
        <span class="muted">Demandé: ${escapeHtml(fmtDate(entry.ts))}</span>
        ${entry.confirmedAt ? `<span class="muted">Confirmé: ${escapeHtml(fmtDate(entry.confirmedAt))}</span>` : ''}
        ${entry.manualAddedAt ? `<span class="muted">Ajouté manuellement: ${escapeHtml(fmtDate(entry.manualAddedAt))}</span>` : ''}
      </div>
      ${spotifyOpenUrl ? `
      <div class="admin-links">
        <button type="button" class="admin-btn admin-secondary" data-preview-embed="${escapeHtml(spotifyEmbedUrl)}">Pré-écouter</button>
        <a class="admin-link" href="${escapeHtml(spotifyOpenUrl)}" target="_blank" rel="noopener">Ouvrir Spotify</a>
        <button type="button" class="admin-btn admin-secondary" data-copy-url="${escapeHtml(spotifyOpenUrl)}">Copier le lien</button>
      </div>
      ` : ''}
    `;

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'admin-btn admin-confirm';
    confirmBtn.textContent = 'Confirmer';

    if (entry.status === 'confirmed') {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Confirmé ✓';
    }

    confirmBtn.addEventListener('click', async () => {
      await confirm(entry.uri, confirmBtn);
    });

    const manualBtn = document.createElement('button');
    manualBtn.type = 'button';
    manualBtn.className = 'admin-btn admin-secondary';
    manualBtn.textContent = entry.manualAddedAt ? 'Ajouté ✅' : 'Ajouté manuellement ✅';
    if (entry.manualAddedAt) manualBtn.disabled = true;

    manualBtn.addEventListener('click', async () => {
      await markManualAdded(entry.uri, manualBtn);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'admin-btn admin-delete';
    deleteBtn.textContent = 'Supprimer';

    deleteBtn.addEventListener('click', async () => {
      await remove(entry.uri, deleteBtn);
    });

    actions.appendChild(confirmBtn);
    actions.appendChild(manualBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(meta);
    row.appendChild(actions);
    $list.appendChild(row);

    // Wire copy link button (if present)
    const copyBtn = row.querySelector('[data-copy-url]');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const url = copyBtn.getAttribute('data-copy-url') || '';
        if (!url) return;
        try {
          await navigator.clipboard.writeText(url);
          setMsg('Lien copié.');
        } catch {
          setMsg('Impossible de copier automatiquement. Sélectionnez et copiez le lien.', 'error');
        }
      });
    }

    // Wire preview embed toggle (if present)
    const previewBtn = row.querySelector('[data-preview-embed]');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const src = previewBtn.getAttribute('data-preview-embed') || '';
        if (!src) return;

        const existing = row.querySelector('.spotify-preview');
        if (existing) {
          existing.remove();
          previewBtn.textContent = 'Pré-écouter';
          return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'spotify-preview';
        const iframe = document.createElement('iframe');
        iframe.loading = 'lazy';
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        iframe.src = src;
        wrap.appendChild(iframe);
        // Place preview in the left column (meta) so it doesn't squeeze the actions column.
        meta.appendChild(wrap);
        previewBtn.textContent = 'Masquer';
      });
    }
  });
}

async function confirm(uri, btn) {
  if (!uri) return;

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Ajout…';
  setMsg('Ajout à Spotify en cours…');

  try {
    const resp = await fetch(CONFIRM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });

    if (resp.status === 404) {
      setMsg('Demande introuvable (peut-être supprimée).', 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    if (!resp.ok) {
      setMsg(`Erreur de confirmation (HTTP ${resp.status}).`, 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    await resp.json().catch(() => ({}));
    btn.textContent = 'Confirmé ✓';

    setMsg('Confirmé. Utilisez "Ouvrir Spotify" puis cliquez "Ajouté manuellement ✅".');

    // refresh list to reflect status + timestamps
    setTimeout(load, 250);
  } catch (err) {
    console.error(err);
    setMsg('Erreur réseau. Réessayez.', 'error');
    btn.textContent = original;
    btn.disabled = false;
  }
}

async function markManualAdded(uri, btn) {
  if (!uri) return;
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';
  setMsg('Marquage en cours…');

  try {
    const resp = await fetch(MANUAL_ADDED_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });

    if (!resp.ok) {
      setMsg(`Erreur (HTTP ${resp.status}).`, 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    btn.textContent = 'Ajouté ✅';
    setMsg('OK.');
    setTimeout(load, 250);
  } catch (err) {
    console.error(err);
    setMsg('Erreur réseau. Réessayez.', 'error');
    btn.textContent = original;
    btn.disabled = false;
  }
}

async function remove(uri, btn) {
  if (!uri) return;
  const ok = window.confirm('Supprimer cette demande ?');
  if (!ok) return;

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Suppression…';
  setMsg('Suppression en cours…');

  try {
    const resp = await fetch(DELETE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });

    if (resp.status === 404) {
      setMsg('Demande introuvable (déjà supprimée ?).', 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    if (!resp.ok) {
      setMsg(`Erreur de suppression (HTTP ${resp.status}).`, 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    setMsg('Demande supprimée.');
    setTimeout(load, 150);
  } catch (err) {
    console.error(err);
    setMsg('Erreur réseau. Réessayez.', 'error');
    btn.textContent = original;
    btn.disabled = false;
  }
}

$refresh.addEventListener('click', load);
$status.addEventListener('change', load);

load();
