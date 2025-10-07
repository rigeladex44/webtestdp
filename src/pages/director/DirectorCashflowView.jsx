// src/pages/director/DirectorCashflowView.jsx
import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/button.jsx';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { getCurrentUser } from '@/lib/auth.js';
import { PT_LIST } from '@/lib/constants.js';
import { fmtIDR } from '@/lib/utils.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const todayISO = new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Intl.DateTimeFormat('id-ID', { day:'2-digit',month:'long',year:'numeric' }).format(new Date(d));

const isIn  = (t) => ['masuk','income','debit'].includes(String(t||'').toLowerCase());
const isOut = (t) => ['keluar','expense','kredit'].includes(String(t||'').toLowerCase());

export default function DirectorCashflowView() {
  const { transactions } = useTransactions();
  const me = useMemo(() => getCurrentUser(), []);
  const myPT = me?.pt || '';
  const [date, setDate] = useState(todayISO);

  const list = useMemo(() => {
    return transactions
      .filter(t =>
        t.date === date &&
        t.affectsCash === true &&
        (t.pt || '') === myPT
      )
      .sort((a,b) => (a.createdAt??0) - (b.createdAt??0));
  }, [transactions, date, myPT]);

  const totalIn  = list.reduce((s,t)=> s + (isIn(t.type) ? t.amount : 0), 0);
  const totalOut = list.reduce((s,t)=> s + (isOut(t.type) ? t.amount : 0), 0);
  const saldo    = totalIn - totalOut;

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14); doc.setFont(undefined, 'bold');
    doc.text('DETAIL KAS KECIL (Direktur - Read Only)', pageWidth/2, margin, { align: 'center' });

    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    const ptTitle = PT_LIST.find(p => p.fullName === myPT)?.tag || myPT;
    doc.text(`${ptTitle} — ${fmtDate(date)}`, pageWidth/2, margin + 14, { align: 'center' });

    let running = 0;
    const body = list.map((t,i) => {
      const masuk = isIn(t.type) ? t.amount : 0;
      const keluar = isOut(t.type) ? t.amount : 0;
      running += (masuk - keluar);
      const tag = PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-';
      return [i+1, t.date, tag, t.desc || '-', t.operator || '-', fmtIDR(masuk), fmtIDR(keluar), fmtIDR(running)];
    });

    autoTable(doc, {
      startY: margin + 26, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineWidth: 0.5, lineColor: 200 },
      headStyles: { fillColor: [240,240,240], textColor: 0, fontStyle: 'bold' },
      head: [['No','Tanggal','PT','Subjek','Diinput Oleh','Masuk (Rp)','Keluar (Rp)','Saldo (Rp)']],
      body,
      foot: [[{content:'TOTAL', colSpan:5, styles:{halign:'right', fontStyle:'bold'}}, fmtIDR(totalIn), fmtIDR(totalOut), fmtIDR(saldo)]],
      footStyles: { fillColor: [255,255,255] }
    });

    doc.save(`detail-kas-kecil_${date}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Detail Kas Kecil</h2>
          <div className="text-sm text-muted-foreground mt-1">
            PT: <span className="font-medium text-foreground">{PT_LIST.find(p => p.fullName === myPT)?.tag || myPT}</span>
          </div>
        </div>
        <div>
          <label className="text-sm block">Tanggal</label>
          <input type="date" className="h-10 rounded-md border bg-background px-3 text-sm" value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>
        <Button type="button" onClick={exportPDF}>Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Kas Masuk" value={fmtIDR(totalIn)} />
        <Card title="Kas Keluar" value={fmtIDR(totalOut)} />
        <Card title="Saldo" value={fmtIDR(saldo)} highlight />
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Transaksi (read-only)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Tanggal</th><th>PT</th><th>Deskripsi</th><th>Kategori</th>
                <th>Diinput Oleh</th><th>Tipe</th><th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t, idx) => (
                <tr key={t.id ?? idx} className="border-t">
                  <td className="py-2">{t.date}</td>
                  <td>{PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-'}</td>
                  <td>{t.desc || '-'}</td>
                  <td>{t.category || '-'}</td>
                  <td>{t.operator || '-'}</td>
                  <td className={isIn(t.type) ? 'text-green-600' : 'text-red-500'}>{isIn(t.type) ? 'Masuk' : 'Keluar'}</td>
                  <td className="text-right">{fmtIDR(t.amount)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">Tidak ada data pada tanggal ini.</td></tr>
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
