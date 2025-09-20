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

const todayISO = new Date().toISOString().slice(0, 10);
const todayLabel = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(new Date(todayISO));

export default function SalesEntryPage() {
  const { transactions, add: addTransaction } = useTransactions();
  const { toast } = useToast();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === 'direktur';

  // State untuk data form
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pt, setPt] = useState(isDirector ? me.pt : PT_LIST[0].fullName);
  const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');

  useEffect(() => {
    const productList = getProducts();
    setProducts(productList);
    if (productList.length > 0) {
      setSelectedProductId(productList[0].id);
    }
  }, []);

  // Logika Kalkulasi untuk Ringkasan dan Tabel
  const { salesToday, totalSales, transactionCount } = useMemo(() => {
    const sales = transactions
      .filter(t => t.date === todayISO && t.category === 'Penjualan')
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // Terbaru di atas
    
    const total = sales.reduce((sum, t) => sum + t.amount, 0);
    const count = sales.length;

    return { salesToday: sales, totalSales: total, transactionCount: count };
  }, [transactions]);

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [selectedProductId, products]);
  const totalPrice = useMemo(() => (selectedProduct && quantity) ? selectedProduct.price * Number(quantity) : 0, [selectedProduct, quantity]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || quantity <= 0 || !pt) {
      toast({ title: 'Data tidak lengkap', description: 'Pastikan produk, jumlah, dan PT sudah terisi.', type: 'error' });
      return;
    }

    addTransaction({
      date: todayISO, pt,
      desc: `Penjualan ${selectedProduct.name} x ${quantity}` + (buyerName ? ` - ${buyerName}` : ''),
      category: 'Penjualan', type: 'income', amount: totalPrice,
      buyer: buyerName, paymentMethod: paymentMethod,
      createdAt: Date.now(),
    });
    
    toast({ title: 'Penjualan Berhasil Disimpan', description: `${fmtIDR(totalPrice)} ditambahkan ke kas.` });
    
    // Reset form
    setQuantity(1); setBuyerName(''); setPaymentMethod('Tunai');
    if (products.length > 0) setSelectedProductId(products[0].id);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Entri Penjualan</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Tanggal: <span className="font-medium text-foreground">{todayLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. Kartu Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Penjualan (hari ini)" value={fmtIDR(totalSales)} highlight />
        <Card title="Jumlah Transaksi (hari ini)" value={transactionCount} />
        <Card title="Harga Produk Dipilih" value={selectedProduct ? fmtIDR(selectedProduct.price) : '-'} />
      </div>

      {/* 3. Form Entri (Full-width) */}
      <form onSubmit={handleSubmit} className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium">Tambah Penjualan Baru</h3>
        </div>
        
        <div>
          <label htmlFor="pt" className="text-sm font-medium block mb-1">PT Penjualan</label>
          <select id="pt" className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-75" value={pt} onChange={(e) => setPt(e.target.value)} disabled={isDirector}>
            {PT_LIST.map(ptItem => <option key={ptItem.tag} value={ptItem.fullName}>{ptItem.tag}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="buyerName" className="text-sm font-medium block mb-1">Pembeli / Pangkalan</label>
          <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Opsional" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="product" className="text-sm font-medium block mb-1">Produk</label>
          <select id="product" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Harga Satuan</label>
          <div className="h-10 w-full rounded-md border bg-background/50 px-3 text-sm flex items-center text-muted-foreground">{selectedProduct ? fmtIDR(selectedProduct.price) : '-'}</div>
        </div>
        <div>
          <label htmlFor="quantity" className="text-sm font-medium block mb-1">Jumlah Terjual</label>
          <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="paymentMethod" className="text-sm font-medium block mb-1">Metode Pembayaran</label>
          <select id="paymentMethod" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Tunai</option><option>Cashless</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Total Harga</label>
          <div className="h-10 w-full rounded-md border bg-primary/10 border-primary/40 px-3 text-lg font-semibold flex items-center">{fmtIDR(totalPrice)}</div>
        </div>
        <div className="pt-2 md:col-span-2">
          <Button type="submit" className="w-full">Simpan Penjualan</Button>
        </div>
      </form>

      {/* 4. Tabel Histori */}
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
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {salesToday.map(t => (
                <tr key={t.id} className="border-t">
                  <td className="py-2">{new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt}</td>
                  <td>{t.desc}</td>
                  <td>{t.buyer || '-'}</td>
                  <td>{t.paymentMethod}</td>
                  <td className="text-right text-green-500 font-medium">{fmtIDR(t.amount)}</td>
                </tr>
              ))}
              {salesToday.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Belum ada penjualan hari ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Komponen Card yang sama dengan halaman Kas Kecil
function Card({ title, value, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? 'border-primary/40' : ''}`}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}