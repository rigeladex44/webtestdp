// src/pages/admin/AdminAuditLogPage.jsx
import React, { useMemo, useState } from "react";
import { getAuditLogs as getAdminAudit } from "@/lib/adminStore.js";

const AUDIT_KEY = "admin:audit";

function fmtDT(ts) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

function prettyDetail(action, detail) {
  if (!detail) return "-";
  const d = detail || {};
  switch (action) {
    case "create_user":
      return `Buat user: ${d.username || "-"} (id: ${d.id || "-"})`;
    case "update_user":
      return `Ubah user: ${d.username || "-"} (id: ${d.id || "-"})`;
    case "delete_user":
      return `Hapus user: ${d.username || "-"} (id: ${d.id || "-"})`;
    case "seed_keu":
      return "Seeder: akun master keu dibuat";
    default:
      // fallback: stringify rapi
      try {
        return JSON.stringify(d);
      } catch {
        return String(d);
      }
  }
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState(() => (getAdminAudit() || []).sort((a, b) => (b.ts || 0) - (a.ts || 0)));
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) => {
      const a = (l.action || "").toLowerCase();
      let d = "";
      try {
        d = JSON.stringify(l.detail || {}).toLowerCase();
      } catch {}
      return a.includes(term) || d.includes(term);
    });
  }, [logs, q]);

  const exportCSV = () => {
    const header = ["ID", "Waktu", "Aksi", "Detail"];
    const rows = filtered.map((l) => [
      l.id || "",
      fmtDT(l.ts),
      l.action || "",
      prettyDetail(l.action, l.detail || {}),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "admin_audit_logs.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clearAll = () => {
    if (!confirm("Hapus semua log audit admin?")) return;
    try {
      localStorage.setItem(AUDIT_KEY, "[]");
      setLogs([]);
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Audit Admin</h2>
        <div className="ml-auto flex items-center gap-2">
          <input
            className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
            placeholder="Cari aksi / detail…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={exportCSV} className="text-sm rounded-md border px-2 py-1 hover:bg-muted/60">
            Export CSV
          </button>
          <button onClick={clearAll} className="text-sm rounded-md border px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20">
            Hapus Semua
          </button>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Waktu</th>
              <th>Aksi</th>
              <th>Detail</th>
              <th className="text-right">ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t align-top">
                <td className="py-2 whitespace-nowrap">{fmtDT(l.ts)}</td>
                <td className="whitespace-nowrap">
                  <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs">
                    {l.action}
                  </span>
                </td>
                <td className="min-w-[320px]">{prettyDetail(l.action, l.detail)}</td>
                <td className="text-right text-xs text-muted-foreground">{l.id}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  Tidak ada log untuk ditampilkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ringkas jumlah log */}
      <div className="text-xs text-muted-foreground">
        Menampilkan {filtered.length} dari {logs.length} log.
      </div>
    </div>
  );
}
