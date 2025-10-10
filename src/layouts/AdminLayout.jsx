// src/layouts/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="space-y-6">
      {/* Header + subnav */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Panel Admin</h2>
          <div className="ml-auto flex items-center gap-2">
            <AdminTab to="/admin" end>Beranda</AdminTab>
            <AdminTab to="/admin/users">Users</AdminTab>
            <AdminTab to="/admin/audit">Audit</AdminTab>
          </div>
        </div>
      </div>

      {/* Content */}
      <Outlet />
    </div>
  );
}

function AdminTab({ to, end, children }) {
  const base =
    "rounded-md px-3 py-1.5 text-sm transition-colors border";
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive
          ? `${base} bg-primary/10 border-primary/40 text-foreground`
          : `${base} bg-background hover:bg-muted/60 text-muted-foreground`
      }
    >
      {children}
    </NavLink>
  );
}
