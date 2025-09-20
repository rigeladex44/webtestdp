// src/components/ui/date-picker.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

/** Util */
const idMonthLong = (y, m) =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
    .format(new Date(y, m, 1));

const idDateLong = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(d);
};

const pad = (n) => String(n).padStart(2, '0');
const toISO = (y, m0, d) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

const daysInMonth = (y, m0) => new Date(y, m0 + 1, 0).getDate();
const firstDayIdx = (y, m0) => new Date(y, m0, 1).getDay(); // 0..6 (Sun..Sat)

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Props:
 * value (iso), onChange(iso), min?, max?, label?
 */
export default function DatePicker({ value, onChange, min, max, label }) {
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);

  // current cursor (year & month0) untuk navigasi panel
  const now = value ? new Date(value) : new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m0, setM0] = useState(now.getMonth()); // 0..11
  const [view, setView] = useState('year'); // 'year' | 'month' | 'day'

  // sync ketika value berubah dari luar
  useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    setY(d.getFullYear());
    setM0(d.getMonth());
  }, [value]);

  // close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!panelRef.current) return;
      if (
        !panelRef.current.contains(e.target) &&
        !anchorRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const minISO = min || '0000-01-01';
  const maxISO = max || '9999-12-31';
  const isDisabledISO = (iso) => iso < minISO || iso > maxISO;

  /** RENDERERS */

  const YearView = () => {
    // range dekade (contoh: 2020–2029)
    const start = Math.floor(y / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => start - 1 + i); // tampil 12 grid (prev guard + 10 + next guard)
    return (
      <div className="p-3 w-[260px]">
        <div className="flex items-center justify-between mb-2">
          <button
            className="px-2 py-1 rounded hover:bg-muted"
            onClick={() => setY(y - 10)}
            aria-label="Prev decade"
          >«</button>
          <div className="text-sm font-medium">{start}–{start + 9}</div>
          <button
            className="px-2 py-1 rounded hover:bg-muted"
            onClick={() => setY(y + 10)}
            aria-label="Next decade"
          >»</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((yy, i) => {
            const muted = i === 0 || i === years.length - 1;
            return (
              <button
                key={yy}
                className={
                  'h-9 rounded border text-sm ' +
                  (muted ? 'text-muted-foreground' : '') +
                  ' hover:bg-accent'
                }
                onClick={() => { setY(yy); setView('month'); }}
              >
                {yy}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const MonthView = () => (
    <div className="p-3 w-[260px]">
      <div className="flex items-center justify-between mb-2">
        <button
          className="px-2 py-1 rounded hover:bg-muted"
          onClick={() => setY(y - 1)}
          aria-label="Prev year"
        >«</button>
        <button
          className="text-sm font-medium hover:underline"
          onClick={() => setView('year')}
        >
          {y}
        </button>
        <button
          className="px-2 py-1 rounded hover:bg-muted"
          onClick={() => setY(y + 1)}
          aria-label="Next year"
        >»</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((mm, idx) => (
          <button
            key={mm}
            className="h-9 rounded border text-sm hover:bg-accent"
            onClick={() => { setM0(idx); setView('day'); }}
          >
            {mm}
          </button>
        ))}
      </div>
    </div>
  );

  const DayView = () => {
    const dim = daysInMonth(y, m0);
    const first = firstDayIdx(y, m0); // 0..6, Sunday first
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);

    const header = idMonthLong(y, m0).split(' ');
    return (
      <div className="p-3 w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <button
            className="px-2 py-1 rounded hover:bg-muted"
            onClick={() => {
              const ny = m0 === 0 ? y - 1 : y;
              const nm = m0 === 0 ? 11 : m0 - 1;
              setY(ny); setM0(nm);
            }}
            aria-label="Prev month"
          >«</button>

          <div className="text-sm font-medium">
            <button className="hover:underline mr-1" onClick={() => setView('month')}>
              {header[0]}
            </button>
            <button className="hover:underline" onClick={() => setView('year')}>
              {header[1]}
            </button>
          </div>

          <button
            className="px-2 py-1 rounded hover:bg-muted"
            onClick={() => {
              const ny = m0 === 11 ? y + 1 : y;
              const nm = m0 === 11 ? 0 : m0 + 1;
              setY(ny); setM0(nm);
            }}
            aria-label="Next month"
          >»</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1">
          {WEEK.map((w) => <div key={w} className="h-7 grid place-items-center">{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`x${i}`} className="h-8" />;
            const iso = toISO(y, m0, d);
            const disabled = isDisabledISO(iso);
            return (
              <button
                key={iso}
                disabled={disabled}
                onClick={() => { onChange?.(iso); setOpen(false); }}
                className={
                  'h-8 rounded border text-sm ' +
                  (disabled ? 'text-muted-foreground opacity-60 cursor-not-allowed ' : 'hover:bg-accent ')
                }
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={anchorRef}>
      {label && <label className="text-sm block mb-1">{label}</label>}
      <button
        type="button"
        className="h-10 w-[240px] rounded-md border bg-background px-3 text-left text-sm"
        onClick={() => setOpen((s) => !s)}
      >
        {value ? idDateLong(value) : <span className="text-muted-foreground">Pilih tanggal…</span>}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-2 rounded-md border bg-popover shadow-xl"
        >
          {view === 'year' && <YearView />}
          {view === 'month' && <MonthView />}
          {view === 'day' && <DayView />}
        </div>
      )}
    </div>
  );
}
