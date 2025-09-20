import React from 'react';
import { NavLink } from 'react-router-dom';

const Item = ({ to, label }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      [
        'block rounded-lg px-3 py-2 text-sm transition-colors',
        isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10',
      ].join(' ')
    }
  >
    {label}
  </NavLink>
);

export default function AdminSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-[240px] p-5 bg-slate-900 text-white border-r border-slate-800">
      <div className="mb-4">
        <img src="/logo-sje.png" alt="SJE" className="h-9 w-auto object-contain" />
        <div className="text-xs text-white/60 mt-1">Admin Panel</div>
      </div>
      <nav className="flex flex-col gap-1">
        <Item to="/admin" label="Dashboard Admin" />
        <Item to="/admin/users" label="Users" />
      </nav>
    </aside>
  );
}
