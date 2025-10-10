// src/lib/adminStore.js
import { FEATURES } from "@/lib/features.js";

/* ========= LocalStorage keys (sinkron dgn auth.js) ========= */
const USERS_KEY_NEW = "auth:users";
const USERS_KEY_OLD = "admin:users";
const AUDIT_KEY     = "admin:audit";

/* ========= Helpers ========= */
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val ?? null));
}
function uuid() {
  const c = globalThis.crypto;
  return c?.randomUUID ? c.randomUUID() : (Date.now() + Math.random().toString(16).slice(2));
}

/** Migrasi sekali dari admin:users -> auth:users agar konsisten */
(function migrateOnce() {
  const newHas = localStorage.getItem(USERS_KEY_NEW);
  const oldHas = localStorage.getItem(USERS_KEY_OLD);
  if (!newHas && oldHas) {
    localStorage.setItem(USERS_KEY_NEW, oldHas);
    localStorage.removeItem(USERS_KEY_OLD);
  }
})();

/* ========= Audit log ========= */
function loadAudit() { return readJSON(AUDIT_KEY, []); }
function saveAudit(list) { writeJSON(AUDIT_KEY, list); }
function addAuditLog({ action, detail }) {
  const logs = loadAudit();
  logs.unshift({ id: uuid(), ts: Date.now(), action, detail: detail || {} });
  saveAudit(logs);
}

/* ========= Users storage ========= */
function loadUsers() { return readJSON(USERS_KEY_NEW, []); }
function saveUsers(list) { writeJSON(USERS_KEY_NEW, list || []); }

/* ========= Public API yang dipakai AdminUsersPage ========= */
export function listUsers() {
  return loadUsers();
}

export function upsertUser(form) {
  const users = loadUsers();
  const now = Date.now();

  const payload = {
    id: form.id || null,
    name: (form.name || "").trim(),
    jobTitle: (form.title || form.jobTitle || "").trim(),
    username: (form.username || "").trim(),
    password: String(form.password ?? ""),
    features: Array.isArray(form.features) ? Array.from(new Set(form.features)) : [],
    ptAccess: Array.isArray(form.ptAccess) ? Array.from(new Set(form.ptAccess)) : [],
    active: form.active !== false,
  };

  if (!payload.name || !payload.username || !payload.password) {
    throw new Error("Nama, username, dan password wajib diisi");
  }

  // UPDATE
  if (payload.id) {
    const idx = users.findIndex(u => u.id === payload.id);
    if (idx === -1) throw new Error("User tidak ditemukan");

    const taken = users.some(u => u.username === payload.username && u.id !== payload.id);
    if (taken) throw new Error("Username sudah dipakai");

    users[idx] = {
      ...users[idx],
      name: payload.name,
      jobTitle: payload.jobTitle,
      username: payload.username,
      password: payload.password || users[idx].password,
      features: payload.features,
      ptAccess: payload.ptAccess,
      active: payload.active,
      updatedAt: now,
    };
    saveUsers(users);
    addAuditLog({ action: "update_user", detail: { id: users[idx].id, username: users[idx].username } });
    return users[idx];
  }

  // CREATE
  const exists = users.some(u => u.username === payload.username);
  if (exists) throw new Error("Username sudah dipakai");

  const user = {
    id: uuid(),
    name: payload.name,
    jobTitle: payload.jobTitle,
    username: payload.username,
    password: payload.password,
    features: payload.features,
    ptAccess: payload.ptAccess,
    active: payload.active,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  saveUsers(users);
  addAuditLog({ action: "create_user", detail: { id: user.id, username: user.username } });
  return user;
}

export function deleteUser(id) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  const removed = users.splice(idx, 1)[0];
  saveUsers(users);
  addAuditLog({ action: "delete_user", detail: { id, username: removed?.username } });
  return true;
}

export function getAuditLogs() {
  return loadAudit();
}

/* ========= Seeder: User Master (keu/keu123) ========= */
export function ensureMaster() {
  const users = loadUsers();
  const masterExists = users.some(u => u.username === "keu");
  
  if (!masterExists) {
    const allFeatures = Object.values(FEATURES);
    const allPTs = [
      "PT KHALISA SALMA SEJAHTERA",
      "PT SUMBER JAYA ELPIJI",
      "PT FADILLAH AMANAH BERSAMA",
      "PT SRI JOYO SHAKTI",
      "PT KHABITSA INDOGAS"
    ];
    
    const masterUser = {
      id: uuid(),
      name: "Master User",
      jobTitle: "Super Administrator",
      username: "keu",
      password: "keu123",
      features: allFeatures,
      ptAccess: allPTs,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    users.push(masterUser);
    saveUsers(users);
    addAuditLog({ 
      action: "seed_master", 
      detail: { username: masterUser.username, note: "User master otomatis dibuat" } 
    });
    
    console.log("✅ User master 'keu/keu123' berhasil dibuat (Super User)");
  }
}

export { FEATURES };