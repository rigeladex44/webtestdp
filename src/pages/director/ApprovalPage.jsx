// src/pages/director/ApprovalPage.jsx
import React, { useMemo } from 'react';
import Button from '@/components/ui/button.jsx';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { getCurrentUser } from '@/lib/auth.js';
import { PT_LIST } from '@/lib/constants.js';
import { fmtIDR } from '@/lib/utils.js';

const NEED_APPROVAL_LIMIT = 300_000;

function isOutType(t) {
  const s = String(t || '').trim().toLowerCase();
  return s === 'keluar' || s === 'expense' || s === 'kredit';
}

export default function ApprovalPage() {
  const { transactions, update } = useTransactions();
  const me = useMemo(() => getCurrentUser(), []);
  const myPT = me?.pt || '';
  const isDirector = me?.role === 'direktur';

  const rows = useMemo(() => {
    if (!isDirector) return [];
    return transactions
      .filter(t =>
        t &&
        t.affectsCash === true &&                   // hanya kas kecil
        (t.pt || '') === myPT &&                    // hanya PT-nya direktur
        isOutType(t.type) &&                        // pengeluaran
        Number(t.amount || 0) > NEED_APPROVAL_LIMIT // di atas limit
      )
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  }, [transactions, isDirector, myPT]);

  const approve = (id) => update(id, { approvalStatus: 'approved', approvedBy: me?.name || 'Direktur', approvedAt: Date.now() });
  const reject  = (id) => update(id, { approvalStatus: 'rejected', rejectedBy: me?.name || 'Direktur', rejectedAt: Date.now() });

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Approval Pengeluaran</h2>
          <div className="text-sm text-muted-foreground mt-1">
            PT: <span className="font-medium text-foreground">{PT_LIST.find(p => p.fullName === myPT)?.tag || myPT}</span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Pengeluaran yang memerlukan persetujuan (&gt; Rp300.000)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Tanggal</th>
                <th>PT</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Diinput Oleh</th>
                <th className="text-right">Jumlah</th>
                <th>Status</th>
                <th className="text-right w-[220px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => {
                const status = t.approvalStatus || 'pending';
                const tag = PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-';
                return (
                  <tr key={t.id} className="border-t">
                    <td className="py-2">{t.date}</td>
                    <td>{tag}</td>
                    <td>{t.desc || '-'}</td>
                    <td>{t.category || '-'}</td>
                    <td>{t.operator || '-'}</td>
                    <td className="text-right text-red-500">- {fmtIDR(t.amount)}</td>
                    <td className="capitalize">
                      {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button type="button" className="h-8 px-3" onClick={() => approve(t.id)} disabled={status === 'approved'}>
                          Approve
                        </Button>
                        <Button type="button" className="h-8 px-3 bg-red-600 hover:bg-red-700" onClick={() => reject(t.id)} disabled={status === 'rejected'}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-muted-foreground">
                    Tidak ada pengeluaran yang menunggu persetujuan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
