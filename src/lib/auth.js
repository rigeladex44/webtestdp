// src/lib/auth.js
import { Audit } from '@/lib/audit.js';

export const AUTH_KEY  = 'isAuthenticated';
export const AUTH_USER = 'auth:user';
export const USERS_KEY = 'auth:users';

function uuid() {
  const c = globalThis.crypto;
  return c && typeof c.randomUUID === 'function'
    ? c.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

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

export function login({ username, password }) {
  const users = readUsers();
  const u = users.find(x => x.username === username);

  if (!u || !u.active || u.password !== password) {
    Audit.loginFailed(username);
    return { ok: false };
  }

  localStorage.setItem(AUTH_KEY, 'true');

  if (u.name) {
    try { localStorage.setItem('auth:name', u.name); } catch {}
  }

  upsertCurrentUser({
    id: u.id,
    name: u.name,
    username: u.username,
    jobTitle: u.jobTitle || u.title || '',
    ptAccess: Array.isArray(u.ptAccess) ? u.ptAccess : [],
    features: Array.isArray(u.features) ? u.features : [],
    mustChangePass: !!u.mustChangePass,
  });

  Audit.loginSuccess(u.username, u.name);
  return { ok: true, user: u };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_USER);
}

export function listUsers() {
  return readUsers();
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
      name: partial.name ?? users[idx].name,
      username: partial.username ?? users[idx].username,
      jobTitle: partial.jobTitle ?? users[idx].jobTitle,
      ptAccess: Array.isArray(partial.ptAccess) ? Array.from(new Set(partial.ptAccess)) : users[idx].ptAccess,
      features: Array.isArray(partial.features) ? Array.from(new Set(partial.features)) : users[idx].features,
    };
    writeUsers(users);
  }

  window.dispatchEvent(new Event('auth-changed'));
  return { ok: true, user: next };
}

export const getUser = getCurrentUser;