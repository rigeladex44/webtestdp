// src/lib/audit.js
const KEY = 'audit:logs';

function uuid() {
  const c = globalThis.crypto;
  return c && typeof c.randomUUID === 'function'
    ? c.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
}
function push(entry) {
  const arr = read();
  arr.push(entry);
  write(arr);
}

// API untuk dipakai modul lain
export const Audit = {
  push,
  loginSuccess(username, name) {
    push({ id: uuid(), ts: Date.now(), action: 'login_success', username, name });
  },
  loginFailed(username) {
    push({ id: uuid(), ts: Date.now(), action: 'login_failed', username });
  },
  createUser(actor, target, role) {
    push({ id: uuid(), ts: Date.now(), action: 'create_user', actor, target, role });
  },
  setActive(actor, target, active) {
    push({ id: uuid(), ts: Date.now(), action: 'set_active', actor, target, active });
  },
  adminReset(actor, target) {
    push({ id: uuid(), ts: Date.now(), action: 'reset_password', actor, target });
  },
  changePassword(username) {
    push({ id: uuid(), ts: Date.now(), action: 'change_password', username });
  },
};

// daftar log terbaru (desc)
export function listLogs() {
  return read().sort((a, b) => b.ts - a.ts);
}
export function clearLogs() {
  localStorage.removeItem(KEY);
}

/* ===== ALIAS untuk kompatibilitas halaman admin ===== */
// beberapa file mengimpor getAudits/clearAudits
export const getAudits = listLogs;
export const clearAudits = clearLogs;
