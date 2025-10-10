import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/button.jsx";
import DatePicker from "@/components/ui/date-picker.jsx";
import { useTransactions } from "@/context/TransactionsContext.jsx";
import { getCurrentUser } from "@/lib/auth.js";
import { PT_LIST } from "@/lib/constants.js";
import { fmtIDR } from "@/lib/utils.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// helper tipe agar kompatibel data lama & baru
const isInType  = (t) => ["Masuk", "income", "Debit"].includes(String(t || "").trim());
const isOutType = (t) => ["Keluar", "expense", "Kredit"].includes(String(t || "").trim());

const todayISO = new Date().toISOString().slice(0, 10);
const fmtRangeLabel = (a, b) => {
  const f = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  return a === b ? f.format(new Date(a)) : `${f.format(new Date(a))} s.d. ${f.format(new Date(b))}`;
};

export default function DirectorCashflowDetail() {
  const { transactions } = useTransactions();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === "direktur";
  const myPT = me?.pt || ""; // untuk saat ini direktur dibatasi PT tunggal

  // rentang tanggal
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);

  // PT (read-only utk direktur; ke depan bisa multi-PT akses)
  const ptTag = PT_LIST.find((p) => p.fullName === myPT)?.tag || myPT || "-";

  const handleFrom = (v) => { if (!v) return; setFromDate(v <= toDate ? v : toDate); };
  const handleTo   = (v) => { if (!v) return; setToDate(v >= fromDate ? v : fromDate); };

  const periodLabel = fmtRangeLabel(fromDate, toDate);

  const { rows, inCash, outCash, saldo } = useMemo(() => {
    const within = (d) => d >= fromDate && d <= toDate;
    const byPT = (t) => (t.pt || "") === myPT;

    const base = transactions
      .filter((t) => within(t.date))
      .filter(byPT)
      .filter((t) => t.affectsCash === true)
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    const inCash  = base.filter((t) => isInType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const outCash = base.filter((t) => isOutType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    return { rows: base, inCash, outCash, saldo: inCash - outCash };
  }, [transactions, fromDate, toDate, myPT]);

  const exportCSV = () => {
    let running = 0;
    const header = ["NO","Tanggal","PT","Deskripsi","Kategori","Diinput Oleh","Masuk (Rp)","Keluar (Rp)","Saldo (Rp)"];
    const lines = rows.map((t, i) => {
      const masuk  = isInType(t.type)  ? t.amount : 0;
      const keluar = isOutType(t.type) ? t.amount : 0;
      running += (masuk - keluar);
      return [
        String(i + 1),
        t.date,
        ptTag,
        t.desc || "",
        t.category || "",
        t.operator || "",
        String(masuk),
        String(keluar),
        String(running),
      ];
    });
    const csv = [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `direktur-kaskecil_${fromDate}_${toDate}_${ptTag}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14); doc.setFont(undefined, "bold");
    doc.text("LAPORAN KAS KECIL (Direktur - Read Only)", pageWidth / 2, margin, { align: "center" });

    doc.setFontSize(10); doc.setFont(undefined, "normal");
    doc.text(ptTag || "-", pageWidth / 2, margin + 14, { align: "center" });
    doc.text(`Periode: ${periodLabel}`, pageWidth / 2, margin + 28, { align: "center" });

    let running = 0;
    const body = rows.map((t, i) => {
      const masuk  = isInType(t.type)  ? t.amount : 0;
      const keluar = isOutType(t.type) ? t.amount : 0;
      running += (masuk - keluar);
      return [
        i + 1,
        t.date,
        t.desc || "-",
        t.category || "-",
        t.operator || "-",
        { content: fmtIDR(masuk),  styles: { halign: "right" } },
        { content: fmtIDR(keluar), styles: { halign: "right" } },
        { content: fmtIDR(running),styles: { halign: "right", fontStyle: "bold" } },
      ];
    });

    autoTable(doc, {
      startY: margin + 44,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 4, lineWidth: 0.5, lineColor: 200, valign: "middle" },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
      head: [["No","Tanggal","Deskripsi","Kategori","Diinput Oleh","Masuk (Rp)","Keluar (Rp)","Saldo (Rp)"]],
      body,
      columnStyles: {
        0: { halign: "center", cellWidth: 28 },
        2: { cellWidth: 150 },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
      foot: [[
        { content: "GRAND TOTAL", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
        { content: fmtIDR(rows.reduce((s,t)=>s+(isInType(t.type)?t.amount:0),0)), styles: { halign: "right", fontStyle: "bold" } },
        { content: fmtIDR(rows.reduce((s,t)=>s+(isOutType(t.type)?t.amount:0),0)), styles: { halign: "right", fontStyle: "bold" } },
        { content: fmtIDR(rows.reduce((s,t)=>s+(isInType(t.type)?t.amount:0)-(isOutType(t.type)?t.amount:0),0)), styles: { halign: "right", fontStyle: "bold" } },
      ]],
      footStyles: { fillColor: [255,255,255] },
    });

    doc.save(`direktur-kaskecil_${fromDate}_${toDate}_${ptTag}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-14 md:top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pt-3 pb-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-auto">
            <h2 className="text-2xl font-semibold">Kas Kecil — Direktur (Read Only)</h2>
            <div className="text-sm text-muted-foreground mt-1 leading-6">
              <div>Periode: <span className="font-medium text-foreground">{periodLabel}</span></div>
              <div>PT: <span className="font-medium text-foreground">{ptTag}</span></div>
            </div>
          </div>
          <DatePicker label="Tanggal Awal"  value={fromDate} onChange={handleFrom} max={toDate} />
          <DatePicker label="Tanggal Akhir" value={toDate}   onChange={handleTo}   min={fromDate} />
          <div className="flex gap-2">
            <Button type="button" onClick={exportCSV}>Export CSV</Button>
            <Button type="button" onClick={exportPDF}>Export PDF</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Kas Masuk (periode)" value={fmtIDR(inCash)} />
        <Card title="Kas Keluar (periode)" value={fmtIDR(outCash)} />
        <Card title="Saldo (periode)" value={fmtIDR(saldo)} highlight />
      </div>

      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Detail Transaksi (read only)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Tanggal</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Diinput Oleh</th>
                <th className="text-right">Masuk (Rp)</th>
                <th className="text-right">Keluar (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={t.id || i} className="border-t">
                  <td className="py-2">{t.date}</td>
                  <td>{t.desc || "-"}</td>
                  <td>{t.category || "-"}</td>
                  <td>{t.operator || "-"}</td>
                  <td className="text-right">{isInType(t.type) ? fmtIDR(t.amount) : "-"}</td>
                  <td className="text-right">{isOutType(t.type) ? fmtIDR(t.amount) : "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Tidak ada data pada rentang ini.</td></tr>
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
