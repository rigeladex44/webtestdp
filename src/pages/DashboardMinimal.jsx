import React from 'react';
export default function DashboardMinimal() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard — Minimal</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">Card 1</div>
        <div className="card p-6">Card 2</div>
        <div className="card p-6">Card 3</div>
      </div>
    </div>
  );
}
