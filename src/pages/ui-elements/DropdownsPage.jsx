import React, { useState } from 'react';
export default function DropdownsPage() {
  const [v, setV] = useState('one');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dropdowns</h2>
      <select className="h-10 w-60 rounded-md border bg-background px-3 text-sm" value={v} onChange={e=>setV(e.target.value)}>
        <option value="one">One</option>
        <option value="two">Two</option>
        <option value="three">Three</option>
      </select>
      <div className="text-sm text-muted-foreground">Selected: {v}</div>
    </div>
  );
}
