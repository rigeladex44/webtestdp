// src/routes/RequireRole.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const isAuthed = () => localStorage.getItem('isAuthenticated') === 'true';

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('auth:user')); } catch { return null; }
}

export default function RequireRole({ role, children, redirect = '/dashboard' }) {
  const me = getCurrentUser();

  // Belum login → ke login
  if (!isAuthed() || !me) return <Navigate to="/login" replace />;

  // Akun dinonaktifkan → paksa logout & ke login
  if (me.active === false) {
    try { localStorage.setItem('isAuthenticated', 'false'); localStorage.removeItem('auth:user'); } catch {}
    return <Navigate to="/login" replace />;
  }

  // Validasi role (boleh string atau array)
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(me.role)) {
      return <Navigate to={redirect} replace />;
    }
  }

  return children;
}
