// src/pages/SalesEntryPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/button.jsx';
import Input from '@/components/ui/input.jsx';
import { useToast } from '@/components/use-toast.js';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { getProducts } from '@/lib/products.js';
import { getCurrentUser } from '@/lib/auth.js';
import { PT_LIST } from '@/lib/constants.js';
import { fmtIDR } from '@/lib/utils.js';
import { splitPPNFromGross, addPPNFromNet } from '@/lib/tax.js';

const todayISO = new Date().toISOString().slice(0, 10);
const todayLabel = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(new Date(todayISO));

export default function SalesEntryPage() {
  const { transactions, add: addTransaction } = useTransactions();
  const { toast } = useToast();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === 'direktur';

  // State form
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pt, setPt] = useState(isDirector ? me.pt : PT_LIST[0].fullName);
  const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); // Tunai | Cashless

  // PPN editable
  const [ppnPercent, setPpnPercent] = useState(11); // %
  const [priceIncludesPPN, setPriceIncludesPPN] = useState(true); // harga sudah termasuk PPN?

  useEffect(() => {
    const list = getProducts();
    setProducts(list);
    if (list.length > 0) setSelectedProductId(list[0].id);
  }, []);

  const salesToday = useMemo(() => {
    return transactions
      .filter(t => t.date === todayISO && t.category === 'Penjualan')
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [transactions]);

  const totalSales = useMemo(() => salesToday.reduce((s,t)=>s+t.amount,0), [salesToday]);
  const transactionCount = salesToday.length;

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [selectedProductId, products]
  );

  const unitPrice = selectedProduct?.price ?? 0;
  const qty = Math.max(0, Number(quantity || 0));
  const baseAmount = Math.round(unitPrice * qty);

  // rate dari input %
  const rate = useMemo(() => {
    const r = Number(ppnPercent);
    if (Number.isNaN(r) || r < 0) return 0;
    return r / 100;
  }, [ppnPercent]);

  // Hitung DPP/PPN/Total bergantung mode include/exclude
  const taxCalc = useMemo(() => {
    if (baseAmount <= 0) return { dpp: 0, ppn: 0, total: 0 };
    if (priceIncludesPPN) {
      const { dpp, ppn } = splitPPNFromGross(baseAmount, rate);
      return { dpp, ppn, total: baseAmount };
    } else {
      const { net, ppn, gross } = addPPNFromNet(baseAmount, rate);
      return { dpp: net, ppn, total: gross };
    }
  }, [baseAmount, rate, priceIncludesPPN]);

  const { dpp, ppn, total } = taxCalc;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !qty || qty <= 0 || !pt) {
      toast({ title: 'Data tidak lengkap', description: 'Pastikan produk, jumlah, dan PT sudah terisi.', type: 'error' });
      return;
    }

    const pay = paymentMethod; // 'Tunai' | 'Cashless'
    const isCash = String(pay).toLowerCase() === 'tunai';

    addTransaction({
      date: todayISO,
      pt,
      // deskripsi
      desc: `Penebusan ${selectedProduct.name} x ${qty}` + (buyerName ? ` - ${buyerName}` : ''),
      category: 'Penjualan',
      type: 'Masuk',               // <-- penting: konsisten dengan Laba Rugi & Kas Kecil
      amount: total,               // total transaksi (sesuai mode include/exclude)
      buyer: buyerName,
      paymentMethod: pay,
      createdAt: Date.now(),

      // metadata bisnis
      actorType: 'pangkalan',
      kind: 'penebusan',

      // KUNCI: hanya Tunai yang memengaruhi Kas Kecil
      affectsCash: isCash,

      // pajak (editable)
      dpp,                 // Dasar Pengenaan Pajak
      ppn11: ppn,          // hutang PPN (rate sesuai input)
      taxRate: rate,       // simpan rate untuk audit
      priceIncludesPPN,    // flag include/exclude
      priceIncludesPPNPercent: ppnPercent, // simpan % yg diinput
    });

    toast({
      title: 'Penjualan Berhasil Disimpan',
      description: `${fmtIDR(total)} dicatat ke Laba Rugi${isCash ? ' & Kas Kecil.' : ' (non-tunai; tidak ke Kas Kecil).'}`,
    });

    // reset minimal
    setQuantity(1);
    setBuyerName('');
    setPaymentMethod('Tunai');
    // ppn percent & mode tetap sesuai preferensi terakhir
    if (products.length > 0) setSelectedProductId(products[0].id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Entri Penjualan</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Tanggal: <span className="font-medium text-foreground">{todayLabel}</span>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Penjualan (hari ini)" value={fmtIDR(totalSales)} highlight />
        <Card title="Jumlah Transaksi (hari ini)" value={transactionCount} />
        <Card title="Harga Satuan" value={selectedProduct ? fmtIDR(unitPrice) : '-'} />
        <Card title="PPN (transaksi ini)" value={fmtIDR(ppn)} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium">Tambah Penjualan Baru</h3>
        </div>

        <div>
          <label htmlFor="pt" className="text-sm font-medium block mb-1">PT Penjualan</label>
          <select
            id="pt"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-75"
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            disabled={isDirector}
          >
            {PT_LIST.map(ptItem => <option key={ptItem.tag} value={ptItem.fullName}>{ptItem.tag}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="buyerName" className="text-sm font-medium block mb-1">Pembeli / Pangkalan</label>
          <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Opsional" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="product" className="text-sm font-medium block mb-1">Produk</label>
          <select
            id="product"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Harga Satuan</label>
          <div className="h-10 w-full rounded-md border bg-background/50 px-3 text-sm flex items-center text-muted-foreground">
            {selectedProduct ? fmtIDR(unitPrice) : '-'}
          </div>
        </div>

        <div>
          <label htmlFor="quantity" className="text-sm font-medium block mb-1">Jumlah Terjual</label>
          <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>

        <div>
          <label htmlFor="paymentMethod" className="text-sm font-medium block mb-1">Metode Pembayaran</label>
          <select
            id="paymentMethod"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option>Tunai</option>
            <option>Cashless</option>
          </select>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">PPN (%)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={ppnPercent}
              onChange={(e) => setPpnPercent(e.target.value)}
              placeholder="11"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={priceIncludesPPN}
                onChange={(e) => setPriceIncludesPPN(e.target.checked)}
              />
              Harga sudah termasuk PPN
            </label>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">DPP</label>
            <div className="h-10 w-full rounded-md border bg-background/50 px-3 text-sm flex items-center text-muted-foreground">
              {fmtIDR(dpp)}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">PPN</label>
            <div className="h-10 w-full rounded-md border bg-background/50 px-3 text-sm flex items-center text-muted-foreground">
              {fmtIDR(ppn)}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{priceIncludesPPN ? 'Total (gross)' : 'Total (net+PPN)'}</label>
            <div className="h-10 w-full rounded-md border bg-primary/10 border-primary/40 px-3 text-lg font-semibold flex items-center">
              {fmtIDR(total)}
            </div>
          </div>
        </div>

        <div className="pt-2 md:col-span-2">
          <Button type="submit" className="w-full">Simpan Penjualan</Button>
        </div>
      </form>

      {/* Tabel Histori */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Penjualan hari ini</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Waktu</th>
                <th>PT</th>
                <th>Deskripsi</th>
                <th>Pembeli</th>
                <th>Metode</th>
                <th className="text-right">DPP</th>
                <th className="text-right">PPN</th>
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {salesToday.map(t => (
                <tr key={t.id} className="border-t">
                  <td className="py-2">
                    {new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt}</td>
                  <td>{t.desc}</td>
                  <td>{t.buyer || '-'}</td>
                  <td>
                    {t.paymentMethod}
                    {t.affectsCash === false ? <span className="ml-1 text-xs text-amber-600">(non-tunai)</span> : null}
                  </td>
                  <td className="text-right">{fmtIDR(t.dpp ?? 0)}</td>
                  <td className="text-right">{fmtIDR(t.ppn11 ?? 0)}</td>
                  <td className="text-right text-green-500 font-medium">{fmtIDR(t.amount)}</td>
                </tr>
              ))}
              {salesToday.length === 0 && (
                <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">Belum ada penjualan hari ini.</td></tr>
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
