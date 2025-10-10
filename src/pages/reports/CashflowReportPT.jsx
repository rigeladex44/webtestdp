// src/pages/reports/CashflowReportPT.jsx
import React, { useMemo, useState } from "react";
import { useTransactions } from "@/context/TransactionsContext.jsx";
import { PT_LIST } from "@/lib/constants.js";
import Button from "@/components/ui/button.jsx";
import Input from "@/components/ui/input.jsx";
import { fmtIDR } from "@/lib/utils.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Helpers */
const todayISO = new Date().toISOString().slice(0, 10);
const isInType  = (t) => ["Masuk","income","Debit"].includes(String(t||"").trim());
const isOutType = (t) => ["Keluar","expense","Kredit"].includes(String(t||"").trim());

function lastNDates(n = 30) {
  const list = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("id-ID", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    }).format(d);
    list.push({ iso, label });
  }
  return list;
}

function CashflowReportPTBase({ ptTag }) {
  const { transactions } = useTransactions();
  const ptFull = useMemo(
    () => PT_LIST.find(p => p.tag === ptTag)?.fullName || ptTag,
    [ptTag]
  );

  const [date, setDate] = useState(todayISO);
  const dateOptions = useMemo(() => lastNDates(30), []);

  const rows = useMemo(() => {
    return transactions
      .filter(t =>
        t &&
        t.date === date &&
        (t.pt || "") === ptFull &&
        t.affectsCash === true // hanya kas kecil
      )
      .sort((a,b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  }, [transactions, date, ptFull]);

  const totals = useMemo(() => {
    const masuk  = rows.reduce((s,t)=> s + (isInType(t.type)  ? t.amount : 0), 0);
    const keluar = rows.reduce((s,t)=> s + (isOutType(t.type) ? t.amount : 0), 0);
    return { masuk, keluar, saldo: masuk - keluar };
  }, [rows]);

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14); doc.setFont(undefined,"bold");
    doc.text(`LAPORAN KAS KECIL — ${ptTag}`, pageWidth/2, margin, { align:"center" });
    doc.setFontSize(10); doc.setFont(undefined,"normal");
    const pretty = new Intl.DateTimeFormat("id-ID", {
      weekday: "long", day:"2-digit", month:"long", year:"numeric"
    }).format(new Date(date));
    doc.text(pretty, pageWidth/2, margin+12, { align:"center" });

    let running = 0;
    const body = rows.map((t,i) => {
      const m = isInType(t.type)  ? t.amount : 0;
      const k = isOutType(t.type) ? t.amount : 0;
      running += (m - k);
      return [
        i+1,
        t.desc || "-",
        t.operator || "-",
        isInType(t.type) ? "Masuk" : "Keluar",
        fmtIDR(m),
        fmtIDR(k),
        fmtIDR(running),
      ];
    });

    autoTable(doc, {
      startY: margin+28, margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor:[240,240,240], textColor:0, fontStyle:"bold" },
      styles: { fontSize: 9, cellPadding: 4 },
      head: [["NO","SUBJEK","Diinput Oleh","Tipe","Masuk (Rp)","Keluar (Rp)","Saldo (Rp)"]],
      body,
      foot: [[
        { content: "TOTAL", colSpan: 4, styles: { halign:"right", fontStyle:"bold" } },
        { content: fmtIDR(totals.masuk),  styles: { halign:"right", fontStyle:"bold" } },
        { content: fmtIDR(totals.keluar), styles: { halign:"right", fontStyle:"bold" } },
        { content: fmtIDR(totals.saldo),  styles: { halign:"right", fontStyle:"bold" } },
      ]],
      footStyles: { fillColor:[255,255,255], textColor:0 },
    });

    doc.save(`kas-kecil_${ptTag}_${date}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Report Kas Kecil — {ptTag}</h2>
          <div className="text-sm text-muted-foreground mt-1">{ptFull}</div>
        </div>

        <div>
          <label className="text-sm block">Tanggal</label>
          <select
            className="h-10 w-[260px] rounded-md border bg-background px-3 text-sm"
            value={date}
            onChange={(e)=> setDate(e.target.value)}
          >
            {dateOptions.map(d => (
              <option key={d.iso} value={d.iso}>{d.label}</option>
            ))}
          </select>
        </div>

        <Button type="button" onClick={exportPDF}>Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Kas Masuk"  value={fmtIDR(totals.masuk)} />
        <Card title="Kas Keluar" value={fmtIDR(totals.keluar)} />
        <Card title="Saldo Hari Itu" value={fmtIDR(totals.saldo)} highlight />
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Transaksi — {date}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Waktu</th>
                <th>Deskripsi</th>
                <th>Diinput</th>
                <th>Tipe</th>
                <th className="text-right">Masuk (Rp)</th>
                <th className="text-right">Keluar (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-t align-top">
                  <td className="py-2">
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
                      : "-"}
                  </td>
                  <td>{t.desc || "-"}</td>
                  <td>{t.operator || "-"}</td>
                  <td>{isInType(t.type) ? "Masuk" : "Keluar"}</td>
                  <td className="text-right text-green-600">{fmtIDR(isInType(t.type) ? t.amount : 0)}</td>
                  <td className="text-right text-red-500">{fmtIDR(isOutType(t.type) ? t.amount : 0)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Tidak ada data.</td></tr>
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
    <div className={`card p-5 ${highlight ? "border-primary/40" : ""}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

/** Ekspor wrapper per-PT (agar App.jsx tidak perlu diubah) */
export const CashSJE = () => <CashflowReportPTBase ptTag="SJE" />;
export const CashKSS = () => <CashflowReportPTBase ptTag="KSS" />;
export const CashFAB = () => <CashflowReportPTBase ptTag="FAB" />;
export const CashSJS = () => <CashflowReportPTBase ptTag="SJS" />;
export const CashKBS = () => <CashflowReportPTBase ptTag="KBS" />;

export default CashflowReportPTBase;
