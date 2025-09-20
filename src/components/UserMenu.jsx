// src/components/UserMenu.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUser, logout } from '@/lib/auth.js';

function useAuthUser() {
  const [user, setUser] = useState(getUser());
  useEffect(() => {
    const onChange = () => setUser(getUser());
    window.addEventListener('auth-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('auth-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return user;
}

export default function UserMenu() {
  const user = useAuthUser();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const initials = (user.name || 'User')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-3 rounded-md border px-3 py-2 bg-background hover:bg-accent"
      >
        <div>
          <div className="text-sm font-medium leading-4">{user.name || 'User'}</div>
          <div className="text-xs text-muted-foreground leading-4">{user.role || '-'}</div>
        </div>
        <div className="w-8 h-8 grid place-items-center rounded-full bg-primary/20 text-primary text-sm font-semibold">
          {initials || 'U'}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-xl">
          <div className="px-3 py-2 border-b">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.role}</div>
          </div>
          <nav className="py-1">
            <Link to="/profile" className="block px-3 py-2 text-sm hover:bg-accent">Profil</Link>
            <Link to="/settings" className="block px-3 py-2 text-sm hover:bg-accent">Pengaturan</Link>
            <Link to="/change-password" className="block px-3 py-2 text-sm hover:bg-accent">Ganti Password</Link>
            <button
              onClick={() => { logout(); nav('/login'); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent text-red-600"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
