// src/pages/CashflowMini.jsx
import React, { useMemo, useState, useEffect } from 'react';
import Input from '@/components/ui/input.jsx';
import Button from '@/components/ui/button.jsx';
import PtMultiSelectFilter from '@/components/ui/PtMultiSelectFilter.jsx';
import { useTransactions } from '@/context/TransactionsContext.jsx';
import { getCurrentUser } from '@/lib/auth.js';
import { PT_LIST, CATEGORY_LIST } from '@/lib/constants.js';
import { fmtIDR } from '@/lib/utils.js';
import { useToast } from '@/components/use-toast.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const todayISO = new Date().toISOString().slice(0, 10);
const todayLabel = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(new Date(todayISO));

function getKasirName() {
  try {
    const n1 = localStorage.getItem('auth:name');
    if (n1) return n1;
    const raw = localStorage.getItem('auth:user');
    if (raw) {
      const u = JSON.parse(raw);
      return u.name || u.username || (u.email ? u.email.split('@')[0] : '') || 'Kasir';
    }
  } catch {}
  return 'Kasir';
}

export default function CashflowMini() {
  const { transactions, add, update, remove } = useTransactions();
  const { toast } = useToast();
  const kasir = getKasirName();
  const me = useMemo(() => getCurrentUser(), []);
  const isDirector = me?.role === 'direktur';

  const [ptFilter, setPtFilter] = useState(() => 
    isDirector ? [me.pt] : PT_LIST.map(p => p.fullName)
  );
  const makeEmpty = () => ({
    date: todayISO, pt: isDirector ? me.pt : PT_LIST[0].fullName,
    desc: '', category: 'Umum', type: 'Keluar', amount: '',
  });
  const [form, setForm] = useState(makeEmpty());

  useEffect(() => {
    if (isDirector) {
      setPtFilter([me.pt]);
      setForm(f => ({ ...f, pt: me.pt }));
    }
  }, [isDirector, me]);

  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState(null);

  const { inCash, outCash, saldo, list } = useMemo(() => {
    const base = transactions.filter((t) => t.date === todayISO).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    const byPT = (t) => {
      if (isDirector) return (t.pt || '') === me.pt;
      if (ptFilter.length === 0) return false;
      return ptFilter.includes(t.pt || '');
    };
    const rows = base.filter(byPT);
    const inCash  = rows.filter(t => t.type === 'Masuk').reduce((s,t)=>s+t.amount, 0);
    const outCash = rows.filter(t => t.type === 'Keluar').reduce((s,t)=>s+t.amount, 0);
    return { inCash, outCash, saldo: inCash - outCash, list: rows };
  }, [transactions, ptFilter, isDirector, me]);

  const onSubmit = (e) => {
    e.preventDefault();
    const amt = Number(String(form.amount).replace(/[^\d.-]/g, ''));
    if (!form.desc.trim()) return toast({ title: 'Deskripsi wajib diisi', type: 'error' });
    if (!amt || amt <= 0)  return toast({ title: 'Jumlah harus > 0', type: 'error' });
    add({ date: todayISO, pt: form.pt, desc: form.desc, category: form.category, type: form.type, amount: amt, createdAt: Date.now() });
    setForm(makeEmpty());
    toast({ title: 'Transaksi ditambahkan', type: 'success' });
  };
  
  const startEdit = (row) => { setEditId(row.id); setEditRow({ ...row, amount: String(row.amount), pt: row.pt || (isDirector ? me.pt : PT_LIST[0].fullName) }); };
  const cancelEdit = () => { setEditId(null); setEditRow(null); };
  const saveEdit = () => {
    const amt = Number(String(editRow.amount).replace(/[^\d.-]/g, ''));
    if (!editRow.desc.trim() || !amt || amt <= 0) return toast({ title: 'Data tidak valid', type: 'error' });
    update(editId, { date: todayISO, pt: editRow.pt, desc: editRow.desc, category: editRow.category, type: editRow.type, amount: amt, createdAt: editRow.createdAt ?? Date.now() });
    cancelEdit(); toast({ title: 'Perubahan disimpan', type: 'success' });
  };
  const deleteRow = (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    remove(id); if (editId === id) cancelEdit();
    toast({ title: 'Transaksi dihapus', type: 'success' });
  };

  const exportCSV = () => {
    let running = 0;
    const header = ['NO','Tanggal','PT','SUBJEK','Kategori','Diinput Oleh','MASUK (Rp)','KELUAR (Rp)','SALDO (Rp)'];
    const rows = list.map((t, i) => {
      const Masuk  = t.type === 'Masuk'  ? t.amount : 0;
      const Keluar = t.type === 'Keluar' ? t.amount : 0;
      running += (Masuk - Keluar);
      const ptTag = PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt;
      return [ String(i + 1), t.date, ptTag || '', t.desc || '', t.category || '', t.operator || '', Masuk.toString(), Keluar.toString(), running.toString() ];
    });
    const totalMasuk  = list.reduce((s,t) => s + (t.type === 'Masuk' ? t.amount : 0), 0);
    const totalKeluar = list.reduce((s,t) => s + (t.type === 'Keluar' ? t.amount : 0), 0);
    const totalSaldo  = totalMasuk - totalKeluar;
    rows.push([]);
    rows.push(['','','','','','GRAND TOTAL', totalMasuk.toString(), totalKeluar.toString(), totalSaldo.toString()]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `arus-kas-kecil_${todayISO}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(todayISO));

    doc.setFontSize(14); doc.setFont(undefined, 'bold');
    doc.text('LAPORAN KAS KECIL', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    const ptTitle = isDirector ? me.pt : (ptFilter.length === PT_LIST.length ? 'SEMUA PERUSAHAAN' : ptFilter.join(' - '));
    doc.text(ptTitle, pageWidth / 2, margin + 12, { align: 'center' });
    
    autoTable(doc, {
      startY: margin + 24, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5, lineWidth: 0.5, lineColor: 200 }, head: [],
      body: [ ['Hari', hari, 'Kasir', kasir], ['Tanggal',  todayLabel, '',    ''] ],
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
    });
    
    let runningBalance = 0;
    const tableBody = list.map((t, i) => {
      const Masuk  = t.type === 'Masuk'  ? t.amount : 0;
      const Keluar = t.type === 'Keluar' ? t.amount : 0;
      runningBalance += (Masuk - Keluar);
      const ptTag = PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt;
      return [ i + 1, ptTag, t.desc, t.operator, fmtIDR(Masuk), fmtIDR(Keluar), fmtIDR(runningBalance) ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineWidth: 0.5, lineColor: 200, valign: 'middle' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      head: [['NO', 'PT', 'SUBJEK', 'Diinput Oleh', 'Masuk (Rp)', 'Keluar (Rp)', 'SALDO (Rp)']],
      body: tableBody,
      foot: [
        [
          { content: 'GRAND TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', textColor: [0,0,0] } },
          { content: fmtIDR(inCash), styles: { halign: 'right', fontStyle: 'bold', textColor: [0,0,0] } },
          { content: fmtIDR(outCash), styles: { halign: 'right', fontStyle: 'bold', textColor: [0,0,0] } },
          { content: fmtIDR(saldo), styles: { halign: 'right', fontStyle: 'bold', textColor: [0,0,0] } }
        ]
      ],
      footStyles: { fontSize: 8, cellPadding: 4, fillColor: [255, 255, 255] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 }, 2: { cellWidth: 150 },
        4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' },
      },
    });

    const signatureY = doc.lastAutoTable.finalY + 30;
    autoTable(doc, {
      startY: signatureY, margin: { left: margin, right: margin }, theme: 'grid',
      styles: { halign: 'center', fontSize: 9, lineWidth: 0.5, lineColor: 200 },
      headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
      bodyStyles: { minCellHeight: 60, valign: 'bottom' },
      head: [['Kasir', 'M. Keuangan', 'DIREKTUR']],
      body: [[`( ${kasir} )`, '( _______________ )', '( _______________ )']],
    });
    
    doc.save(`arus-kas-kecil_${todayISO}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-semibold">Arus Kas Kecil</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Tanggal: <span className="font-medium text-foreground">{todayLabel}</span>
            {' · '}
            Kasir: <span className="font-medium text-foreground">{kasir}</span>
          </div>
        </div>
        {isDirector ? (
          <div>
            <label className="text-sm block">PT</label>
            <div className="mt-1 h-10 w-full min-w-[150px] rounded-md border bg-background/50 px-3 text-sm flex items-center">
              {PT_LIST.find(p => p.fullName === me.pt)?.tag || me.pt}
            </div>
          </div>
        ) : (
          <PtMultiSelectFilter selectedPts={ptFilter} onChange={setPtFilter} />
        )}
        <div className="flex gap-2">
          <Button type="button" onClick={exportCSV}>Export CSV</Button>
          <Button type="button" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Kas Masuk (hari ini)" value={fmtIDR(inCash)} />
        <Card title="Kas Keluar (hari ini)" value={fmtIDR(outCash)} />
        <Card title="Saldo (hari ini)" value={fmtIDR(saldo)} highlight />
      </div>
      <form onSubmit={onSubmit} className="card p-4 grid grid-cols-1 md:grid-cols-7 gap-3">
        <div>
          <label className="text-sm block">Tanggal</label>
          <Input type="date" value={todayISO} disabled />
        </div>
        <div>
          <label className="text-sm block">PT</label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-75" value={form.pt} onChange={(e) => setForm({ ...form, pt: e.target.value })} disabled={isDirector}>
            {PT_LIST.map(pt => <option key={pt.tag} value={pt.fullName}>{pt.tag}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm block">Deskripsi</label>
          <Input placeholder="Contoh: Beli ATK" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        </div>
        <div>
          <label className="text-sm block">Kategori</label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <optgroup label="Pemasukan">
              {CATEGORY_LIST.filter(c => c.type === 'Masuk').map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </optgroup>
            <optgroup label="Pengeluaran">
              {CATEGORY_LIST.filter(c => c.type === 'Keluar').map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="text-sm block">Tipe</label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Masuk">Masuk</option>
            <option value="Keluar">Keluar</option>
          </select>
        </div>
        <div>
          <label className="text-sm block">Jumlah (Rp)</label>
          <Input inputMode="numeric" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="md:col-span-7 flex gap-2">
          <Button type="submit">Tambah</Button>
          <Button type="button" className="bg-gray-300 text-gray-900 border border-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600" onClick={() => setForm(makeEmpty())}>
            Reset
          </Button>
        </div>
      </form>
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-2">Transaksi hari ini</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Tanggal</th><th>PT</th><th>Deskripsi</th><th>Kategori</th>
                <th>Diinput Oleh</th><th>Tipe</th><th className="text-right">Jumlah</th>
                <th className="text-right w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const isEditing = editId === t.id;
                return (
                  <tr key={t.id} className="border-t align-top">
                    <td className="py-2">{t.date}</td>
                    <td>
                      {isEditing ? (
                        <select className="h-8 w-full rounded-md border bg-background px-2 text-sm disabled:opacity-75" value={editRow.pt} onChange={(e) => setEditRow({ ...editRow, pt: e.target.value })} disabled={isDirector}>
                          {PT_LIST.map(pt => <option key={pt.tag} value={pt.fullName}>{pt.tag}</option>)}
                        </select>
                      ) : (PT_LIST.find(p => p.fullName === t.pt)?.tag || t.pt || '-')}
                    </td>
                    <td>
                      {isEditing ? <Input className="h-8" value={editRow.desc} onChange={(e) => setEditRow({ ...editRow, desc: e.target.value })} /> : (t.desc || '-')}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="h-8 w-full rounded-md border bg-background px-2 text-sm" value={editRow.category} onChange={(e) => setEditRow({ ...editRow, category: e.target.value })}>
                           <optgroup label="Pemasukan">
                            {CATEGORY_LIST.filter(c => c.type === 'Masuk').map(cat => (
                              <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Pengeluaran">
                            {CATEGORY_LIST.filter(c => c.type === 'Keluar').map(cat => (
                              <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                          </optgroup>
                        </select>
                      ) : (t.category || '-')}
                    </td>
                    <td>{t.operator || '-'}</td>
                    <td>
                      {isEditing ? (
                        <select className="h-8 w-full rounded-md border bg-background px-2 text-sm" value={editRow.type} onChange={(e) => setEditRow({ ...editRow, type: e.target.value })}>
                          <option value="Masuk">Masuk</option><option value="Keluar">Keluar</option>
                        </select>
                      ) : (t.type)}
                    </td>
                    <td className={`text-right ${t.type === 'Masuk' ? 'text-green-500' : 'text-red-400'}`}>{isEditing ? <Input className="h-8 text-right" inputMode="numeric" value={editRow.amount} onChange={(e) => setEditRow({ ...editRow, amount: e.target.value })} /> : <>{t.type === 'Masuk' ? '+' : '-'} {fmtIDR(t.amount)}</>}</td>
                    <td className="text-right">
                      {isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <Button type="button" className="h-8 px-3" onClick={saveEdit}>Simpan</Button>
                          <Button type="button" className="h-8 px-3 bg-transparent border" onClick={cancelEdit}>Batal</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button type="button" className="h-8 px-3" onClick={() => startEdit(t)}>Edit</Button>
                          <Button type="button" className="h-8 px-3 bg-red-600 hover:bg-red-700" onClick={() => deleteRow(t.id)}>Hapus</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && ( <tr><td colSpan={8} className="py-4 text-center text-muted-foreground"> Belum ada data hari ini. </td></tr> )}
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