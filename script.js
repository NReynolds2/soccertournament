const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQh8sXiazn-u3JBzY1zpMQFdZKmPQMme2c_QeNraq8FLlqNH2lvtzUaEJcCmn1sN1hFuZxXytUqV81W/pub?gid=591376172&single=true&output=csv';
const SCHEDULE_DATA_URL = 'assets/schedule.json';

function setStatus(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || '';
}

function parseCSV(text) {
  const rows = [];
  let i = 0, f = '', r = [], q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i+1] === '"') { f += '"'; i += 2; continue; }
        q = false; i++; continue;
      }
      f += c; i++; continue;
    } else {
      if (c === '"') { q = true; i++; continue; }
      if (c === ',') { r.push(f); f = ''; i++; continue; }
      if (c === '\n') { r.push(f); rows.push(r); f = ''; r = []; i++; continue; }
      if (c === '\r') { i++; continue; }
      f += c; i++; continue;
    }
  }
  r.push(f);
  rows.push(r);
  return rows;
}

function buildTable(el, data) {
  if (!data || !data.length) { el.innerHTML = ''; return; }
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const hr = document.createElement('tr');
  data[0].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  for (let i = 1; i < data.length; i++) {
    const tr = document.createElement('tr');
    const rowText = data[i].join(' ').toLowerCase();
    tr.className = (rowText.includes('vs') || rowText.includes('championship')) ? 'game-row' : 'transition-row';
    data[i].forEach(c => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  el.innerHTML = '';
  el.appendChild(thead);
  el.appendChild(tbody);
}

async function loadSchedule() {
  const tbl = document.getElementById('schedule-table');
  setStatus('schedule-status', 'Loading schedule...');
  try {
    const res = await fetch(SCHEDULE_DATA_URL);
    const json = await res.json();
    const rows = [json.headers, ...json.rows];
    buildTable(tbl, rows);
    setStatus('schedule-status', '');
  } catch(e) {
    setStatus('schedule-status', 'Could not load schedule.json.');
  }
}

async function loadGoogleSheet() {
  const tbl = document.getElementById('sheet-table');
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
  if (GOOGLE_SHEET_CSV_URL.includes('PASTE')) {
    setStatus('sheet-status', 'Set your Google Sheets CSV URL.');
    return;
  }
  try {
    setStatus('sheet-status', 'Loading latest data...');
    const bust = '&t=' + Date.now();
    const res = await fetch(GOOGLE_SHEET_CSV_URL + bust);
    const text = await res.text();
    const rows = parseCSV(text);
    buildTable(tbl, rows);
    setStatus('sheet-status', 'Last updated: ' + new Date().toLocaleString());
  } catch(e) {
    setStatus('sheet-status', 'Could not load CSV.');
  }
}

document.addEventListener('DOMContentLoaded', () => { loadSchedule(); loadGoogleSheet(); });
