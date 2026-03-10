// Admin UI for reviewing and confirming playlist requests
// Uses the same API_BASE strategy as playlist.js
const PROD_API_BASE = 'https://script.google.com/macros/s/AKfycbw0nrl03qhLlNLC5lV4aJAC7_T4EZxCSjRlmnESswUmr4SSM7T053hmHudASDWfPy8o1w/exec';
const RENDER_FALLBACK_API_BASE = 'https://wedding-m-w.onrender.com';

const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
// Use PROD_API_BASE for any non-local deployment (GitHub Pages on .github.io or custom domain).
const API_BASE = isLocal ? 'http://localhost:8888' : PROD_API_BASE;

const routeUrl = (route) => {
  const sep = API_BASE.includes('?') ? '&' : '?';
  return `${API_BASE}${sep}route=${encodeURIComponent(route)}`;
};

const LIST_ENDPOINT = routeUrl('/api/admin/requests');
const CONFIRM_ENDPOINT = routeUrl('/api/admin/confirm');
// Render backend doesn't currently expose /api/admin/delete in prod (was renamed previously).
// We'll try common variants to stay compatible.
const DELETE_ENDPOINTS = [
  routeUrl('/api/admin/delete'),
  routeUrl('/api/admin/remove')
];
const MANUAL_ADDED_ENDPOINT = routeUrl('/api/admin/manual-added');
const TRACK_ENDPOINT = routeUrl('/api/track');

const $list = document.getElementById('adminList');
const $msg = document.getElementById('adminStatusMsg');
const $refresh = document.getElementById('adminRefreshBtn');
const $status = document.getElementById('adminStatus');

// Bulk actions UI (optional on page)
const $selectAll = document.getElementById('adminSelectAll');
const $selectNone = document.getElementById('adminSelectNone');
const $selectedCount = document.getElementById('adminSelectedCount');
const $bulkConfirm = document.getElementById('adminBulkConfirm');
const $bulkDelete = document.getElementById('adminBulkDelete');

const selectedUris = new Set();
let lastRenderedEntries = [];

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

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  const data = await resp.json().catch(() => ({}));
  return { resp, data };
}

async function load() {
  const desired = $status.value;
  setMsg('Chargement…');
  $list.innerHTML = '';

  // Clear selection on reload to prevent acting on stale DOM/rows
  selectedUris.clear();
  updateBulkUi_();

  try {
    const url = new URL(LIST_ENDPOINT, location.href);
    url.searchParams.set('status', desired);

const { resp, data } = await fetchJson(url.toString());
if (!resp.ok && !Array.isArray(data.items)) throw new Error(`HTTP ${resp.status}`);
    const items = data.items || [];

    // If the backend didn't persist track metadata (only URI), resolve it on the fly for nicer admin display.
    const enriched = await enrichEntriesWithTrack(items);
    lastRenderedEntries = enriched;
    render(enriched);
    setMsg(`Demandes: ${items.length}`);
  } catch (err) {
    console.error(err);
    setMsg('Impossible de charger les demandes (serveur non joignable ?).', 'error');
  }
}

function updateBulkUi_() {
  if ($selectedCount) {
    const n = selectedUris.size;
    $selectedCount.textContent = `${n} sélectionné${n > 1 ? 's' : ''}`;
  }
  if ($bulkConfirm) $bulkConfirm.disabled = selectedUris.size === 0;
  if ($bulkDelete) $bulkDelete.disabled = selectedUris.size === 0;
}

function getSpotifyTrackIdFromUri(uri) {
  if (!uri) return '';
  if (uri.startsWith('spotify:track:')) return uri.replace('spotify:track:', '');
  return '';
}

