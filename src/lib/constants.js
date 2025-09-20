// src/lib/constants.js

export const PT_LIST = [
  { tag: 'KSS', fullName: 'PT KHALISA SALMA SEJAHTERA' },
  { tag: 'SJE', fullName: 'PT SUMBER JAYA ELPIJI' },
  { tag: 'FAB', fullName: 'PT FADILLAH AMANAH BERSAMA' },
  { tag: 'SJS', fullName: 'PT SRI JOYO SHAKTI' },
  { tag: 'KBS', fullName: 'PT KHABITSA INDOGAS' },
];

// --- TAMBAHKAN KODE DI BAWAH INI ---
export const CATEGORY_LIST = [
  // PENDAPATAN
  { name: 'Penjualan Gas LPG 3Kg', type: 'Masuk' },
  { name: 'Pendapatan Lain - Lain', type: 'Masuk' },
  { name: 'Transport Fee', type: 'Masuk' },
  
  // BIAYA & BEBAN
  { name: 'HPP Gas LPG 3Kg', type: 'Keluar' },
  { name: 'Beban Gaji Karyawan', type: 'Keluar' },
  { name: 'Beban Pajak & Fee Konsultan Pajak', type: 'Keluar' },
  { name: 'Angsuran: Sewa Tabung', type: 'Keluar' },
  { name: 'Angsuran: Sewa Truk', type: 'Keluar' },
  { name: 'Angsuran: BPJS TK', type: 'Keluar' },
  { name: 'Angsuran: Pak Dwi', type: 'Keluar' },
  { name: 'Angsuran: Perorangan', type: 'Keluar' },
  { name: 'Angsuran: Keluarga Alm P Daniel', type: 'Keluar' },
  { name: 'Dana Khusus Bu Ulfa Sekeluarga', type: 'Keluar' },
  { name: 'Pengeluaran Lain-lain', type: 'Keluar' },
  { name: 'Pengeluaran Kasbon', type: 'Keluar' },
  { name: 'Biaya Operasional', type: 'Keluar' },
  { name: 'ATK', type: 'Keluar' }, // Kategori lama tetap dimasukkan
  { name: 'Umum', type: 'Keluar' }, // Kategori lama tetap dimasukkan
];