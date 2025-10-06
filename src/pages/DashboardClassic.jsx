// src/pages/DashboardClassic.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { useTransactions } from "../context/TransactionsContext.jsx";
import { fmtIDR } from "../lib/utils.js";
import { api } from "../lib/api.js"; // mock: /reports/pl
import ClockWidget from "../components/ClockWidget.jsx";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// helper tipe agar kompatibel data lama & baru
const isInType  = (t) => ["Masuk", "income", "Debit"].includes(String(t || "").trim());
const isOutType = (t) => ["Keluar", "expense", "Kredit"].includes(String(t || "").trim());

export default function DashboardClassic() {
  const { transactions } = useTransactions();

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const ym = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // ====== BULAN INI (lokal) ======
  const { monthIn, monthOut, monthNet, txnCount } = useMemo(() => {
    const monthRows = transactions.filter((t) => String(t.date || "").startsWith(ym));
    const monthIn  = monthRows.filter((t) => isInType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const monthOut = monthRows.filter((t) => isOutType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    return { monthIn, monthOut, monthNet: monthIn - monthOut, txnCount: monthRows.length };
  }, [transactions, ym]);

  // ====== HARI INI (lokal) ======
  const { cashNetToday, salesCountToday, ppnToday } = useMemo(() => {
    const todayRows = transactions.filter((t) => t.date === todayISO);

    // Kas kecil = hanya yang memengaruhi kas kecil
    const cashRows = todayRows.filter((t) => t.affectsCash === true);
    const cashIn   = cashRows.filter((t) => isInType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const cashOut  = cashRows.filter((t) => isOutType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const cashNet  = cashIn - cashOut;

    // Penjualan hari ini (kategori 'Penjualan')
    const salesRows = todayRows.filter((t) => t.category === "Penjualan");
    const ppnSum = salesRows.reduce((s, t) => s + (t.ppn11 || 0), 0);

    return {
      cashNetToday: cashNet,
      salesCountToday: salesRows.length,
      ppnToday: ppnSum,
    };
  }, [transactions, todayISO]);

  // ====== Data dari mock API (/reports/pl?range=today) -> fallback jika lokal 0 ======
  const [sum, setSum] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    setLoading(true);
    api
      .get("/reports/pl?range=today")
      .then((r) => {
        if (!on) return;
        setSum(r.data?.summary || {});
      })
      .catch(() => {
        if (!on) return;
        setSum({});
      })
      .finally(() => {
        if (!on) return;
        setLoading(false);
      });
    return () => {
      on = false;
    };
  }, []);

  // fallback helper: kalau nilai lokal 0 dan mock punya angka, pakai mock
  const coalesce = (localVal, mockVal) => {
    const lv = Number(localVal || 0);
    const mv = Number(mockVal || 0);
    return lv > 0 ? lv : mv;
  };

  const kasCardValue   = coalesce(cashNetToday, sum?.kas_harian);
  const jualCardValue  = coalesce(salesCountToday, sum?.penjualan_harian);
  const ppnCardValue   = coalesce(ppnToday, sum?.hutang_ppn);

  // ====== Chart (sample) ======
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = {
    labels,
    datasets: [
      { label: "Debit",  data: labels.map(() => Math.random() * 1000 + 500), tension: 0.4 },
      { label: "Kredit", data: labels.map(() => Math.random() *  600 + 200), tension: 0.4 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header: judul + jam di kanan */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Beranda</h2>
        <ClockWidget className="ml-auto" />
      </div>

      {/* Ringkasan BULAN INI (lokal) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Debit (bulan ini)" value={fmtIDR(monthIn)} />
        <Card title="Total Kredit (bulan ini)" value={fmtIDR(monthOut)} />
        <Card title="Net" value={fmtIDR(monthNet)} highlight />
        <Card title="Transaksi" value={txnCount} />
      </div>

      {/* Ringkasan HARI INI */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card
          title="Kas (hari ini)"
          value={
            loading && kasCardValue === 0
              ? "…"
              : fmtIDR(kasCardValue)
          }
        />
        <Card
          title="Penjualan (hari ini)"
          value={
            loading && jualCardValue === 0
              ? "…"
              : (Number(jualCardValue) || 0).toLocaleString("id-ID")
          }
        />
        <Card
          title="Hutang PPN 11%"
          value={
            loading && ppnCardValue === 0
              ? "…"
              : fmtIDR(ppnCardValue)
          }
        />
      </div>

      {/* Weekly Trend (sample) */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Weekly Trend (sample)</div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[560px]">
            <Line
              data={data}
              options={{
                plugins: { legend: { display: true } },
                scales: { y: { grid: { color: "rgba(0,0,0,.08)" } } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? "border-primary/40" : ""}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
