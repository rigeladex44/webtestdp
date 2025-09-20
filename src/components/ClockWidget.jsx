// src/components/ClockWidget.jsx
import React from 'react';

const TZ = 'Asia/Jakarta';

function formatNow() {
  const now = new Date();
  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long', timeZone: TZ });      // Senin
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }); // 18/08/2025
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: TZ }); // 14:23:51
  return { dayName, dateStr, timeStr };
}

export default function ClockWidget({ className = '' }) {
  const [{ dayName, dateStr, timeStr }, setState] = React.useState(formatNow);

  React.useEffect(() => {
    const id = setInterval(() => setState(formatNow()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-xl border bg-muted px-3 py-2 text-sm",
        "shadow-sm select-none",
        "tabular-nums", // angka rata, biar jam stabil
        className
      ].join(' ')}
      title={`${dayName}, ${dateStr} ${timeStr} WIB`}
    >
      <span className="font-semibold">{dayName}</span>
      <span className="opacity-50">•</span>
      <span>{dateStr}</span>
      <span className="opacity-50">•</span>
      <span>{timeStr} <span className="opacity-60">WIB</span></span>
    </div>
  );
}
