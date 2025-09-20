import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { fmtIDR } from '@/lib/utils.js';
import ClockWidget from '@/components/ClockWidget.jsx';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function DashboardClassic() {
  const { transactions } = useTransactions();
  const ym = new Date().toISOString().slice(0,7);
  const Debit = transactions.filter(t=>t.date.startsWith(ym)&&t.type==='Debit').reduce((a,b)=>a+b.amount,0);
  const Kredit = transactions.filter(t=>t.date.startsWith(ym)&&t.type==='Kredit').reduce((a,b)=>a+b.amount,0);

  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const data = {
    labels,
    datasets: [
      { label: 'Debit', data: labels.map(()=>Math.random()*1000+500), tension: .4 },
      { label: 'Kredit', data: labels.map(()=>Math.random()*600+200), tension: .4 },
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header: judul + jam di kanan */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Beranda</h2>
        <ClockWidget className="ml-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Debit (bulan ini)" value={fmtIDR(Debit)} />
        <Card title="Total Kredit (bulan ini)" value={fmtIDR(Kredit)} />
        <Card title="Net" value={fmtIDR(Debit-Kredit)} highlight />
        <Card title="Transaksi" value={transactions.length} />
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Weekly Trend (sample)</div>
        <Line
          data={data}
          options={{
            plugins:{ legend:{ display:true } },
            // grid lebih pas untuk tema terang (ganti putih transparan -> hitam transparan halus)
            scales:{ y:{ grid:{ color:'rgba(0,0,0,.08)' } } }
          }}
        />
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
