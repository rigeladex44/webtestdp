// src/pages/admin/AdminAuditLogPage.jsx
import React from 'react';
import { getAudits, clearAudits } from '@/lib/audit.js';
import Button from '@/components/ui/button.jsx';

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' });
}

export default function AdminAuditLogPage() {
  const [q, setQ] = React.useState('');
  const [tick, setTick] = React.useState(0);
  const data = React.useMemo(() => getAudits(), [tick]);

  const rows = data.filter(r => {
    if (!q) return true;
    const s = (r.type + ' ' + r.actor + ' ' + (r.target||'') + ' ' + (r.detail||'')).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const exportCSV = () => {
    const header = ['Waktu','Aksi','Aktor','Target','Detail'];
    const lines = rows.map(r => [fmtTime(r.ts), r.type, r.actor||'', r.target||'', r.detail||'']);
    const csv = [header, ...lines].map(a => a.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'audit-log.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Audit Log</h2>
          <div className="text-sm text-muted-foreground mt-1">Riwayat aksi user (login, reset/ganti password, dll.)</div>
        </div>
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm"
          placeholder="Cari…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <Button type="button" onClick={exportCSV}>Export CSV</Button>
        <Button
          type="button"
          className="bg-transparent border"
          onClick={() => {
            if (!confirm('Hapus semua audit log?')) return;
            clearAudits();
            setTick(t => t + 1);
          }}
        >
          Bersihkan
        </Button>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Waktu</th>
              <th>Aksi</th>
              <th>Aktor</th>
              <th>Target</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{fmtTime(r.ts)}</td>
                <td>{r.type}</td>
                <td>{r.actor || '-'}</td>
                <td>{r.target || '-'}</td>
                <td>{r.detail || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-muted-foreground">Belum ada log.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
