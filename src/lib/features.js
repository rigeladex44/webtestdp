// src/lib/features.js
import { getCurrentUser } from "@/lib/auth.js";

export const FEATURES = {
  DASHBOARD_VIEW: "dashboard.view",
  CASHFLOW_VIEW: "cashflow.view",
  PNL_VIEW: "pnl.view",
  SALES_ENTRY: "sales.entry",
  OTHER_INCOME: "income.other",

  CASH_SJE: "report.cash.sje",
  CASH_KSS: "report.cash.kss",
  CASH_FAB: "report.cash.fab",
  CASH_SJS: "report.cash.sjs",
  CASH_KBS: "report.cash.kbs",

  PNL_SJE: "report.pnl.sje",
  PNL_KSS: "report.pnl.kss",
  PNL_FAB: "report.pnl.fab",
  PNL_SJS: "report.pnl.sjs",
  PNL_KBS: "report.pnl.kbs",

  APPROVAL_REVIEW: "approval.review",

  ADMIN_PANEL: "admin.panel",
  ADMIN_USERS: "admin.users",
  ADMIN_AUDIT: "admin.audit",

  DASHBOARD: "dashboard.view",
  CASH_SMALL: "cashflow.view",
  PROFIT_LOSS: "pnl.view",
};

const LS_KEY = "auth:features";

function loadAllFeatureMap() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveAllFeatureMap(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map || {}));
}
function userKey(u) {
  if (!u) return "_";
  return (u.username || u.name || "_").toLowerCase();
}

export function getActiveFeatures(u = getCurrentUser()) {
  const map = loadAllFeatureMap();
  const key = userKey(u);
  if (u?.features && Array.isArray(u.features)) return new Set(u.features);
  const stored = map[key];
  return new Set(Array.isArray(stored) ? stored : []);
}

export function setActiveFeatures(features = [], u = getCurrentUser()) {
  const map = loadAllFeatureMap();
  const key = userKey(u);
  map[key] = Array.from(new Set(features));
  saveAllFeatureMap(map);
}

export function hasFeature(feature, u = getCurrentUser()) {
  return getActiveFeatures(u).has(feature);
}

export function ensureDefaultFeatures() {
  const u = getCurrentUser();
  if (!u) return;

  const key = userKey(u);
  const map = loadAllFeatureMap();

  const isMasterUser = u.username?.toLowerCase() === "keu";
  const allNow = Array.from(new Set(Object.values(FEATURES)));

  if (isMasterUser) {
    const current = new Set(Array.isArray(map[key]) ? map[key] : []);
    allNow.forEach(f => current.add(f));
    map[key] = Array.from(current);
    saveAllFeatureMap(map);
    return;
  }

  if (!Array.isArray(map[key])) {
    map[key] = [
      FEATURES.DASHBOARD_VIEW,
      FEATURES.SALES_ENTRY,
      FEATURES.CASHFLOW_VIEW,
      FEATURES.PNL_VIEW,
    ];
    saveAllFeatureMap(map);
  }
}