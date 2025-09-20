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

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(transactions));
  }, [transactions]);

  // --- FUNGSI 'add' DIPERBAIKI ---
  const add = (txn) => {
    const operator = getOperatorName(); // Panggil fungsi helper baru
    setTransactions((prev) => [
      { 
        id: crypto.randomUUID(),
        operator: operator, // <-- Nama dijamin terisi dengan benar
        ...txn 
      }, 
      ...prev
    ]);
  };
  
  const update = (id, patch) => setTransactions((prev) => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  const remove = (id) => setTransactions((prev) => prev.filter(t => t.id !== id));
  const clearAll = () => setTransactions([]);

  const value = useMemo(() => ({ transactions, add, update, remove, clearAll }), [transactions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTransactions() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTransactions harus dipakai di dalam <TransactionsProvider>');
  return ctx;
}