// src/components/Sidebar.jsx
import React, { useMemo, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { NAV } from "../nav.jsx";
import { getCurrentUser } from "../lib/auth.js";
import { hasFeature } from "../lib/features.js";

/** Bar paling atas: LOGO + (Nama & Jabatan di sebelah logo saat expanded) + (tombol close di mobile) */
function BrandBar({ collapsed, user, onClose }) {
  const LOGO_URL = "/logo-sje.png";

  return (
    <div className="relative flex h-14 items-center border-b border-slate-800 px-2 pr-10">
      <div className={`flex-1 flex items-center gap-2 ${collapsed ? "justify-center" : "justify-start"}`}>
        {/* Logo ukuran tetap */}
        <img src={LOGO_URL} alt="Logo" className="h-8 w-auto" />

        {/* Nama & jabatan di SEBELAH logo (hanya saat expanded) */}
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user?.name || "Nama Karyawan"}</div>
            <div className="truncate text-xs text-white/70">{user?.role || "Jabatan"}</div>
          </div>
        )}
      </div>

      {/* Tombol close (hamburger) khusus mobile drawer, ditempatkan di BrandBar agar tidak ketutup layer lain */}
      {typeof onClose === "function" && (
        <button
          type="button"
          aria-label="Tutup navigasi"
          title="Tutup navigasi"
          onClick={onClose}
          className="absolute right-2 top-2 md:hidden rounded-md border border-white/20 bg-white/5 p-2 hover:bg-white/10 z-10"
        >
          {/* Ikon garis tiga (hamburger) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Section({ group, collapsed, onItemClick }) {
  return (
    <div>
      {!collapsed && (
        <div className="px-3 text-[11px] uppercase tracking-wider mb-2 text-white/60">{group.group}</div>
      )}
      <nav className="flex flex-col gap-1">
        {group.children.map((item) => (
          <SidebarLink key={item.path} item={item} collapsed={collapsed} onItemClick={onItemClick} />
        ))}
      </nav>
    </div>
  );
}

function SidebarLink({ item, collapsed, onItemClick }) {
  const base = "relative group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";
  const idle = "text-white/70 hover:text-white hover:bg-white/10";
  const active = "bg-white/10 text-white shadow-sm";

  // Tutup drawer SETELAH trigger NavLink agar navigasi tidak ter-cancel
  const handleClick = () => {
    if (typeof onItemClick === "function") setTimeout(onItemClick, 0);
  };

  return (
    <NavLink
      to={item.path}
      end={item.path === "/dashboard"}
      title={item.label}
      onClick={handleClick}
      className={({ isActive }) => [base, isActive ? active : idle].join(" ")}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip saat collapsed */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 shadow-md group-hover:block z-50">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({
  isDesktopCollapsed,
  onDesktopToggle, // disimpan untuk kompatibilitas
  isMobileNavOpen,
  setIsMobileNavOpen,
}) {
  // Ambil user untuk filter fitur & penampilan nama/jabatan
  const user = useMemo(() => {
    try { return getCurrentUser(); } catch { return null; }
  }, []);

  // SUSUN NAV: hanya item yang fitur-nya di-grant ke user
  const visibleNav = useMemo(() => {
    return NAV
      .map((group) => ({
        ...group,
        children: group.children.filter((item) => {
          if (!item.feature) return true;
          return hasFeature(item.feature, user);
        }),
      }))
      .filter((group) => group.children.length > 0);
  }, [user]);

  // ESC menutup drawer mobile
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setIsMobileNavOpen(false); };
    if (isMobileNavOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileNavOpen, setIsMobileNavOpen]);

  // Tutup drawer hanya kalau benar-benar mobile
  const closeIfMobile = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setIsMobileNavOpen(false);
  };

  const NavContent = ({ collapsed, onClose }) => (
    <>
      <BrandBar collapsed={collapsed} user={user} onClose={onClose} />
      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {visibleNav.map((group) => (
          <Section key={group.group} collapsed={collapsed} group={group} onItemClick={closeIfMobile} />
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR — sticky full-height + internal scroll */}
      <aside
        role="navigation"
        className={`hidden md:flex md:flex-col border-r sidebar-dark bg-slate-900 text-white transition-[width] duration-300
          md:sticky md:top-0 md:self-start md:h-screen md:overflow-y-auto
          ${isDesktopCollapsed ? "w-20" : "w-64"}`}
      >
        {/* onClose tidak dikirim di desktop */}
        <NavContent collapsed={isDesktopCollapsed} />
      </aside>

      {/* MOBILE OVERLAY — klik overlay untuk menutup */}
      <div
        aria-hidden={!isMobileNavOpen}
        onClick={() => setIsMobileNavOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity ${
          isMobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* MOBILE DRAWER */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r sidebar-dark bg-slate-900 text-white shadow-lg transform transition-transform duration-300 md:hidden ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* onClose dikirim, tombol hamburger muncul di BrandBar */}
        <NavContent collapsed={false} onClose={() => setIsMobileNavOpen(false)} />
      </aside>
    </>
  );
}
