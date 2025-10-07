// src/lib/features.js
import { getCurrentUser } from "@/lib/auth.js";

/**
 * Satu sumber kebenaran untuk kode fitur.
 * Pakai kunci canonical *.view / *.entry.
 * Disediakan alias agar kode lama tetap jalan.
 */
export const FEATURES = {
  // ---- Canonical
  DASHBOARD_VIEW: "dashboard.view",
  CASHFLOW_VIEW: "cashflow.view",
  PNL_VIEW: "pnl.view",
  SALES_ENTRY: "sales.entry",
  OTHER_INCOME: "income.other",
  ADMIN_PANEL: "admin.panel",
  ADMIN_USERS: "admin.users",
  ADMIN_AUDIT: "admin.audit",
  APPROVAL_REVIEW: "approval.review",


  // ---- Aliases (kompat untuk kode lama)
  DASHBOARD: "dashboard.view",
  CASH_SMALL: "cashflow.view",
  PROFIT_LOSS: "pnl.view",
};

const ALL_FEATURES = Array.from(new Set(Object.values(FEATURES)));
const LS_KEY = "auth:features";

/* ===============================
   Helpers penyimpanan per user
================================*/
function loadAllFeatureMap() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveAllFeatureMap(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map || {}));
}
function userKey(u) {
  if (!u) return "_";
  return (u.email || u.username || u.name || "_").toLowerCase();
}

function normalize(arr) {
  // Saat ini alias == canonical, tapi tetap distandarkan & dedup
  return Array.from(new Set((arr || []).filter(Boolean)));
}

/* ===============================
   API utama
================================*/
export function getActiveFeatures(u = getCurrentUser()) {
  const map = loadAllFeatureMap();
  const key = userKey(u);

  // Jika objek user punya field .features, utamakan itu
  if (u?.features && Array.isArray(u.features)) {
    return new Set(normalize(u.features));
  }

  const stored = normalize(map[key] || []);
  return new Set(stored);
}

export function setActiveFeatures(features = [], u = getCurrentUser()) {
  const map = loadAllFeatureMap();
  const key = userKey(u);
  map[key] = normalize(features);
  saveAllFeatureMap(map);
}

export function hasFeature(feature, u = getCurrentUser()) {
  const set = getActiveFeatures(u);
  return set.has(feature);
}

/**
 * Pastikan user keu/keu123 menjadi "master" (semua fitur aktif).
 * Jika sebelumnya sudah ada fitur tapi masih subset, akan di-upgrade.
 * Untuk user lain yang belum punya data, set default minimal.
 */
export function ensureDefaultFeatures({ forceMasterForKeu = false } = {}) {
  const u = getCurrentUser();
  if (!u) return;

  const key = userKey(u);
  const map = loadAllFeatureMap();
  const current = normalize(map[key] || []);

  const isKeuMaster =
    (u.email?.toLowerCase() === "keu") ||
    (u.username?.toLowerCase() === "keu") ||
    (u.name?.toLowerCase().includes("keu"));

  if (isKeuMaster) {
    const isSubset = current.length === 0 || current.some(f => !ALL_FEATURES.includes(f)) || ALL_FEATURES.some(f => !current.includes(f));
    if (forceMasterForKeu || isSubset) {
      map[key] = ALL_FEATURES.slice(); // grant all
      saveAllFeatureMap(map);
    }
    return;
  }

  // Non-keu: jika belum ada record, beri default minimal
  if (!map[key] || map[key].length === 0) {
    map[key] = normalize([
      FEATURES.DASHBOARD,
      FEATURES.SALES_ENTRY,
      FEATURES.CASH_SMALL,
      FEATURES.PROFIT_LOSS,
    ]);
    saveAllFeatureMap(map);
  }
}

/** Opsional: tombol darurat untuk grant semua fitur ke user aktif */
export function grantAllFeaturesForCurrentUser() {
  const u = getCurrentUser();
  if (!u) return;
  setActiveFeatures(ALL_FEATURES, u);
}
