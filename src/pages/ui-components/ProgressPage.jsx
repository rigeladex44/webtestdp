import React, { useState } from 'react';
export default function ProgressPage() {
  const [v, setV] = useState(40);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Progress Bar</h2>
      <input type="range" min="0" max="100" value={v} onChange={e=>setV(Number(e.target.value))} />
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-3 bg-primary" style={{width:`${v}%`}} />
      </div>
      <div className="text-sm text-muted-foreground">{v}%</div>
    </div>
  );
}
