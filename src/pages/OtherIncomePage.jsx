// src/pages/OtherIncomePage.jsx
import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/button.jsx";
import Input from "@/components/ui/input.jsx";
import { useToast } from "@/components/use-toast.js";
import { useTransactions } from "@/context/TransactionsContext.jsx";
import { getCurrentUser } from "@/lib/auth.js";
import { PT_LIST } from "@/lib/constants.js";
import { fmtIDR } from "@/lib/utils.js";

const todayISO = new Date().toISOString().slice(0, 10);

const TAX_KEY = "cfg:other_income_tax"; // % pajak disimpan di localStorage

export default function OtherIncomePage() {
  const { add } = useTransactions();
  const { toast } = useToast();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === "direktur";

  // prefer persen pajak dari localStorage (default 2.5%)
  const [taxPct, setTaxPct] = useState(() => {
    const s = localStorage.getItem(TAX_KEY);
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : 2.5;
  });

  // form state
  const [pt, setPt] = useState(isDirector ? me.pt : PT_LIST[0].fullName);
  const [date, setDate] = useState(todayISO);
  const [desc, setDesc] = useState("");
  const [gross, setGross] = useState("");

  useEffect(() => {
    if (isDirector) setPt(me.pt);
  }, [isDirector, me]);

  const grossNum = Number(String(gross).replace(/[^\d.-]/g, "")) || 0;
  const taxAmt = Math.round((taxPct / 100) * grossNum);
  const netAmt = Math.max(grossNum - taxAmt, 0);

  const onSaveSettings = () => {
    localStorage.setItem(TAX_KEY, String(taxPct));
    toast({ title: "Pengaturan disimpan", description: `Pajak diset ${taxPct}%` });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!desc.trim()) {
      return toast({ title: "Deskripsi wajib diisi", type: "error" });
    }
    if (grossNum <= 0) {
      return toast({ title: "Nominal bruto harus > 0", type: "error" });
    }

    const now = Date.now();
    // 1) Catat pendapatan (bruto)
    add({
      id: crypto.randomUUID(),
      date,
      pt,
      desc: `Pendapatan lain-lain: ${desc}`,
      category: "Pendapatan Lain-lain",
      type: "Masuk",
      amount: grossNum,
      createdAt: now,
    });

    // 2) Catat pajak yang dipotong (keluar)
    if (taxAmt > 0) {
      add({
        id: crypto.randomUUID(),
        date,
        pt,
        desc: `Pajak pendapatan (${taxPct}%) – ${desc}`,
        category: "Pajak Pendapatan",
        type: "Keluar",
        amount: taxAmt,
        createdAt: now + 1,
      });
    }

    toast({
      title: "Pendapatan tersimpan",
      description: `Bruto ${fmtIDR(grossNum)} • Pajak ${fmtIDR(taxAmt)} • Net ${fmtIDR(
        netAmt
      )}`,
    });

    // reset
    setDesc("");
    setGross("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end flex-wrap gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Pendapatan Lain-lain</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Form ini otomatis memotong pajak dan mengirimkan data ke Laba Rugi.
          </div>
        </div>

        {/* Pengaturan pajak cepat */}
        <div className="card p-3 flex items-end gap-2">
          <div>
            <label className="text-sm block">Pajak (%)</label>
            <Input
              className="h-10 w-28"
              type="number"
              min="0"
              step="0.1"
              value={taxPct}
              onChange={(e) => setTaxPct(Number(e.target.value))}
            />
          </div>
          <Button type="button" onClick={onSaveSettings}>
            Simpan %
          </Button>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
      >
        <div>
          <label className="text-sm font-medium block mb-1">Tanggal</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">PT</label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-75"
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            disabled={isDirector}
          >
            {PT_LIST.map((p) => (
              <option key={p.tag} value={p.fullName}>
                {p.tag}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium block mb-1">Deskripsi</label>
          <Input
            placeholder="Contoh: Sewa gudang, bunga bank, dll."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Nominal Bruto (Rp)</label>
          <Input
            inputMode="numeric"
            placeholder="0"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Pajak (otomatis)</label>
          <div className="h-10 w-full rounded-md border bg-background/50 px-3 text-sm flex items-center">
            {fmtIDR(taxAmt)}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Nominal Net (informasi)</label>
          <div className="h-10 w-full rounded-md border bg-primary/10 border-primary/40 px-3 text-lg font-semibold flex items-center">
            {fmtIDR(netAmt)}
          </div>
        </div>

        <div className="md:col-span-2 pt-2">
          <Button type="submit" className="w-full">
            Simpan Pendapatan
          </Button>
        </div>
      </form>
    </div>
  );
}
