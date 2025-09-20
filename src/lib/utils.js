export function cn(...classes) { return classes.filter(Boolean).join(' '); }
export function fmtIDR(num = 0) {
  try { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num); }
  catch { return String(num); }
}
