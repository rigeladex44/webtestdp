// src/pages/ProfitLoss.jsx
import React, { useMemo, useState, useEffect } from 'react';
import Button from '@/components/ui/button.jsx';
import DatePicker from '@/components/ui/date-picker.jsx';
import PtMultiSelectFilter from '@/components/ui/PtMultiSelectFilter.jsx';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { getCurrentUser } from '@/lib/auth.js';
import { PT_LIST } from '@/lib/constants.js';
import { fmtIDR } from '@/lib/utils.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const todayISO = new Date().toISOString().slice(0, 10);

// helpers
const isInType  = (t) => ['Masuk', 'income', 'Debit'].includes(String(t || '').trim());
const isOutType = (t) => ['Keluar', 'expense', 'Kredit'].includes(String(t || '').trim());
const sum = (arr, sel) => arr.reduce((s, x) => s + sel(x), 0);

function groupByCategory(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.category || 'Lainnya';
    map.set(key, (map.get(key) || 0) + r.amount);
  }
  return Array.from(map, ([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
const fmtRangeLabel = (a, b) => {
  const f = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  if (a === b) return f.format(new Date(a));
  return `${f.format(new Date(a))} s.d. ${f.format(new Date(b))}`;
};

export default function ProfitLossPage() {
  const { transactions } = useTransactions();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === 'direktur';

  const [ptFilter, setPtFilter] = useState(() =>
    isDirector ? [me.pt] : PT_LIST.map(p => p.fullName)
  );

  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);

  useEffect(() => {
    if (isDirector) {
      setPtFilter([me.pt]);
    }
  }, [isDirector, me]);

  const handleFrom = (v) => { if (!v) return; setFromDate(v <= toDate ? v : toDate); };
  const handleTo   = (v) => { if (!v) return; setToDate(v >= fromDate ? v : fromDate); };

  const periodLabel = fmtRangeLabel(fromDate, toDate);

  const { rows, incomeTotal, expenseTotal, netTotal, incomeByCat, expenseByCat } = useMemo(() => {
    const within = (d) => d >= fromDate && d <= toDate;
    const byPT = (t) => {
      if (isDirector) return (t.pt || '') === me.pt;
      if (ptFilter.length === 0) return false;
      return ptFilter.includes(t.pt || '');
    };
    const base = transactions.filter(t => within(t.date) && byPT(t));
    const rows = [...base].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    // fleksibel tipe
    const income  = rows.filter(t => isInType(t.type));
    const expense = rows.filter(t => isOutType(t.type));

    const incomeTotal  = sum(income,  x => x.amount);
    const expenseTotal = sum(expense, x => x.amount);
    const netTotal = incomeTotal - expenseTotal;

    const incomeByCat  = groupByCategory(income);
    const expenseByCat = groupByCategory(expense);

    return { rows, incomeTotal, expenseTotal, netTotal, incomeByCat, expenseByCat };
  }, [transactions, ptFilter, fromDate, toDate, isDirector, me]);

  const exportCSV = () => {
    const header = ['Tanggal', 'PT', 'Kategori', 'Diinput Oleh', 'Tipe', 'Deskripsi', 'Jumlah (Rp)'];
    const lines = rows.map(t => [
      t.date,
      PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '',
      t.category || '',
      t.operator || '',
      isInType(t.type) ? 'Masuk' : 'Keluar',
      t.desc || '',
      t.amount.toString(),
    ]);
    lines.push([]);
    lines.push(['', '', '', '', 'Total Pemasukan', '', incomeTotal.toString()]);
    lines.push(['', '', '', '', 'Total Pengeluaran', '', expenseTotal.toString()]);
    lines.push(['', '', '', '', 'Laba/Rugi', '', netTotal.toString()]);

    const csv = [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `laba-rugi_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const kasir = me?.name || me?.username || 'N/A';

    doc.setFontSize(14); doc.setFont(undefined, 'bold');
    doc.text('LAPORAN LABA RUGI', pageWidth / 2, margin, { align: 'center' });

    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    const ptTitle = isDirector ? me.pt : (ptFilter.length === PT_LIST.length ? 'SEMUA PERUSAHAAN' : ptFilter.join(' - '));
    doc.text(ptTitle, pageWidth / 2, margin + 12, { align: 'center' });
    doc.text(`Periode: ${periodLabel}`, pageWidth / 2, margin + 24, { align: 'center' });

    autoTable(doc, {
      startY: margin + 36, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5, lineWidth: 0.5, lineColor: 200 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      head: [['RINGKASAN', 'Jumlah (Rp)']],
      body: [
        ['Total Pemasukan', fmtIDR(incomeTotal)],
        ['Total Pengeluaran', fmtIDR(expenseTotal)],
        [{ content: 'Laba / Rugi', styles: { fontStyle: 'bold' } }, { content: fmtIDR(netTotal), styles: { fontStyle: 'bold' } }]
      ],
      columnStyles: { 1: { halign: 'right' } },
    });

    const tableBody = rows.map(t => {
      const ptTag = PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt;
      return [
        t.date,
        ptTag,
        t.desc,
        t.category,
        t.operator,
        isInType(t.type) ? 'Masuk' : 'Keluar',
        { content: fmtIDR(t.amount), styles: { halign: 'right' } }
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineWidth: 0.5, lineColor: 200, valign: 'middle' },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      head: [['Tanggal', 'PT', 'Deskripsi', 'Kategori', 'Diinput Oleh', 'Tipe', 'Jumlah (Rp)']],
      body: tableBody,
      columnStyles: { 2: { cellWidth: 150 } },
    });

    const signatureY = doc.lastAutoTable.finalY + 30;
    autoTable(doc, {
      startY: signatureY, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { halign: 'center', fontSize: 9, lineWidth: 0.5, lineColor: 200 },
      headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
      bodyStyles: { minCellHeight: 60, valign: 'bottom' },
      head: [['Disusun Oleh', 'Diperiksa Oleh', 'Mengetahui']],
      body: [[`( ${kasir} )`, '( _______________ )', '( _______________ )']],
    });

    doc.save(`laba-rugi_${fromDate}_${toDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-14 md:top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pt-3 pb-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-auto">
            <h2 className="text-2xl font-semibold">Laba Rugi</h2>
            <div className="text-sm text-muted-foreground mt-1 leading-6">
              <div>Periode: <span className="font-medium text-foreground">{periodLabel}</span></div>
            </div>
          </div>
          {isDirector ? (
            <div>
              <label className="text-sm block">PT</label>
              <div className="mt-1 h-10 w-full min-w-[150px] rounded-md border bg-background/50 px-3 text-sm flex items-center">
                {PT_LIST.find(p => p.fullName === me.pt)?.tag || me.pt}
              </div>
            </div>
          ) : (
            <PtMultiSelectFilter selectedPts={ptFilter} onChange={setPtFilter} />
          )}
          <DatePicker label="Tanggal Awal" value={fromDate} onChange={handleFrom} max={toDate} />
          <DatePicker label="Tanggal Akhir" value={toDate} onChange={handleTo} min={fromDate} />
          <div className="flex gap-2">
            <Button type="button" onClick={exportCSV}>Export CSV</Button>
            <Button type="button" onClick={exportPDF}>Export PDF</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Pemasukan" value={fmtIDR(incomeTotal)} />
        <Card title="Total Pengeluaran" value={fmtIDR(expenseTotal)} />
        <Card title="Laba / Rugi" value={fmtIDR(netTotal)} highlight />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-sm text-muted-foreground mb-2">Pemasukan per Kategori</div>
          <TableCat rows={incomeByCat} emptyLabel="Belum ada pemasukan" />
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted-foreground mb-2">Pengeluaran per Kategori</div>
          <TableCat rows={expenseByCat} emptyLabel="Belum ada pengeluaran" negative />
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Detail Transaksi</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Tanggal</th>
                <th>PT</th>
                <th>Kategori</th>
                <th>Diinput Oleh</th>
                <th>Tipe</th>
                <th>Deskripsi</th>
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2">{t.date}</td>
                  <td>{PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-'}</td>
                  <td>{t.category || '-'}</td>
                  <td>{t.operator || '-'}</td>
                  <td className={isInType(t.type) ? 'text-green-600' : 'text-red-500'}>
                    {isInType(t.type) ? 'Masuk' : 'Keluar'}
                  </td>
                  <td>{t.desc || '-'}</td>
                  <td className="text-right">{fmtIDR(t.amount)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">Tidak ada data pada rentang ini.</td>
                </tr>
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

function TableCat({ rows, emptyLabel, negative = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2">Kategori</th>
            <th className="text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.category} className="border-t">
              <td className="py-2">{r.category}</td>
              <td className={`text-right ${negative ? 'text-red-500' : 'text-foreground'}`}>
                {fmtIDR(r.total)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="py-4 text-center text-muted-foreground">{emptyLabel}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
