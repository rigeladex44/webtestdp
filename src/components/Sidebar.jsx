// src/components/Sidebar.jsx
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV } from '@/nav.jsx'; // Mengambil data menu
import { getCurrentUser } from '@/lib/auth.js';
import { ChevronLeft } from 'lucide-react';

// === Komponen-komponen dari Sidebar lama Anda, kita gunakan lagi ===

function Brand({ collapsed, onToggle }) {
  const LOGO_URL = '/logo-sje.png'; // Pastikan logo ini ada di folder /public
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
      {collapsed ? (
        <div className="w-10 h-10 grid place-items-center">
          <img src={LOGO_URL} alt="SJ" className="h-8 w-auto" onError={() => setImgOk(false)} />
        </div>
      ) : (
        <img src={LOGO_URL} alt="Sumber Jaya Grup" className="h-9 w-auto" onError={() => setImgOk(false)} />
      )}
      {!collapsed && (
        <button
          className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 hover:bg-white/10"
          onClick={onToggle} aria-label="Toggle sidebar" title="Perkecil"
        >
          <ChevronLeft className="h-4 w-4 transition-transform" />
        </button>
      )}
    </div>
  );
}

function Section({ group, collapsed }) {
  return (
    <div>
      {!collapsed && <div className="px-3 text-[11px] uppercase tracking-wider mb-2 text-white/60">{group.group}</div>}
      <nav className="flex flex-col gap-1">
        {group.children.map((item) => (
          <SidebarLink key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </div>
  );
}

function SidebarLink({ item, collapsed }) {
  const base   = 'relative group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors';
  const idle   = 'text-white/70 hover:text-white hover:bg-white/10';
  const active = 'bg-white/10 text-white shadow-sm';

  return (
    <NavLink to={item.path} title={item.label} end={item.path === '/dashboard'} className={({ isActive }) => [base, isActive ? active : idle].join(' ')}>
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 shadow-md group-hover:block z-50">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}


// === Komponen Utama Sidebar (Gabungan) ===

export default function Sidebar({ isDesktopCollapsed, onDesktopToggle, isMobileNavOpen, setIsMobileNavOpen }) {
  // Logika penyaringan menu berdasarkan peran (dari kode lama Anda)
  const me = useMemo(() => {
    try { return getCurrentUser(); } catch { return null; }
  }, []);
  const role = me?.role || 'kasir';

  const visibleNav = useMemo(() => {
    return NAV
      .map(group => ({
        ...group,
        children: group.children.filter(item => !item.roles || item.roles.includes(role))
      }))
      .filter(group => group.children.length > 0);
  }, [role]);

  // Konten navigasi yang bisa dipakai ulang
  const NavContent = ({ collapsed, onToggle }) => (
    <>
      <Brand collapsed={collapsed} onToggle={onToggle} />
      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {visibleNav.map((group) => (
          <Section key={group.group} collapsed={collapsed} group={group} />
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* --- Sidebar untuk Desktop --- */}
      <aside className={`hidden md:flex md:flex-col border-r transition-all duration-300 bg-slate-900 text-white border-slate-800 ${isDesktopCollapsed ? 'w-20' : 'w-64'}`}>
        <NavContent collapsed={isDesktopCollapsed} onToggle={onDesktopToggle} />
      </aside>

      {/* --- Sidebar untuk Mobile (sebagai overlay) --- */}
      {isMobileNavOpen && (
        <>
          <div onClick={() => setIsMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-slate-900 text-white border-slate-800 md:hidden">
            <NavContent collapsed={false} onToggle={() => setIsMobileNavOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}