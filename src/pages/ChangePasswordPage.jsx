// src/pages/ChangePasswordPage.jsx
import React, { useState } from 'react';
import Input from '@/components/ui/input.jsx';
import Button from '@/components/ui/button.jsx';
import { changePassword, getCurrentUser } from '@/lib/auth.js';
import { useToast } from '@/components/use-toast.js';

export default function ChangePasswordPage() {
  const me = getCurrentUser();
  const must = !!me?.mustChangePass;

  const { toast } = useToast?.() || { toast: (x) => alert(x.title || x) };
  const [oldPass, setOld] = useState('');
  const [newPass, setNew] = useState('');
  const [retype , setRe ] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass || !retype) return toast({ title: 'Lengkapi semua field', type: 'error' });
    if (newPass.length < 6) return toast({ title: 'Password baru minimal 6 karakter', type: 'error' });
    if (newPass !== retype) return toast({ title: 'Konfirmasi password tidak sama', type: 'error' });

    setLoading(true);
    const res = changePassword({ oldPass, newPass });
    setLoading(false);

    if (!res.ok) return toast({ title: res.error || 'Gagal mengganti password', type: 'error' });

    toast({ title: 'Password berhasil diganti', type: 'success' });
    setOld(''); setNew(''); setRe('');
  };

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Ganti Password</h2>
      {must && (
        <div className="mb-3 text-sm text-red-600">
          Anda wajib mengganti password karena direset oleh admin.
        </div>
      )}
      <form onSubmit={onSubmit} className="card p-4 space-y-3">
        <div>
          <label className="text-sm block">Password Lama</label>
          <Input type="password" value={oldPass} onChange={(e)=>setOld(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block">Password Baru</label>
          <Input type="password" value={newPass} onChange={(e)=>setNew(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block">Ulangi Password Baru</label>
          <Input type="password" value={retype} onChange={(e)=>setRe(e.target.value)} />
        </div>
        <Button className="w-full" disabled={loading}>
          {loading ? 'Memproses…' : 'Simpan'}
        </Button>
      </form>
    </div>
  );
}
