// src/pages/admin/AdminHomePage.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

import { listUsers, getAuditLogs } from "@/lib/adminStore.js";

let listLogs = () => [];
try {
  ({ listLogs } = require("@/lib/audit.js"));
} catch {}

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

export default function AdminHomePage() {
  const users = useMemo(() => listUsers(), []);
  const authLogs = useMemo(() => listLogs() || [], []);
  const adminLogs = useMemo(() => getAuditLogs() || [], []);

  const total = users.length;
  const active = users.filter((u) => u.active !== false).length;
  const inactive = total - active;
  const mustChange = users.filter((u) => u.mustChangePass === true).length;

  const byTitle = users.reduce((acc, u) => {
    const key =
      (u.jobTitle && String(u.jobTitle).trim()) ||
      (u.title && String(u.title).trim()) ||
      "lainnya";
    const norm = key.toLowerCase();
    acc[norm] = (acc[norm] || 0) + 1;
    return acc;
  }, {});
  const roles = Object.entries(byTitle);

  const recentLogins = authLogs
    .filter((l) => l.action === "login_success")
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 5);

  const recentFailed = authLogs
    .filter((l) => l.action === "login_failed")
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 5);

  const latestUsers = [...users]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  const exportUsersCSV = () => {
    const header = [
      "Nama",
      "Username",
      "Jabatan",
      "Aktif",
      "Fitur (#)",
      "PT (#)",
      "Dibuat",
    ];
    const rows = users.map((u) => [
      u.name || "",
      u.username || "",
      u.jobTitle || u.title || "",
      u.active !== false ? "Aktif" : "Nonaktif",
      Array.isArray(u.features) ? u.features.length : 0,
      Array.isArray(u.ptAccess) ? u.ptAccess.length : 0,
      u.createdAt ? fmtDT(u.createdAt) : "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Beranda Admin</h2>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/admin/users" className="text-sm underline">
            Kelola Users
          </Link>
          <button
            onClick={exportUsersCSV}
            className="text-sm rounded-md border px-2 py-1 hover:bg-muted/60"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="User Aktif" note="aktif / total terdaftar" ok>
          <div className="text-2xl font-semibold">
            {active} / {total}
          </div>
        </Card>
        <Card title="User Nonaktif">
          <div className="text-2xl font-semibold">{inactive}</div>
          <div className="text-xs text-muted-foreground mt-1">perlu di-review</div>
        </Card>
        <Card title="Wajib Ganti Password">
          <div className="text-2xl font-semibold">{mustChange}</div>
          <div className="text-xs text-muted-foreground mt-1">
            hasil reset oleh admin
          </div>
        </Card>
        <Card title="Distribusi Jabatan">
          <div className="space-y-1">
            {roles.map(([r, n]) => (
              <div key={r} className="flex items-center gap-2">
                <span className="w-24 capitalize truncate">{r}</span>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div
                    className="h-2 bg-primary rounded"
                    style={{ width: total ? `${(n / total) * 100}%` : 0 }}
                  />
                </div>
                <span className="w-12 text-right text-xs">
                  {n} {total ? `(${Math.round((n / total) * 100)}%)` : ""}
                </span>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="text-sm text-muted-foreground">Tidak ada data.</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-sm text-muted-foreground mb-2">
            Login Terakhir (Top 5)
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Nama</th>
                <th>Username</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {recentLogins.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{l.name || "-"}</td>
                  <td>{l.username}</td>
                  <td>{fmtDT(l.ts)}</td>
                </tr>
              ))}
              {recentLogins.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-muted-foreground">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <div className="text-sm text-muted-foreground mb-2">
            Percobaan Login Gagal Terakhir
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Username</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {recentFailed.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{l.username}</td>
                  <td>{fmtDT(l.ts)}</td>
                </tr>
              ))}
              {recentFailed.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-3 text-muted-foreground">
                    Tidak ada percobaan gagal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">User Terbaru</div>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Nama</th>
              <th>Username</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th>Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {latestUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.name}</td>
                <td>{u.username}</td>
                <td className="capitalize">
                  {u.jobTitle || u.title || "-"}
                </td>
                <td>{u.active !== false ? "Aktif" : "Nonaktif"}</td>
                <td>{u.createdAt ? fmtDT(u.createdAt) : "-"}</td>
              </tr>
            ))}
            {latestUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-muted-foreground">
                  Belum ada user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, note, ok, children }) {
  return (
    <div className={`card p-4 ${ok ? "border-emerald-400/50" : ""}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1">{children}</div>
      {note && <div className="text-xs text-muted-foreground mt-1">{note}</div>}
    </div>
  );
}