// src/pages/reports/PnLReportPT.jsx
import React, { useMemo, useState } from "react";
import { useTransactions } from "@/context/TransactionsContext.jsx";
import { PT_LIST } from "@/lib/constants.js";
import Button from "@/components/ui/button.jsx";
import { fmtIDR } from "@/lib/utils.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Helpers */
const isInType  = (t) => ["Masuk","income","Debit"].includes(String(t||"").trim());
const isOutType = (t) => ["Keluar","expense","Kredit"].includes(String(t||"").trim());

function ymLabel(ym) {
  const [y,m] = ym.split("-").map(Number);
  const d = new Date(y, m-1, 1);
  return new Intl.DateTimeFormat("id-ID", { month:"long", year:"numeric" }).format(d);
}
function lastNMonths(n=12) {
  const list = [];
  const today = new Date();
  for (let i=0;i<n;i++){
    const d = new Date(today.getFullYear(), today.getMonth()-i, 1);
    const ym = d.toISOString().slice(0,7);
    list.push({ ym, label: ymLabel(ym) });
  }
  return list;
}

function PnLReportPTBase({ ptTag }) {
  const { transactions } = useTransactions();
  const ptFull = useMemo(
    () => PT_LIST.find(p => p.tag === ptTag)?.fullName || ptTag,
    [ptTag]
  );

  const [ym, setYm] = useState(new Date().toISOString().slice(0,7));
  const ymOptions = useMemo(() => lastNMonths(12), []);

  const rows = useMemo(() => {
    return transactions
      .filter(t =>
        (t.pt || "") === ptFull &&
        String(t.date || "").startsWith(ym)
      )
      .sort((a,b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  }, [transactions, ym, ptFull]);

  const totals = useMemo(() => {
    const pendapatan = rows.reduce((s,t)=> s + (isInType(t.type)  ? t.amount : 0), 0);
    const biaya      = rows.reduce((s,t)=> s + (isOutType(t.type) ? t.amount : 0), 0);
    return { pendapatan, biaya, laba: pendapatan - biaya };
  }, [rows]);

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14); doc.setFont(undefined,"bold");
    doc.text(`LAPORAN LABA RUGI — ${ptTag}`, pageWidth/2, margin, { align:"center" });
    doc.setFontSize(10); doc.setFont(undefined,"normal");
    doc.text(ymLabel(ym), pageWidth/2, margin+12, { align:"center" });

    const inc = rows.filter(t => isInType(t.type));
    const exp = rows.filter(t => isOutType(t.type));

    autoTable(doc, {
      startY: margin+28, margin: { left: margin, right: margin }, theme: "grid",
      headStyles: { fillColor:[240,240,240], textColor:0, fontStyle:"bold" },
      styles: { fontSize: 9, cellPadding: 4 },
      head: [["PENDAPATAN", "Jumlah (Rp)"]],
      body: inc.map(t => [t.desc || "-", fmtIDR(t.amount)]),
      foot: [[
        { content: "TOTAL PENDAPATAN", styles: { fontStyle:"bold" } },
        { content: fmtIDR(totals.pendapatan), styles: { halign:"right", fontStyle:"bold" } },
      ]],
      footStyles: { fillColor:[255,255,255], textColor:0 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      margin: { left: margin, right: margin }, theme: "grid",
      headStyles: { fillColor:[240,240,240], textColor:0, fontStyle:"bold" },
      styles: { fontSize: 9, cellPadding: 4 },
      head: [["BEBAN / BIAYA", "Jumlah (Rp)"]],
      body: exp.map(t => [t.category || t.desc || "-", fmtIDR(t.amount)]),
      foot: [[
        { content: "TOTAL BIAYA", styles: { fontStyle:"bold" } },
        { content: fmtIDR(totals.biaya), styles: { halign:"right", fontStyle:"bold" } },
      ]],
      footStyles: { fillColor:[255,255,255], textColor:0 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      margin: { left: margin, right: margin }, theme: "plain",
      styles: { fontSize: 11, cellPadding: 6 },
      body: [
        [{ content: "LABA / (RUGI) BULAN INI", styles: { fontStyle:"bold" } },
         { content: fmtIDR(totals.laba), styles: { halign:"right", fontStyle:"bold" } }],
      ],
    });

    doc.save(`laba-rugi_${ptTag}_${ym}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Report Laba Rugi — {ptTag}</h2>
          <div className="text-sm text-muted-foreground mt-1">{ptFull}</div>
        </div>

        <div>
          <label className="text-sm block">Bulan</label>
          <select
            className="h-10 w-[220px] rounded-md border bg-background px-3 text-sm"
            value={ym}
            onChange={(e)=> setYm(e.target.value)}
          >
            {ymOptions.map(o => (<option key={o.ym} value={o.ym}>{o.label}</option>))}
          </select>
        </div>

        <Button type="button" onClick={exportPDF}>Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Pendapatan" value={fmtIDR(totals.pendapatan)} />
        <Card title="Biaya & Beban" value={fmtIDR(totals.biaya)} />
        <Card title="Laba / (Rugi)" value={fmtIDR(totals.laba)} highlight />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-medium mb-2">Rincian Pendapatan</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Deskripsi</th><th className="text-right">Jumlah</th></tr>
              </thead>
              <tbody>
                {rows.filter(isInType).map((t,i)=>(
                  <tr key={t.id || i} className="border-t">
                    <td className="py-2">{t.desc || "-"}</td>
                    <td className="text-right text-green-600">{fmtIDR(t.amount)}</td>
                  </tr>
                ))}
                {rows.filter(isInType).length===0 && (
                  <tr><td colSpan={2} className="py-3 text-center text-muted-foreground">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <div className="font-medium mb-2">Rincian Biaya/Beban</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Kategori/Deskripsi</th><th className="text-right">Jumlah</th></tr>
              </thead>
              <tbody>
                {rows.filter(isOutType).map((t,i)=>(
                  <tr key={t.id || i} className="border-t">
                    <td className="py-2">{t.category || t.desc || "-"}</td>
                    <td className="text-right text-red-500">{fmtIDR(t.amount)}</td>
                  </tr>
                ))}
                {rows.filter(isOutType).length===0 && (
                  <tr><td colSpan={2} className="py-3 text-center text-muted-foreground">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
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

/** Ekspor wrapper per-PT */
export const PnL_SJE = () => <PnLReportPTBase ptTag="SJE" />;
export const PnL_KSS = () => <PnLReportPTBase ptTag="KSS" />;
export const PnL_FAB = () => <PnLReportPTBase ptTag="FAB" />;
export const PnL_SJS = () => <PnLReportPTBase ptTag="SJS" />;
export const PnL_KBS = () => <PnLReportPTBase ptTag="KBS" />;

export default PnLReportPTBase;
