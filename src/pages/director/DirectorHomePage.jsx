import React, { useMemo, useState } from 'react';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { fmtIDR } from '@/lib/utils.js';
import React from 'react';
import ProfitLoss from '@/pages/ProfitLoss.jsx';

export default function DirectorPLPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Laporan Laba/Rugi</h2>
      <ProfitLoss />
    </div>
  );
}


const PT_LIST = ['PT KSS', 'PT SJE', 'PT FAB'];

function ymStr(d=new Date()) { return d.toISOString().slice(0,7); }

export default function DirectorHomePage() {
  const { transactions } = useTransactions();
  const [pt, setPt] = useState('ALL');

  const { mIncome, mExpense, mNet, yIncome, yExpense, yNet, count } = useMemo(()=>{
    const now = new Date();
    const ym  = ymStr(now);
    const y   = String(now.getFullYear());
    const byPT = (t)=> pt==='ALL' ? true : (t.pt||'')===pt;

    const monthRows = transactions.filter(t=> t.date.startsWith(ym) && byPT(t));
    const yearRows  = transactions.filter(t=> t.date.startsWith(y)  && byPT(t));

    const sumType = (rows, type)=> rows.filter(r=>r.type===type).reduce((s,r)=>s+r.amount,0);

    const mIncome = sumType(monthRows,'income');
    const mExpense= sumType(monthRows,'expense');
    const yIncome = sumType(yearRows,'income');
    const yExpense= sumType(yearRows,'expense');

    return { mIncome, mExpense, mNet:mIncome-mExpense, yIncome, yExpense, yNet:yIncome-yExpense, count: monthRows.length };
  }, [transactions, pt]);

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Ikhtisar Keuangan</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Tampilan ringkasan bulan berjalan dan year-to-date.
          </div>
        </div>
        <div>
          <label className="text-sm block">Filter PT</label>
          <select
            value={pt}
            onChange={e=>setPt(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">Semua PT</option>
            {PT_LIST.map(x=><option key={x}>{x}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Pendapatan (bulan ini)" value={fmtIDR(mIncome)} />
        <Card title="Beban (bulan ini)"       value={fmtIDR(mExpense)} />
        <Card title="Laba/Rugi (bulan ini)"   value={fmtIDR(mNet)} highlight />
        <Card title="Transaksi (bulan ini)"   value={count} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Pendapatan (YTD)" value={fmtIDR(yIncome)} />
        <Card title="Beban (YTD)"       value={fmtIDR(yExpense)} />
        <Card title="Laba/Rugi (YTD)"   value={fmtIDR(yNet)} highlight />
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground">
          Saran tambahan untuk direktur: grafik tren bulanan, top 5 kategori beban, dan arus kas bersih per PT.
          (bisa kita tambahkan nanti).
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
