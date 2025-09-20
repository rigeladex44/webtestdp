// src/routes/RequireRole.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth.js';

export default function RequireRole({ role, children }) {
  const me = getCurrentUser();
  if (!me) return <Navigate to="/login" replace />;
  if (role && me.role !== role) return <div className="p-6">403 — Akses ditolak.</div>;
  return children;
}
