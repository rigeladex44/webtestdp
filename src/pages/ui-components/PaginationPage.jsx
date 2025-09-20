import React, { useMemo, useState } from 'react';
const DATA = Array.from({length: 67}).map((_,i)=>({id:i+1,name:`Item ${i+1}`}));
export default function PaginationPage() {
  const [page, setPage] = useState(1);
  const size = 10;
  const total = Math.ceil(DATA.length/size);
  const data = useMemo(()=>DATA.slice((page-1)*size, page*size),[page]);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Pagination</h2>
      <ul className="card p-4 space-y-1">{data.map(r=><li key={r.id}>{r.name}</li>)}</ul>
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 rounded bg-muted" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <div className="text-sm">Page {page} / {total}</div>
        <button className="px-2 py-1 rounded bg-muted" disabled={page>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );
}
