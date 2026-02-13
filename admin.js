// Admin UI for reviewing and confirming playlist requests
// Uses the same API_BASE strategy as playlist.js (local dev -> localhost:8888)
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8888'
  : '';

const LIST_ENDPOINT = `${API_BASE}/api/admin/requests`;
const CONFIRM_ENDPOINT = `${API_BASE}/api/admin/confirm`;

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

    render(items);
    setMsg(`Demandes: ${items.length}`);
  } catch (err) {
    console.error(err);
    setMsg('Impossible de charger les demandes (serveur non joignable ?).', 'error');
  }
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
    meta.innerHTML = `
      <div class="admin-uri"><code>${escapeHtml(entry.uri || '')}</code></div>
      <div class="admin-sub">
        <span class="pill">${escapeHtml(entry.status || 'pending')}</span>
        <span class="muted">Demandé: ${escapeHtml(fmtDate(entry.ts))}</span>
        ${entry.confirmedAt ? `<span class="muted">Confirmé: ${escapeHtml(fmtDate(entry.confirmedAt))}</span>` : ''}
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'admin-btn admin-confirm';
    confirmBtn.textContent = 'Confirmer ajouté';

    if (entry.status === 'confirmed') {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Confirmé ✓';
    }

    confirmBtn.addEventListener('click', async () => {
      await confirm(entry.uri, confirmBtn);
    });

    actions.appendChild(confirmBtn);

    row.appendChild(meta);
    row.appendChild(actions);
    $list.appendChild(row);
  });
}

async function confirm(uri, btn) {
  if (!uri) return;

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Confirmation…';
  setMsg('Confirmation en cours…');

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

    btn.textContent = 'Confirmé ✓';
    setMsg('Demande confirmée.');

    // refresh list to reflect status + timestamps
    setTimeout(load, 250);
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
