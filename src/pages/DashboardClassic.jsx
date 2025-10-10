// src/pages/DashboardClassic.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";

import { useTransactions } from "../context/TransactionsContext.jsx";
import { fmtIDR } from "../lib/utils.js";
import ClockWidget from "../components/ClockWidget.jsx";
import { getCurrentUser } from "@/lib/auth.js";
import { PT_LIST } from "@/lib/constants.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, BarElement, Tooltip, Legend);

const isInType  = (t) => ["Masuk", "income", "Debit"].includes(String(t || "").trim());
const isOutType = (t) => ["Keluar", "expense", "Kredit"].includes(String(t || "").trim());

export default function DashboardClassic() {
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, []);

  // ====== DATA HARI INI ======
  const todayData = useMemo(() => {
    const todayTxns = transactions.filter((t) => t.date === todayISO);
    
    // SEMUA TRANSAKSI (untuk Laba Rugi)
    const allIn = todayTxns.filter((t) => isInType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const allOut = todayTxns.filter((t) => isOutType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    
    // KAS KECIL (hanya affectsCash=true)
    const cashTxns = todayTxns.filter((t) => t.affectsCash === true);
    const cashIn = cashTxns.filter((t) => isInType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const cashOut = cashTxns.filter((t) => isOutType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const cashBalance = cashIn - cashOut;
    
    // PENJUALAN HARI INI
    const salesTxns = todayTxns.filter((t) => t.category === "Penjualan");
    const salesAmount = salesTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const salesCount = salesTxns.length;
    
    // PPN TERUTANG HARI INI
    const ppnTotal = salesTxns.reduce((s, t) => s + (t.ppn11 || 0), 0);
    
    return {
      totalDebit: allIn,
      totalKredit: allOut,
      cashBalance,
      txnCount: todayTxns.length,
      
      salesAmount,
      salesCount,
      ppnTotal,
    };
  }, [transactions, todayISO]);

  // ====== CHART: TREND 7 HARI TERAKHIR ======
  const weeklyTrend = useMemo(() => {
    const days = [];
    const debitData = [];
    const kreditData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const dayTxns = transactions.filter(t => t.date === dateStr);
      const dayIn = dayTxns.filter(t => isInType(t.type)).reduce((s, t) => s + t.amount, 0);
      const dayOut = dayTxns.filter(t => isOutType(t.type)).reduce((s, t) => s + t.amount, 0);
      
      days.push(date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
      debitData.push(dayIn);
      kreditData.push(dayOut);
    }
    
    return { days, debitData, kreditData };
  }, [transactions]);

  // ====== CHART: PENJUALAN PER PT (HARI INI) ======
  const salesByPT = useMemo(() => {
    const todaySales = transactions.filter(t => t.date === todayISO && t.category === "Penjualan");
    
    const ptSales = PT_LIST.map(pt => {
      const ptTxns = todaySales.filter(t => t.pt === pt.fullName);
      return {
        tag: pt.tag,
        count: ptTxns.length,
        amount: ptTxns.reduce((s, t) => s + t.amount, 0)
      };
    });
    
    return ptSales;
  }, [transactions, todayISO]);

  const lineData = {
    labels: weeklyTrend.days,
    datasets: [
      { 
        label: "Debit (Rp)", 
        data: weeklyTrend.debitData,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4 
      },
      { 
        label: "Kredit (Rp)", 
        data: weeklyTrend.kreditData,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4 
      },
    ],
  };

  const barData = {
    labels: salesByPT.map(p => p.tag),
    datasets: [
      {
        label: "Penjualan (unit)",
        data: salesByPT.map(p => p.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(251, 146, 60, 0.7)",
          "rgba(168, 85, 247, 0.7)",
          "rgba(236, 72, 153, 0.7)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting}, {user?.name || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Berikut ringkasan bisnis Anda hari ini
          </p>
        </div>
        <ClockWidget />
      </div>

      {/* Main Stats - HARI INI */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<TrendUpIcon />}
          title="Total Debit"
          subtitle="hari ini"
          value={fmtIDR(todayData.totalDebit)}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<TrendDownIcon />}
          title="Total Kredit"
          subtitle="hari ini"
          value={fmtIDR(todayData.totalKredit)}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          icon={<WalletIcon />}
          title="Saldo Kas Kecil"
          subtitle="hari ini"
          value={fmtIDR(todayData.cashBalance)}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          highlight
        />
        <StatCard
          icon={<ActivityIcon />}
          title="Transaksi"
          subtitle="hari ini"
          value={todayData.txnCount.toString()}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Quick Stats - Detail Hari Ini */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <QuickStatCard
          icon={<ShoppingIcon />}
          title="Penjualan Hari Ini"
          value={`${fmtIDR(todayData.salesAmount)} (${todayData.salesCount} transaksi)`}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <QuickStatCard
          icon={<TaxIcon />}
          title="PPN Terutang Hari Ini"
          value={fmtIDR(todayData.ppnTotal)}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <BoltIcon className="h-5 w-5 text-amber-500" />
          Aksi Cepat
        </h3>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <ActionButton
            icon={<EditIcon />}
            label="Entry Penjualan"
            onClick={() => navigate("/entri-penjualan")}
          />
          <ActionButton
            icon={<CashIcon />}
            label="Entry Kas"
            onClick={() => navigate("/arus-kas-kecil")}
          />
          <ActionButton
            icon={<ChartIcon />}
            label="Lihat Laporan"
            onClick={() => navigate("/laba-rugi")}
          />
          <ActionButton
            icon={<UsersIcon />}
            label="Kelola User"
            onClick={() => navigate("/admin/users")}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <ChartLineIcon className="h-4 w-4" />
            Trend 7 Hari Terakhir
          </h3>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[400px]">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  plugins: { 
                    legend: { display: true, position: "top" },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + fmtIDR(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: { 
                    y: { 
                      grid: { color: "rgba(0,0,0,.05)" },
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                        }
                      }
                    } 
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" />
            Penjualan per PT (Hari Ini)
          </h3>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[400px]">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        afterLabel: function(context) {
                          const ptData = salesByPT[context.dataIndex];
                          return 'Total: ' + fmtIDR(ptData.amount);
                        }
                      }
                    }
                  },
                  scales: { 
                    y: { 
                      grid: { color: "rgba(0,0,0,.05)" },
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    } 
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-5 bg-blue-50/30 border-blue-200">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">Catatan Penting:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Saldo Kas Kecil</strong> hanya menghitung transaksi tunai (<code>affectsCash=true</code>)</li>
              <li>• <strong>Penjualan Cashless</strong> masuk Laba Rugi tapi tidak ke Kas Kecil</li>
              <li>• <strong>Carry forward saldo</strong> akan otomatis ke hari berikutnya</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Icon Components =====
function TrendUpIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TaxIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function BoltIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ChartLineIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function ChartBarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ===== Card Components =====
function StatCard({ icon, title, subtitle, value, iconColor, iconBg, highlight }) {
  return (
    <div 
      className={`card p-5 hover:shadow-md transition-all duration-200 ${
        highlight ? "border-blue-200 bg-blue-50/30" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </div>
            {subtitle && (
              <div className="text-[10px] text-muted-foreground">{subtitle}</div>
            )}
            <div className="text-xl font-bold text-foreground mt-2">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({ icon, title, value, iconColor, iconBg }) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
          <div className="text-lg font-bold text-foreground mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
    >
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-xs font-medium text-center text-foreground">{label}</span>
    </button>
  );
}