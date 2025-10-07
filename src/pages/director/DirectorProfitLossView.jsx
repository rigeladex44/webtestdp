// src/pages/director/DirectorProfitLossView.jsx
import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/button.jsx';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { getCurrentUser } from '@/lib/auth.js';
import { PT_LIST } from '@/lib/constants.js';
import { fmtIDR } from '@/lib/utils.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const sum = (arr, sel) => arr.reduce((s, x) => s + sel(x), 0);
const fmtRange = (a,b) => {
  const f = new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  return a===b ? f.format(new Date(a)) : `${f.format(new Date(a))} s.d. ${f.format(new Date(b))}`;
};

export default function DirectorProfitLossView() {
  const { transactions } = useTransactions();
  const me = useMemo(() => getCurrentUser(), []);
  const myPT = me?.pt || '';

  const today = new Date().toISOString().slice(0,10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const rows = useMemo(() => {
    const within = (d) => d >= fromDate && d <= toDate;
    return transactions
      .filter(t => (t.pt || '') === myPT && within(t.date))
      .sort((a,b) => (a.createdAt??0)-(b.createdAt??0));
  }, [transactions, myPT, fromDate, toDate]);

  const income  = rows.filter(t => String(t.type).toLowerCase().includes('masuk') || String(t.type).toLowerCase()==='income');
  const expense = rows.filter(t => String(t.type).toLowerCase().includes('keluar')|| String(t.type).toLowerCase()==='expense');

  const incomeTotal  = sum(income,  x=>x.amount);
  const expenseTotal = sum(expense, x=>x.amount);
  const netTotal     = incomeTotal - expenseTotal;

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14); doc.setFont(undefined,'bold');
    doc.text('DETAIL LABA RUGI (Direktur - Read Only)', pageWidth/2, margin, { align: 'center' });

    doc.setFontSize(10); doc.setFont(undefined,'normal');
    const ptTitle = PT_LIST.find(p => p.fullName === myPT)?.tag || myPT;
    doc.text(`${ptTitle} — Periode: ${fmtRange(fromDate,toDate)}`, pageWidth/2, margin+14, { align: 'center' });

    autoTable(doc, {
      startY: margin+26, margin:{left:margin,right:margin}, theme:'grid',
      styles:{fontSize:9, cellPadding:5, lineWidth:0.5, lineColor:200},
      headStyles:{fillColor:[240,240,240], textColor:0, fontStyle:'bold'},
      head:[['Ringkasan','Jumlah (Rp)']],
      body:[
        ['Total Pemasukan', fmtIDR(incomeTotal)],
        ['Total Pengeluaran', fmtIDR(expenseTotal)],
        [{content:'Laba / Rugi', styles:{fontStyle:'bold'}}, {content:fmtIDR(netTotal), styles:{fontStyle:'bold'}}],
      ],
      columnStyles:{1:{halign:'right'}},
    });

    const body = rows.map(t => {
      const tag = PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-';
      return [t.date, tag, t.desc || '-', t.category || '-', t.operator || '-', t.type, { content: fmtIDR(t.amount), styles:{halign:'right'} }];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12, margin:{left:margin,right:margin}, theme:'grid',
      styles:{fontSize:8, cellPadding:4, lineWidth:0.5, lineColor:200, valign:'middle'},
      headStyles:{fillColor:[240,240,240], textColor:0, fontStyle:'bold'},
      head:[['Tanggal','PT','Deskripsi','Kategori','Diinput','Tipe','Jumlah (Rp)']],
      body,
      columnStyles:{2:{cellWidth:150}},
    });

    doc.save(`detail-laba-rugi_${fromDate}_${toDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Detail Laba Rugi</h2>
          <div className="text-sm text-muted-foreground mt-1">
            PT: <span className="font-medium text-foreground">{PT_LIST.find(p => p.fullName === myPT)?.tag || myPT}</span>
          </div>
        </div>
        <div>
          <label className="text-sm block">Tanggal Awal</label>
          <input type="date" className="h-10 rounded-md border bg-background px-3 text-sm" value={fromDate} onChange={(e)=>setFromDate(e.target.value <= toDate ? e.target.value : toDate)} />
        </div>
        <div>
          <label className="text-sm block">Tanggal Akhir</label>
          <input type="date" className="h-10 rounded-md border bg-background px-3 text-sm" value={toDate} onChange={(e)=>setToDate(e.target.value >= fromDate ? e.target.value : fromDate)} />
        </div>
        <Button type="button" onClick={exportPDF}>Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Pemasukan" value={fmtIDR(incomeTotal)} />
        <Card title="Total Pengeluaran" value={fmtIDR(expenseTotal)} />
        <Card title="Laba / Rugi" value={fmtIDR(netTotal)} highlight />
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Detail Transaksi (read-only)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Tanggal</th>
                <th>PT</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Diinput</th>
                <th>Tipe</th>
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, idx) => (
                <tr key={t.id ?? idx} className="border-t">
                  <td className="py-2">{t.date}</td>
                  <td>{PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-'}</td>
                  <td>{t.desc || '-'}</td>
                  <td>{t.category || '-'}</td>
                  <td>{t.operator || '-'}</td>
                  <td className={String(t.type).toLowerCase().includes('masuk') ? 'text-green-600' : 'text-red-500'}>
                    {String(t.type).toLowerCase().includes('masuk') ? 'Masuk' : 'Keluar'}
                  </td>
                  <td className="text-right">{fmtIDR(t.amount)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">Tidak ada data pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? 'border-primary/40' : ''}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
