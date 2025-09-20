import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function DatePickerPage() {
  const [date, setDate] = useState(new Date());
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Date Picker</h2>
      <div className="card p-4">
        <DatePicker selected={date} onChange={setDate} className="h-10 w-60 rounded-md border bg-background px-3 text-sm" />
      </div>
    </div>
  );
}
