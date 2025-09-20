import React, { useState } from 'react';
const items = ['Satu','Dua','Tiga','Empat'];
export default function CarouselPage() {
  const [i, setI] = useState(0);
  const prev = ()=> setI((i-1+items.length)%items.length);
  const next = ()=> setI((i+1)%items.length);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Carousel (simple)</h2>
      <div className="card p-6 flex items-center justify-between">
        <button className="px-3 py-2 rounded bg-muted" onClick={prev}>Prev</button>
        <div className="text-xl">{items[i]}</div>
        <button className="px-3 py-2 rounded bg-muted" onClick={next}>Next</button>
      </div>
    </div>
  );
}
