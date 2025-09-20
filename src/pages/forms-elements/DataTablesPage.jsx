import React, { useMemo, useState } from 'react';
import Input from '@/components/ui/input.jsx';

const RAW = Array.from({length: 50}).map((_,i)=>({ id:i+1, name:`Customer ${i+1}`, city:['Jakarta','Bandung','Surabaya'][i%3], spend: Math.round(Math.random()*5_000_000) }));

export default function DataTablesPage() {
  const [q, setQ] = useState(''); const [sort, setSort] = useState({by:'id', dir:'asc'});

  const data = useMemo(()=>{
    let out = RAW.filter(r => (q ? (r.name.toLowerCase().includes(q.toLowerCase()) || r.city.toLowerCase().includes(q.toLowerCase())) : true));
    out.sort((a,b)=>{
      const v1=a[sort.by], v2=b[sort.by];
      if(v1<v2) return sort.dir==='asc'?-1:1;
      if(v1>v2) return sort.dir==='asc'?1:-1;
      return 0;
    });
    return out;
  },[q,sort]);

  const toggleSort = (by)=> setSort(s => ({ by, dir: s.by===by && s.dir==='asc' ? 'desc':'asc' }));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Data Tables</h2>
      <div className="flex gap-2 items-center">
        <Input placeholder="Cari…" value={q} onChange={e=>setQ(e.target.value)} className="w-64" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="cursor-pointer py-2" onClick={()=>toggleSort('id')}>ID</th>
              <th className="cursor-pointer" onClick={()=>toggleSort('name')}>Name</th>
              <th className="cursor-pointer" onClick={()=>toggleSort('city')}>City</th>
              <th className="cursor-pointer" onClick={()=>toggleSort('spend')}>Spend</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r)=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.city}</td>
                <td>{r.spend.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
