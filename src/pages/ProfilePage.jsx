// src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import Input from '@/components/ui/input.jsx';
import Button from '@/components/ui/button.jsx';
import { getUser, setUser } from '@/lib/auth.js';
import { useToast } from '@/components/use-toast.js';

export default function ProfilePage() {
  const { toast } = useToast?.() || { toast: (x) => alert(x.title || x) };
  const [form, setForm] = useState(() => {
    const u = getUser();
    return {
      username: u.username || '',
      name: u.name || '',
      role: u.role || '',
    };
  });

  const save = () => {
    if (!form.username || !form.name) {
      toast({ title: 'Username dan Nama wajib diisi', type: 'error' });
      return;
    }
    setUser({ username: form.username, name: form.name, role: form.role });
    toast({ title: 'Profil disimpan', type: 'success' });
  };

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-2xl font-semibold">Profil</h2>

      <div>
        <label className="text-sm block">Username</label>
        <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}/>
      </div>

      <div>
        <label className="text-sm block">Nama Karyawan</label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
      </div>

      <div>
        <label className="text-sm block">Jabatan</label>
        <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}/>
      </div>

      <div className="flex gap-2">
        <Button onClick={save}>Simpan</Button>
        <Button className="bg-transparent border" onClick={() => setForm({ username: '', name: '', role: '' })}>Reset</Button>
      </div>
    </div>
  );
}
