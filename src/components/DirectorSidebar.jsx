import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, Home, BarChart3 } from 'lucide-react';

export default function DirectorSidebar({ collapsed = false, onToggle }) {
  const baseAside =
    'hidden md:flex md:flex-col border-r transition-[width] duration-200 bg-slate-900 text-white border-slate-800';
  const width = collapsed ? 'w-16 px-2 py-4' : 'w-[240px] p-5';

  return (
    <aside className={`${baseAside} ${width}`}>
      <Brand collapsed={collapsed} onToggle={onToggle} />
      <nav className="flex flex-col gap-1">
        <Item to="/director" icon={Home}    label="Ikhtisar"    collapsed={collapsed} end />
        <Item to="/director/laba-rugi" icon={BarChart3} label="Laba/Rugi"  collapsed={collapsed} />
      </nav>
    </aside>
  );
}

function Brand({ collapsed, onToggle }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      {collapsed ? (
        <div className="w-10 h-10 grid place-items-center rounded-xl bg-white/5 mx-auto ring-1 ring-white/10">SJ</div>
      ) : (
        <div className="text-sm font-semibold tracking-wide">SUMBER JAYA GRUP</div>
      )}
      {typeof onToggle === 'function' && (
        <button
          className={`ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-white/5 border-white/10 ${
            collapsed ? 'absolute top-4 left-4' : ''
          }`}
          onClick={onToggle}
          aria-label="Toggle sidebar"
          title={collapsed ? 'Perbesar' : 'Perkecil'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-180' : 'rotate-0'}`} />
        </button>
      )}
    </div>
  );
}

function Item({ to, icon: Icon, label, collapsed, end }) {
  const base   = 'relative group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors';
  const idle   = 'text-white/70 hover:text-white hover:bg-white/10';
  const active = 'bg-white/15 text-white shadow-sm ring-1 ring-white/20';
  return (
    <NavLink to={to} end={end} className={({isActive})=>[base, isActive?active:idle, collapsed?'justify-center':''].join(' ')}>
      {({isActive})=>(
        <>
          <span aria-hidden className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-white/70 transition-opacity ${isActive?'opacity-100':'opacity-0'}`} />
          <Icon className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
