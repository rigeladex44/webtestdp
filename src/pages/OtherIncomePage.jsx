// src/pages/OtherIncomePage.jsx
import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button.jsx";
import Input from "@/components/ui/input.jsx";
import { useToast } from "@/components/use-toast.js";
import { useTransactions } from "@/context/TransactionsContext.jsx";
import { getCurrentUser } from "@/lib/auth.js";
import { PT_LIST } from "@/lib/constants.js";
import { fmtIDR } from "@/lib/utils.js";

const todayISO = new Date().toISOString().slice(0, 10);
const todayLabel = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit", month: "long", year: "numeric",
}).format(new Date(todayISO));

export default function OtherIncomePage() {
  const { transactions, add: addTxn } = useTransactions();
  const { toast } = useToast();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === "direktur";

  // form state
  const [pt, setPt] = useState(isDirector ? me.pt : PT_LIST[0].fullName);
  const [subject, setSubject] = useState("");                 // keterangan
  const [amount, setAmount] = useState("");                   // bruto
  const [taxPercent, setTaxPercent] = useState(2);            // pajak auto (mis. 2%)
  const [paymentMethod, setPaymentMethod] = useState("Tunai"); // Tunai | Cashless

  // ringkasan hari ini (khusus Pendapatan Lain-lain)
  const listToday = useMemo(() => {
    return transactions
      .filter(t => t.date === todayISO && (
        t.category === "Pendapatan Lain - Lain" ||
        t.category === "Beban Pajak & Fee Konsultan Pajak"
      ))
      .sort((a,b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [transactions]);

  const totalMasuk = listToday
    .filter(t => t.type === "Masuk" && t.category === "Pendapatan Lain - Lain")
    .reduce((s,t) => s + t.amount, 0);

  const totalPajak = listToday
    .filter(t => t.type === "Keluar" && t.category === "Beban Pajak & Fee Konsultan Pajak")
    .reduce((s,t) => s + t.amount, 0);

  const netHariIni = totalMasuk - totalPajak;

  const handleSubmit = (e) => {
    e.preventDefault();
    const bruto = Number(String(amount).replace(/[^\d.-]/g,""));
    const taxRate = Number(taxPercent) / 100;
    if (!subject.trim()) return toast({ title: "Subjek wajib diisi", type: "error" });
    if (!bruto || bruto <= 0) return toast({ title: "Nominal bruto harus > 0", type: "error" });

    const pajak = Math.round(bruto * (taxRate > 0 ? taxRate : 0));
    const netCash = bruto - pajak;
    const isCash = String(paymentMethod).toLowerCase() === "tunai";

    // 1) Catat pendapatan (bruto) → masuk ke L/R
    addTxn({
      date: todayISO,
      pt,
      desc: subject,
      category: "Pendapatan Lain - Lain",
      type: "Masuk",
      amount: bruto,
      createdAt: Date.now(),
      // efek kas: hanya tunai → masukkan NET ke kas kecil (dengan flag affectsCash)
      affectsCash: isCash,
      actorType: "internal",
      kind: "other_income",
      payMethod: paymentMethod,
      // informasi pajak untuk audit (opsional)
      meta: { taxRate, bruto, pajak, netCash },
    });

    // 2) Catat beban pajak → keluar di L/R
    addTxn({
      date: todayISO,
      pt,
      desc: `Pajak pendapatan lain-lain • ${subject}`,
      category: "Beban Pajak & Fee Konsultan Pajak",
      type: "Keluar",
      amount: pajak,
      createdAt: Date.now() + 1,
      // efek kas: jika tunai, pajak dipotong di sumber → tidak ada arus kas keluar lagi
      // sehingga biarkan affectsCash: false (hanya mempengaruhi L/R)
      affectsCash: false,
      actorType: "internal",
      kind: "other_income_tax",
      payMethod: paymentMethod,
      meta: { taxRate, bruto, pajak, netCash },
    });

    // Catatan:
    // - CashflowMini hanya membaca transaksi dengan affectsCash === true
    //   → yang masuk kas kecil hanya NET (kalau Tunai). Non-tunai tidak masuk kas kecil.
    // - ProfitLoss menghitung semua transaksi → pendapatan bruto & beban pajak tampil terpisah.

    toast({
      title: "Pendapatan lain-lain tersimpan",
      description: `Bruto ${fmtIDR(bruto)} • Pajak ${fmtIDR(pajak)} • Net ${fmtIDR(netCash)}${isCash ? " (masuk Kas Kecil)" : ""}`,
    });

    // reset ringan
    setSubject("");
    setAmount("");
    setPaymentMethod("Tunai");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Pendapatan Lain-lain</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Tanggal: <span className="font-medium text-foreground">{todayLabel}</span>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Bruto (hari ini)" value={fmtIDR(totalMasuk)} />
        <Card title="Pajak (hari ini)" value={fmtIDR(totalPajak)} />
        <Card title="Net (hari ini)" value={fmtIDR(netHariIni)} highlight />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium">Tambah Pendapatan Lain-lain</h3>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">PT</label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-75"
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            disabled={isDirector}
          >
            {PT_LIST.map(p => <option key={p.tag} value={p.fullName}>{p.tag}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Subjek</label>
          <Input placeholder="Mis: Transport fee" value={subject} onChange={(e)=>setSubject(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Nominal Bruto</label>
          <Input inputMode="numeric" placeholder="0" value={amount} onChange={(e)=>setAmount(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Pajak (%)</label>
          <Input type="number" min="0" step="0.01" value={taxPercent} onChange={(e)=>setTaxPercent(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Metode Pembayaran</label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={paymentMethod}
            onChange={(e)=>setPaymentMethod(e.target.value)}
          >
            <option>Tunai</option>
            <option>Cashless</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Button type="submit" className="w-full">Simpan</Button>
        </div>
      </form>

      {/* Tabel Hari Ini */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Riwayat (hari ini)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Waktu</th>
                <th>PT</th>
                <th>Kategori</th>
                <th>Subjek</th>
                <th>Metode</th>
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {listToday.map(t => (
                <tr key={t.id} className="border-t">
                  <td className="py-2">
                    {new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>{PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt}</td>
                  <td>{t.category}</td>
                  <td>{t.desc}</td>
                  <td>{t.payMethod || "-"}</td>
                  <td className={`text-right ${t.type === "Masuk" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "Masuk" ? `+ ${fmtIDR(t.amount)}` : `- ${fmtIDR(t.amount)}`}
                  </td>
                </tr>
              ))}
              {listToday.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted-foreground">Belum ada data hari ini.</td>
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
    <div className={`card p-5 ${highlight ? "border-primary/40" : ""}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
