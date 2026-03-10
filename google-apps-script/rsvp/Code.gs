/**
 * RSVP Apps Script backend (Web App)
 *
 * Contract:
 * - GET  ?route=/api/rsvp/check&email=...
 *   -> { found: boolean, prenom?: string, nom?: string }
 * - GET  ?route=/api/rsvp/submit&presence=...&... (query params)
 *   -> { success: true }
 *
 * Storage:
 * - Spreadsheet ID: 10x9ZYyf7-Y9RJkuOtDB0MycF-13ESPIhNTvycDCDt4U
 * - Sheet name: "Réponses au formulaire 1"
 * - Append rows without modifying headers.
 */

const RSVP_CONFIG = {
  spreadsheetId: '10x9ZYyf7-Y9RJkuOtDB0MycF-13ESPIhNTvycDCDt4U',
  sheetName: 'Réponses au formulaire 1',

  // Column titles must match exactly (row 1) for robust mapping.
  headers: {
    ts: 'Horodateur',
    presence: 'Est-ce que je serai présent pour ce mariage du siècle ?',
    nomCompletNo: "Indique nous ton nom complet que l'on puisse bien confirmer l'info",
    nom: 'Indique ton nom de famille',
    prenom: 'Indique ton prénom',
    email: 'Indique ton adresse email',
    telephone: 'Indique ton numéro de téléphone',
    codePostal: 'Indique ton code postal',
    ville: 'Indique ta ville',
    adresse1: 'Indique ton adresse (ligne 1)',
    regime: 'Régime alimentaire particulier',
    alcool: 'Préférence alcoolémie ',
    allergie: 'As-tu une allergie alimentaire quelconque ?'
  }
};

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const route = params.route || '';

    if (route === '/api/rsvp/check') return json_(handleRsvpCheck_(params));
    if (route === '/api/rsvp/submit') return json_(handleRsvpSubmit_(params));

    return json_({ ok: true, route: route || null });
  } catch (err) {
    return json_({ success: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

function json_(obj, status) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // Note: Apps Script Web App doesn't let us set HTTP status in all deployments;
  // we keep it in the payload and let the client treat success=false as failure.
  return output;
}

function openRsvpSheet_() {
  const ss = SpreadsheetApp.openById(RSVP_CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(RSVP_CONFIG.sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${RSVP_CONFIG.sheetName}`);
  return sheet;
}

function headerIndexMap_(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headerRow.forEach((h, idx) => {
    const key = String(h || '').trim();
    if (key) map[key] = idx;
  });
  return map;
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail_(email) {
  const s = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function handleRsvpCheck_(params) {
  const email = normalizeEmail_(params.email);
  if (!email) return { found: false };
  if (!isValidEmail_(email)) return { found: false };

  const sheet = openRsvpSheet_();
  const map = headerIndexMap_(sheet);

  const emailCol = map[RSVP_CONFIG.headers.email];
  const prenomCol = map[RSVP_CONFIG.headers.prenom];
  const nomCol = map[RSVP_CONFIG.headers.nom];

  if (emailCol === undefined) throw new Error('Email column not found in header row');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { found: false };

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    const rowEmail = normalizeEmail_(row[emailCol]);
    if (rowEmail && rowEmail === email) {
      return {
        found: true,
        prenom: prenomCol !== undefined ? String(row[prenomCol] || '') : '',
        nom: nomCol !== undefined ? String(row[nomCol] || '') : ''
      };
    }
  }

  return { found: false };
}

function handleRsvpSubmit_(params) {
  const presence = String(params.presence || '').trim();
  if (!presence) return { success: false, message: 'presence_missing' };

  // If presence is YES, email is mandatory.
  const isYes = presence === 'Oui, je serai là';
  const isNo = presence === 'Désolé, je ne pourrai pas venir :(';

  if (!isYes && !isNo) {
    // Still accept anything (in case the label changes) but keep behavior predictable.
    // We'll treat unknown as yes flow if it has email.
  }

  const payload = {
    presence,
    nomComplet: String(params.nomComplet || '').trim(),
    nom: String(params.nom || '').trim(),
    prenom: String(params.prenom || '').trim(),
    email: normalizeEmail_(params.email),
    telephone: String(params.telephone || '').trim(),
    codePostal: String(params.codePostal || '').trim(),
    ville: String(params.ville || '').trim(),
    adresse1: String(params.adresse1 || '').trim(),
    regime: String(params.regime || '').trim(),
    alcool: String(params.alcool || '').trim(),
    allergie: String(params.allergie || '').trim(),
  };

  if (isYes) {
    if (!payload.nom || !payload.prenom || !payload.email || !payload.telephone || !payload.codePostal || !payload.ville || !payload.adresse1) {
      return { success: false, message: 'missing_required_fields' };
    }
    if (!isValidEmail_(payload.email)) return { success: false, message: 'invalid_email' };
  } else {
    // NO flow: only nomComplet required
    if (!payload.nomComplet) return { success: false, message: 'missing_full_name' };
  }

  // Prevent duplicates by email (only for YES flow)
  if (isYes) {
    const existing = handleRsvpCheck_({ email: payload.email });
    if (existing && existing.found) {
      return { success: false, message: 'already_submitted' };
    }
  }

  const sheet = openRsvpSheet_();
  const map = headerIndexMap_(sheet);

  // Build row with empty cells, then fill only known columns.
  const row = new Array(sheet.getLastColumn()).fill('');

  const now = new Date();
  row[map[RSVP_CONFIG.headers.ts]] = now;
  row[map[RSVP_CONFIG.headers.presence]] = payload.presence;

  // NO flow: fill the "full name" column.
  if (payload.nomComplet) row[map[RSVP_CONFIG.headers.nomCompletNo]] = payload.nomComplet;

  // YES flow: fill detailed columns.
  if (payload.nom) row[map[RSVP_CONFIG.headers.nom]] = payload.nom;
  if (payload.prenom) row[map[RSVP_CONFIG.headers.prenom]] = payload.prenom;
  if (payload.email) row[map[RSVP_CONFIG.headers.email]] = payload.email;
  if (payload.telephone) row[map[RSVP_CONFIG.headers.telephone]] = payload.telephone;
  if (payload.codePostal) row[map[RSVP_CONFIG.headers.codePostal]] = payload.codePostal;
  if (payload.ville) row[map[RSVP_CONFIG.headers.ville]] = payload.ville;
  if (payload.adresse1) row[map[RSVP_CONFIG.headers.adresse1]] = payload.adresse1;

  if (payload.regime) row[map[RSVP_CONFIG.headers.regime]] = payload.regime;
  if (payload.alcool) row[map[RSVP_CONFIG.headers.alcool]] = payload.alcool;
  if (payload.allergie) row[map[RSVP_CONFIG.headers.allergie]] = payload.allergie;

  // Guard: ensure all required columns exist.
  const requiredHeaders = [
    RSVP_CONFIG.headers.ts,
    RSVP_CONFIG.headers.presence,
    RSVP_CONFIG.headers.nomCompletNo,
    RSVP_CONFIG.headers.email,
  ];
  requiredHeaders.forEach((h) => {
    if (map[h] === undefined) throw new Error(`Missing header in sheet: ${h}`);
  });

  sheet.appendRow(row);
  return { success: true };
}
