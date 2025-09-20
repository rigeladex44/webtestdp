import React, { useState } from 'react';
import Select from 'react-select';

export default function InputSelectsPage() {
  const [value, setValue] = useState(null);
  const options = [
    { value:'jakarta', label:'Jakarta' },
    { value:'bandung', label:'Bandung' },
    { value:'surabaya', label:'Surabaya' },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Input Selects</h2>
      <div className="card p-4 max-w-sm">
        <Select options={options} value={value} onChange={setValue} />
        <div className="text-sm text-muted-foreground mt-2">Value: {value ? value.label : '—'}</div>
      </div>
    </div>
  );
}
