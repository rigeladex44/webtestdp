// src/lib/pt-access.js
import { getCurrentUser } from "@/lib/auth.js";
import { PT_LIST } from "@/lib/constants.js";

const LS_KEY = "auth:ptAccess"; // map per user -> array fullName PT

function loadAllPtMap() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveAllPtMap(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map || {}));
}
function userKey(u) {
  if (!u) return "_";
  return (u.email || u.username || u.name || "_").toLowerCase();
}

/** Ambil daftar PT (fullName) yang boleh diakses user */
export function getAllowedPTsForUser(u = getCurrentUser()) {
  const map = loadAllPtMap();
  const key = userKey(u);
  const arr = map[key];
  if (Array.isArray(arr) && arr.length) return arr;

  // fallback: kalau belum diset, kasih semua untuk master (keu), kosong untuk lainnya
  const isKeuMaster =
    (u?.email?.toLowerCase() === "keu") ||
    (u?.username?.toLowerCase() === "keu") ||
    (u?.name || "").toLowerCase().includes("keu");

  return isKeuMaster ? PT_LIST.map(p => p.fullName) : [];
}

/** Set daftar PT untuk user tertentu (dipakai saat admin pilih akses PT) */
export function setAllowedPTsForUser(ptsFullName = [], u = getCurrentUser()) {
  const map = loadAllPtMap();
  const key = userKey(u);
  map[key] = Array.from(new Set(ptsFullName));
  saveAllPtMap(map);
}

/** Cek apakah user boleh akses PT tertentu (pakai fullName) */
export function canAccessPT(ptFullName, u = getCurrentUser()) {
  const pts = getAllowedPTsForUser(u);
  return pts.includes(ptFullName);
}

/** Pastikan user keu dapat semua PT di awal (sekali) */
export function ensureDefaultPTAccess() {
  const u = getCurrentUser();
  if (!u) return;
  const map = loadAllPtMap();
  const key = userKey(u);
  if (Array.isArray(map[key]) && map[key].length) return;

  const isKeuMaster =
    (u.email?.toLowerCase() === "keu") ||
    (u.username?.toLowerCase() === "keu") ||
    (u.name || "").toLowerCase().includes("keu");

  if (isKeuMaster) {
    map[key] = PT_LIST.map(p => p.fullName);
    saveAllPtMap(map);
  }
}
