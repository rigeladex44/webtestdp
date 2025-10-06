// src/context/TransactionsContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '@/lib/auth.js';

const KEY = 'txns:v1';
const Ctx = createContext(null);

// Fungsi helper baru untuk mendapatkan nama operator/kasir dengan lebih andal
function getOperatorName() {
  try {
    // Prioritaskan nama yang disimpan di 'auth:name' jika ada
    const n1 = localStorage.getItem('auth:name');
    if (n1) return n1;
    // Jika tidak, ambil dari objek user
    const currentUser = getCurrentUser();
    return currentUser ? currentUser.name || currentUser.username : 'System';
  } catch {
    return 'System';
  }
}

// --- Normalizer aturan bisnis ---
// - Semua penjualan = penebusan pangkalan (actorType, kind)
// - affectsCash = true hanya bila pembayaran tunai (case-insensitive)
function normalizeTxn(txn) {
  const payRaw = txn.paymentMethod ?? txn.payMethod ?? 'Tunai';
  const payLower = String(payRaw).toLowerCase(); // 'tunai' | 'cashless' | etc
  const isCash = payLower === 'tunai' || payLower === 'cash';

  return {
    actorType: 'pangkalan',           // tidak ada retail umum
    kind: 'penebusan',                // jenis transaksi
    payMethod: payRaw,                // simpan apa adanya untuk UI (Tunai/Cashless)
    affectsCash: typeof txn.affectsCash === 'boolean' ? txn.affectsCash : isCash,
    // field orisinal tetap dipertahankan:
    ...txn,
  };
}

// Migrasi data lama di storage agar konsisten dengan aturan baru
function migrateIfNeeded(list) {
  let changed = false;
  const mapped = list.map((t) => {
    const need =
      t.actorType === undefined ||
      t.kind === undefined ||
      t.payMethod === undefined ||
      t.affectsCash === undefined;

    if (!need) return t;

    changed = true;
    return normalizeTxn(t);
  });
  return { mapped, changed };
}

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  });

  // Migrasi ringan di mount agar data lama ikut pakai flag baru
  useEffect(() => {
    const { mapped, changed } = migrateIfNeeded(transactions);
    if (changed) {
      setTransactions(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hanya sekali

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(transactions));
  }, [transactions]);

  // --- FUNGSI 'add' DIPERBAIKI ---
  const add = (txn) => {
    const operator = getOperatorName();
    const normalized = normalizeTxn(txn);
    setTransactions((prev) => [
      {
        id: crypto.randomUUID(),
        operator,              // Nama operator/kasir terisi
        ...normalized,
      },
      ...prev,
    ]);
  };

  const update = (id, patch) => setTransactions((prev) =>
    prev.map((t) => (t.id === id ? { ...t, ...normalizeTxn({ ...t, ...patch }) } : t))
  );

  const remove = (id) => setTransactions((prev) => prev.filter((t) => t.id !== id));
  const clearAll = () => setTransactions([]);

  const value = useMemo(() => ({ transactions, add, update, remove, clearAll }), [transactions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTransactions() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTransactions harus dipakai di dalam <TransactionsProvider>');
  return ctx;
}