async function fetchTrackById(trackId) {
  if (!trackId) return null;
  try {
    const { resp, data: t } = await fetchJson(routeUrl(`/api/track/${encodeURIComponent(trackId)}`));
    if (!resp.ok && !t.id) return null;

    // Normalize to the shape expected elsewhere in this file
    return {
      id: t.id,
      uri: t.uri,
      name: t.name,
      artists: t.artists || [],
      album: t.album || '',
      imageUrl: t.imageUrl || '',
      preview_url: t.preview_url || ''
    };
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
      </div>
      ` : ''}
    `;

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    // Bulk selection checkbox (doesn't affect manual actions)
    const selectWrap = document.createElement('label');
    selectWrap.className = 'admin-select';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'admin-checkbox';
    cb.dataset.uri = entry.uri;
    cb.checked = selectedUris.has(entry.uri);
    cb.addEventListener('change', () => {
      if (cb.checked) selectedUris.add(entry.uri);
      else selectedUris.delete(entry.uri);
      updateBulkUi_();
    });

    const cbText = document.createElement('span');
    cbText.className = 'admin-select-text';
    cbText.textContent = 'Sélectionner';

    selectWrap.appendChild(cb);
    selectWrap.appendChild(cbText);
    actions.appendChild(selectWrap);

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
    actions.appendChild(deleteBtn);

    row.appendChild(meta);
    row.appendChild(actions);
    $list.appendChild(row);

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

  // After render, make sure bulk UI reflects current selection
  updateBulkUi_();
}

function setBulkBusy_(isBusy, label) {
  if ($bulkConfirm) {
    $bulkConfirm.disabled = isBusy || selectedUris.size === 0;
    $bulkConfirm.textContent = isBusy ? (label || 'Traitement…') : 'Confirmer';
  }
  if ($bulkDelete) {
    $bulkDelete.disabled = isBusy || selectedUris.size === 0;
    $bulkDelete.textContent = isBusy ? (label || 'Traitement…') : 'Supprimer';
  }
  if ($selectAll) $selectAll.disabled = isBusy;
  if ($selectNone) $selectNone.disabled = isBusy;
  if ($refresh) $refresh.disabled = isBusy;
  if ($status) $status.disabled = isBusy;
}

async function runBulkConfirm_() {
  if (!selectedUris.size) return;

  const uris = Array.from(selectedUris);
  setBulkBusy_(true, 'Ajout…');
  setMsg(`Confirmation en cours… (0/${uris.length})`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    try {
      // Inline minimal confirm logic (reuse same endpoint/behavior)
      const url = new URL(CONFIRM_ENDPOINT, location.href);
      url.searchParams.set('uri', uri);
      // eslint-disable-next-line no-await-in-loop
      const { resp, data } = await fetchJson(url.toString());

      if (resp.ok && data && data.success) ok++;
      else fail++;
    } catch {
      fail++;
    }
    setMsg(`Confirmation en cours… (${i + 1}/${uris.length})`);
  }

  setMsg(`Terminé: ${ok} confirmé${ok > 1 ? 's' : ''}${fail ? ` • ${fail} erreur${fail > 1 ? 's' : ''}` : ''}`);
  selectedUris.clear();
  setBulkBusy_(false);
  updateBulkUi_();
  setTimeout(load, 350);
}

async function runBulkDelete_() {
  if (!selectedUris.size) return;

  const n = selectedUris.size;
  const ok = window.confirm(`Supprimer ${n} demande${n > 1 ? 's' : ''} ?`);
  if (!ok) return;

  const uris = Array.from(selectedUris);
  setBulkBusy_(true, 'Suppression…');
  setMsg(`Suppression en cours… (0/${uris.length})`);

  let okCount = 0;
  let fail = 0;

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    try {
      let deleted = false;
      for (const endpoint of DELETE_ENDPOINTS) {
        const url = new URL(endpoint, location.href);
        url.searchParams.set('uri', uri);
        // eslint-disable-next-line no-await-in-loop
        const { resp, data } = await fetchJson(url.toString());
        if (resp.status === 404 || data.message === 'Not found') continue;
        deleted = resp.ok;
        break;
      }
      if (deleted) okCount++;
      else fail++;
    } catch {
      fail++;
    }
    setMsg(`Suppression en cours… (${i + 1}/${uris.length})`);
  }

  setMsg(`Terminé: ${okCount} supprimé${okCount > 1 ? 's' : ''}${fail ? ` • ${fail} erreur${fail > 1 ? 's' : ''}` : ''}`);
  selectedUris.clear();
  setBulkBusy_(false);
  updateBulkUi_();
  setTimeout(load, 350);
}

async function confirm(uri, btn) {
  if (!uri) return;

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Ajout…';
  setMsg('Ajout à Spotify en cours…');

  try {
    // Apps Script Web Apps are brittle with CORS preflight for POST.
    // Use GET + query params to avoid OPTIONS entirely.
    const url = new URL(CONFIRM_ENDPOINT, location.href);
    url.searchParams.set('uri', uri);
    const { resp, data } = await fetchJson(url.toString());

if (resp.status === 404 || data.message === 'Not found') {
      setMsg('Demande introuvable (peut-être supprimée).', 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    if (!resp.ok && !data.success) {
      setMsg(`Erreur de confirmation (HTTP ${resp.status}).`, 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

    
    btn.textContent = 'Confirmé ✓';

    setMsg('Confirmé.');

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
    // Apps Script Web Apps are brittle with CORS preflight for POST.
    // Use GET + query params to avoid OPTIONS entirely.
    const url = new URL(MANUAL_ADDED_ENDPOINT, location.href);
    url.searchParams.set('uri', uri);
    const { resp, data } = await fetchJson(url.toString());

    if (!resp.ok && !data.success) {
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
    let resp = null;
    for (const endpoint of DELETE_ENDPOINTS) {
      // eslint-disable-next-line no-await-in-loop
      // Apps Script Web Apps are brittle with CORS preflight for POST.
      // Use GET + query params to avoid OPTIONS entirely.
      const url = new URL(endpoint, location.href);
      url.searchParams.set('uri', uri);
      const { resp: r, data } = await fetchJson(url.toString());
      // If endpoint doesn't exist, try next
      if (r.status === 404 || data.message === 'Not found') continue;
      resp = r;
      break;
    }

    if (!resp) {
      setMsg('Suppression indisponible (endpoint introuvable côté serveur).', 'error');
      btn.textContent = original;
      btn.disabled = false;
      return;
    }

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

// Bulk actions wiring (keeps manual buttons untouched)
if ($selectAll) {
  $selectAll.addEventListener('click', () => {
    // B: in pending view, select only pending rows (avoid accidental confirmed selection)
    const desired = $status.value;
    selectedUris.clear();
    (lastRenderedEntries || []).forEach((e) => {
      if (!e || !e.uri) return;
      if (desired === 'pending' && e.status !== 'pending') return;
      selectedUris.add(e.uri);
    });

    // sync checkboxes
    $list.querySelectorAll('input.admin-checkbox').forEach((el) => {
      const uri = el.dataset.uri || '';
      el.checked = selectedUris.has(uri);
    });

    updateBulkUi_();
  });
}

if ($selectNone) {
  $selectNone.addEventListener('click', () => {
    selectedUris.clear();
    $list.querySelectorAll('input.admin-checkbox').forEach((el) => {
      el.checked = false;
    });
    updateBulkUi_();
  });
}

if ($bulkConfirm) $bulkConfirm.addEventListener('click', runBulkConfirm_);
if ($bulkDelete) $bulkDelete.addEventListener('click', runBulkDelete_);

load();
