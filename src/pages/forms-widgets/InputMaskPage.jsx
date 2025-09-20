import React, { useState } from 'react';
import InputMask from 'react-input-mask';

export default function InputMaskPage() {
  const [phone, setPhone] = useState('');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Input Mask</h2>
      <div className="card p-4 max-w-sm">
        <InputMask
          mask="9999-9999-9999"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          placeholder="0812-3456-7890"
        />
      </div>
    </div>
  );
}
