import React from 'react';
export default function GridTablesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Grid Tables</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({length:8}).map((_,i)=>(<div key={i} className="card p-6">Row {i+1}</div>))}
      </div>
    </div>
  );
}
