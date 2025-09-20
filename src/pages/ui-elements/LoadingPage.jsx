import React from 'react';
const Dot = () => <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce mr-1" />;
export default function LoadingPage() {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">Loading</h2>
      <div className="card p-6 flex items-center gap-3">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="flex"><Dot /><Dot /><Dot /></div>
      </div>
    </div>
  );
}
