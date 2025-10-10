// src/lib/pt-access.js
import { getCurrentUser } from "@/lib/auth.js";
import { PT_LIST } from "@/lib/constants.js";

const LS_KEY = "auth:ptAccess";

function loadAllPtMap() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveAllPtMap(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map || {}));
}
function userKey(u) {
  if (!u) return "_";
  return (u.username || u.name || "_").toLowerCase();
}

export function getAllowedPTsForUser(u = getCurrentUser()) {
  const map = loadAllPtMap();
  const key = userKey(u);
  const arr = map[key];
  if (Array.isArray(arr) && arr.length) return arr;

  // FIXED: fallback untuk user keu saja
  const isKeuMaster = u?.username?.toLowerCase() === "keu";
  return isKeuMaster ? PT_LIST.map(p => p.fullName) : [];
}

export function setAllowedPTsForUser(ptsFullName = [], u = getCurrentUser()) {
  const map = loadAllPtMap();
  const key = userKey(u);
  map[key] = Array.from(new Set(ptsFullName));
  saveAllPtMap(map);
}

export function canAccessPT(ptFullName, u = getCurrentUser()) {
  const pts = getAllowedPTsForUser(u);
  return pts.includes(ptFullName);
}

export function ensureDefaultPTAccess() {
  const u = getCurrentUser();
  if (!u) return;
  const map = loadAllPtMap();
  const key = userKey(u);
  if (Array.isArray(map[key]) && map[key].length) return;

  // FIXED: hanya user keu yang dapat semua PT
  const isKeuMaster = u.username?.toLowerCase() === "keu";

  if (isKeuMaster) {
    map[key] = PT_LIST.map(p => p.fullName);
    saveAllPtMap(map);
  }
}