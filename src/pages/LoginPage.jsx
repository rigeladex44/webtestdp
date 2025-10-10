// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/ui/input.jsx';
import Button from '@/components/ui/button.jsx';
import { login } from '@/lib/auth.js';
import { useToast } from '@/components/use-toast.js';

export default function LoginPage() {
  const nav = useNavigate();
  const { toast } = useToast?.() || { toast: (x) => alert(x.title || x) };

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!user || !pass) {
      toast({ title: 'Username & password wajib diisi', type: 'error' });
      return;
    }
    setLoading(true);
    const { ok, user: u } = login({ username: user, password: pass });
    setLoading(false);

    if (!ok) {
      toast({ title: 'Username atau password salah', type: 'error' });
      return;
    }

    if (u?.name) {
      localStorage.setItem('auth:name', u.name);
    }

    nav('/dashboard', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-[url('/login-bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative z-10 min-h-screen grid place-items-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-[360px] space-y-4 card p-6 bg-background/20 backdrop-blur-md shadow-xl"
        >
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-white">Login</h1>
            <p className="text-sm text-white/70 mt-1">Masuk ke sistem</p>
          </div>

          <div>
            <label className="text-sm block text-white/90 mb-1">Username</label>
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
              disabled={loading}
              placeholder="Masukkan username"
              className="!bg-white/10 !border-white/30 text-white placeholder-white/50 backdrop-blur-sm focus:ring-2 focus:ring-white/40 focus:border-white/50"
            />
          </div>

          <div>
            <label className="text-sm block text-white/90 mb-1">Password</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                disabled={loading}
                placeholder="Masukkan password"
                className="pr-10 !bg-white/10 !border-white/30 text-white placeholder-white/50 backdrop-blur-sm focus:ring-2 focus:ring-white/40 focus:border-white/50"
              />
              <button
                type="button"
                aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium" 
            disabled={loading}
          >
            {loading ? '⏳ Memproses…' : '🔓 Masuk'}
          </Button>

          <div className="text-xs text-white/60 text-center pt-2 border-t border-white/10">
            <p>Master User: <code className="bg-white/10 px-1 rounded">keu / keu123</code></p>
          </div>
        </form>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2M9.88 4.24A10.8 10.8 0 0112 4c6.5 0 10 8 10 8a19.9 19.9 0 01-4.12 5.35M6.1 6.1C3.88 7.72 2 12 2 12s3.5 7 10 7c1.05 0 2.05-.16 3-.46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}