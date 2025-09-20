import React, { useState } from 'react';
const QA = [
  { q: 'Bagaimana cara menambah transaksi?', a: 'Buka menu Transactions lalu isi form di atas tabel.' },
  { q: 'Apakah data tersimpan?', a: 'Tersimpan otomatis di localStorage (demo).' },
  { q: 'Bisa ekspor?', a: 'Bisa ditambah di versi berikut (CSV/PDF).' },
];
export default function FAQPage() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold mb-2">FAQ</h2>
      {QA.map((item,idx)=>(
        <div key={idx} className="card p-4">
          <button className="w-full text-left font-medium" onClick={()=>setOpen(open===idx?null:idx)}>{item.q}</button>
          {open===idx && <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
