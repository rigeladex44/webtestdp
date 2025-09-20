// src/layouts/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar.jsx';

function getName() {
  try {
    const raw = localStorage.getItem('auth:user');
    if (raw) {
      const u = JSON.parse(raw);
      return u.name || u.username || 'Admin';
    }
  } catch {}
  return localStorage.getItem('auth:name') || 'Admin';
}

export default function AdminLayout() {
  const name = getName();

  const onLogout = () => {
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.removeItem('auth:user');
    location.href = '/login';
  };

  return (
    <div className="min-h-screen grid grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="p-5">
        {/* Header simpel & rapi */}
        <header className="mb-5 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Admin</h1>
          <span className="text-sm text-muted-foreground">({name})</span>

          {/* kanan: hanya Logout */}
          <div className="ml-auto">
            <button
              onClick={onLogout}
              className="text-sm rounded-md border px-3 py-1.5 hover:bg-muted/60"
            >
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
