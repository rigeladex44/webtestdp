// src/pages/admin/AdminHomePage.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listUsers } from '@/lib/auth.js';
import { listLogs } from '@/lib/audit.js';

function fmtDT(ts) {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export default function AdminHomePage() {
  // sumber data
  const users = useMemo(() => listUsers(), []);
  const logs  = useMemo(() => listLogs(), []);

  // ringkasan user
  const total      = users.length;
  const active     = users.filter(u => u.active).length;
  const inactive   = total - active;
  const mustChange = users.filter(u => u.mustChangePass === true).length;

  // distribusi role
  const byRole = users.reduce((acc, u) => {
    const r = (u.role || 'lainnya').toLowerCase();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const roles = Object.entries(byRole); // ex: [['admin',2],['kasir',5]]

  // login sukses terbaru (Top 5)
  const recentLogins = logs
    .filter(l => l.action === 'login_success')
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  // login gagal terbanyak / terbaru (Top 5)
  const recentFailed = logs
    .filter(l => l.action === 'login_failed')
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  // user terbaru dibuat (Top 5)
  const latestUsers = [...users]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  // export CSV users
  const exportUsersCSV = () => {
    const header = ['Nama','Username','Role','Aktif','Dibuat'];
    const rows = users.map(u => [
      u.name || '',
      u.username || '',
      u.role || '',
      u.active ? 'Aktif' : 'Nonaktif',
      u.createdAt ? fmtDT(u.createdAt) : ''
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* header kanan: tombol yang benar-benar berfungsi */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Beranda</h2>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/admin/users" className="text-sm underline">Kelola Users</Link>
          <button
            onClick={exportUsersCSV}
            className="text-sm rounded-md border px-2 py-1 hover:bg-muted/60"
          >
            Export Users CSV
          </button>
        </div>
      </div>

      {/* ringkasan kartu */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="User Aktif" note="aktif / total terdaftar" ok>
          <div className="text-2xl font-semibold">{active} / {total}</div>
        </Card>
        <Card title="User Nonaktif">
          <div className="text-2xl font-semibold">{inactive}</div>
          <div className="text-xs text-muted-foreground mt-1">perlu di-review</div>
        </Card>
        <Card title="Wajib Ganti Password">
          <div className="text-2xl font-semibold">{mustChange}</div>
          <div className="text-xs text-muted-foreground mt-1">hasil reset oleh admin</div>
        </Card>
        <Card title="Distribusi Role">
          <div className="space-y-1">
            {roles.map(([r, n]) => (
              <div key={r} className="flex items-center gap-2">
                <span className="w-24 capitalize">{r}</span>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div
                    className="h-2 bg-primary rounded"
                    style={{ width: total ? `${(n / total) * 100}%` : 0 }}
                  />
                </div>
                <span className="w-10 text-right text-xs">{n} ({total ? Math.round((n/total)*100) : 0}%)</span>
              </div>
            ))}
            {roles.length === 0 && <div className="text-sm text-muted-foreground">Tidak ada data.</div>}
          </div>
        </Card>
      </div>

      {/* dua tabel: login sukses dan gagal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-sm text-muted-foreground mb-2">Login Terakhir (Top 5)</div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">Nama</th><th>Username</th><th>Waktu</th></tr>
            </thead>
            <tbody>
              {recentLogins.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{l.name || '-'}</td>
                  <td>{l.username}</td>
                  <td>{fmtDT(l.ts)}</td>
                </tr>
              ))}
              {recentLogins.length === 0 && (
                <tr><td colSpan={3} className="py-3 text-muted-foreground">Belum ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <div className="text-sm text-muted-foreground mb-2">Percobaan Login Gagal Terakhir</div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">Username</th><th>Waktu</th></tr>
            </thead>
            <tbody>
              {recentFailed.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{l.username}</td>
                  <td>{fmtDT(l.ts)}</td>
                </tr>
              ))}
              {recentFailed.length === 0 && (
                <tr><td colSpan={2} className="py-3 text-muted-foreground">Tidak ada percobaan gagal.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* user terbaru */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">User Terbaru</div>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {latestUsers.map(u => (
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.name}</td>
                <td>{u.username}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.active ? 'Aktif' : 'Nonaktif'}</td>
                <td>{u.createdAt ? fmtDT(u.createdAt) : '-'}</td>
              </tr>
            ))}
            {latestUsers.length === 0 && (
              <tr><td colSpan={5} className="py-3 text-muted-foreground">Belum ada user.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, note, ok, children }) {
  return (
    <div className={`card p-4 ${ok ? 'border-emerald-400/50' : ''}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1">{children}</div>
      {note && <div className="text-xs text-muted-foreground mt-1">{note}</div>}
    </div>
  );
}
