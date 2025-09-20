// src/pages/admin/AdminAuditPage.jsx
import React, { useMemo, useState } from 'react';
import { listAdminLogs, clearAdminLogs } from '@/lib/auth.js';

export default function AdminAuditPage() {
  const [tick, setTick] = useState(0);
  const logs = useMemo(() => listAdminLogs(500), [tick]);

  const onClear = () => {
    if (!confirm('Hapus semua log?')) return;
    clearAdminLogs();
    setTick(t => t + 1);
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_logs_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Audit Log</h2>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-sm rounded-md border px-2 py-1 hover:bg-muted/60" onClick={onExport}>Export JSON</button>
          <button className="text-sm rounded-md border px-2 py-1 hover:bg-muted/60" onClick={onClear}>Clear</button>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Waktu</th>
              <th>Aktor</th>
              <th>Aksi</th>
              <th>Target</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t align-top">
                <td className="py-2">{new Date(l.ts).toLocaleString('id-ID')}</td>
                <td>{l.actor || '-'}</td>
                <td>{l.action}</td>
                <td>{l.target || '-'}</td>
                <td className="font-mono text-xs break-all whitespace-pre-wrap">
                  {l.meta ? JSON.stringify(l.meta) : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-muted-foreground">Belum ada log.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
