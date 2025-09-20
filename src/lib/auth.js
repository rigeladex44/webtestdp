// src/lib/auth.js
import { Audit } from '@/lib/audit.js';

export const AUTH_KEY  = 'isAuthenticated'; // session flag
export const AUTH_USER = 'auth:user';       // user yang sedang login (session)
export const USERS_KEY = 'auth:users';      // daftar semua user (admin kelola)

// ===== util =====
function uuid() {
  const c = globalThis.crypto;
  return c && typeof c.randomUUID === 'function'
    ? c.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

// ===== storage helpers =====
function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeUsers(arr) {
  localStorage.setItem(USERS_KEY, JSON.stringify(arr));
}
function upsertCurrentUser(u) {
  localStorage.setItem(AUTH_USER, JSON.stringify(u));
}

// ===== session helpers =====
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

// ===== seed default (first run) =====
export function ensureDefaults() {
  const seeded = readUsers();
  if (seeded.length) return;

  const now = Date.now();
  const defaults = [
    { id: uuid(), name: 'Administrator', username: 'admin', password: 'admin123', role: 'admin',    active: true, createdAt: now },
    { id: uuid(), name: 'Kasir',         username: 'kasir', password: 'kasir123', role: 'kasir',    active: true, createdAt: now },
    { id: uuid(), name: 'Keuangan',      username: 'keu',   password: 'keu123',   role: 'keuangan', active: true, createdAt: now },

    // Contoh 1 direktur (optional). Tambah via Admin Users Page untuk PT lain.
    // { id: uuid(), name: 'Direktur KSS', username: 'dir_kss', password: 'dir123', role: 'direktur', pt: 'PT KSS', active: true, createdAt: now },
  ];
  writeUsers(defaults);
}

// ===== auth =====
export function login({ username, password }) {
  ensureDefaults();
  const users = readUsers();
  const u = users.find(x => x.username === username);

  if (!u || !u.active || u.password !== password) {
    Audit.loginFailed(username);
    return { ok: false };
  }

  localStorage.setItem(AUTH_KEY, 'true');
  upsertCurrentUser({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    pt: u.pt,                 // ⬅️ penting: PT ikut tersimpan di session user
    mustChangePass: !!u.mustChangePass,
  });

  Audit.loginSuccess(u.username);
  return { ok: true, user: u };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_USER);
}

// ===== users (admin) =====
export function listUsers() {
  ensureDefaults();
  return readUsers();
}

export function createUser({ name, username, password, role = 'kasir', active = true, pt = '' }) {
  if (!username || !password) return { ok: false, error: 'username/password wajib' };
  if (role === 'direktur' && !pt) return { ok: false, error: 'Direktur wajib memilih PT' };

  const users = readUsers();
  if (users.some(u => u.username === username)) {
    return { ok: false, error: 'Username sudah dipakai' };
  }

  const u = {
    id: uuid(),
    name: name || username,
    username,
    password,
    role,
    active,
    pt: pt || undefined,  // ⬅️ simpan PT bila ada
    createdAt: Date.now(),
  };
  users.push(u);
  writeUsers(users);

  const actor = getCurrentUser()?.username || 'admin';
  Audit.createUser(actor, u.username, u.role);
  return { ok: true };
}

export function setActive(id, active) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { ok: false, error: 'User tidak ditemukan' };

  users[idx].active = !!active;
  writeUsers(users);

  const actor = getCurrentUser()?.username || 'admin';
  Audit.setActive(actor, users[idx].username, !!active);
  return { ok: true };
}

export function adminResetPassword(id) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { ok: false, error: 'User tidak ditemukan' };

  const temp = 'SJ' + Math.random().toString(36).slice(2, 8).toUpperCase();
  users[idx].password = temp;
  users[idx].mustChangePass = true;
  writeUsers(users);

  const actor = getCurrentUser()?.username || 'admin';
  Audit.adminReset(actor, users[idx].username);
  return { ok: true, tempPassword: temp };
}

// ===== self-service =====
export function changePassword({ oldPass, newPass }) {
  const me = getCurrentUser();
  if (!me) return { ok: false, error: 'Belum login' };

  const users = readUsers();
  const idx = users.findIndex(u => u.id === me.id);
  if (idx === -1) return { ok: false, error: 'User tidak ditemukan' };
  if (users[idx].password !== oldPass) return { ok: false, error: 'Password lama salah' };

  users[idx].password = newPass;
  users[idx].mustChangePass = false;
  writeUsers(users);
  upsertCurrentUser({ ...me, mustChangePass: false });

  Audit.changePassword(me.username);
  return { ok: true };
}

// Memperbarui profil user yang sedang login + sync ke USERS
export function setUser(partial) {
  const me = getCurrentUser();
  if (!me) return { ok: false, error: 'Belum login' };

  const next = { ...me, ...partial };
  upsertCurrentUser(next);

  const users = readUsers();
  const idx = users.findIndex(u => u.id === me.id);
  if (idx !== -1) {
    users[idx] = {
      ...users[idx],
      name:     partial.name     ?? users[idx].name,
      username: partial.username ?? users[idx].username,
      role:     partial.role     ?? users[idx].role,
      pt:       partial.pt       ?? users[idx].pt,
    };
    writeUsers(users);
  }

  window.dispatchEvent(new Event('auth-changed'));
  return { ok: true, user: next };
}

// Alias utk kompatibilitas kode lama
export const getUser = getCurrentUser;
