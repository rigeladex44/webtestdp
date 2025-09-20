// src/pages/admin/AdminUsersPage.jsx
import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/button.jsx';
import { listUsers, createUser, setActive, adminResetPassword, getCurrentUser } from '@/lib/auth.js';
import { PT_LIST } from '@/lib/constants.js'; // Sekarang ini adalah array of objects

export default function AdminUsersPage() {
  const me = getCurrentUser();
  if (!me || me.role !== 'admin') return <div className="p-6">403 — Hanya admin.</div>;

  const [tick, setTick] = useState(0);
  const users = useMemo(() => listUsers(), [tick]);
  
  // Perubahan 1: Inisialisasi state form
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'kasir',
    active: true,
    pt: PT_LIST[0].fullName, // <-- Diubah untuk menyimpan fullName
  });
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    
    // Pastikan jika role bukan direktur, data 'pt' dikosongkan
    const payload = form.role === 'direktur' ? form : { ...form, pt: '' };
    
    const res = createUser(payload);
    if (!res.ok) { setErr(res.error || 'Gagal menambah user'); return; }
    
    // Reset form ke nilai awal
    setForm({ name: '', username: '', password: '', role: 'kasir', active: true, pt: PT_LIST[0].fullName });
    setTick(t => t + 1);
    alert('User ditambahkan');
  };

  const toggleActive = (u) => {
    const res = setActive(u.id, !u.active);
    if (!res.ok) return alert(res.error || 'Gagal mengubah status');
    setTick(t => t + 1);
  };

  const onResetPassword = (u) => {
    if (!confirm(`Reset password untuk ${u.username}?`)) return;
    const res = adminResetPassword(u.id);
    if (!res.ok) return alert(res.error || 'Gagal reset password');
    navigator.clipboard?.writeText(res.tempPassword).catch(() => {});
    alert(`Password sementara: ${res.tempPassword} (tersalin)`);
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Manajemen User</h2>

      {/* Form tambah */}
      <form onSubmit={submit} className="card p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="text-sm">Nama</label>
          <input className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                 value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        </div>
        <div>
          <label className="text-sm">Username</label>
          <input className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" required
                 value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input type="password" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" required
                 value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
        </div>
        <div>
          <label className="text-sm">Role</label>
          <select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.role} onChange={e=>{
                    const role = e.target.value;
                    setForm(f=>({...f, role}));
                  }}>
            <option value="kasir">kasir</option>
            <option value="keuangan">keuangan</option>
            <option value="admin">admin</option>
            <option value="direktur">direktur</option>
          </select>
        </div>

        {/* PT hanya untuk direktur */}
        <div className={`${form.role === 'direktur' ? '' : 'opacity-50 pointer-events-none'}`}>
          <label className="text-sm">PT (Direktur)</label>
          {/* Perubahan 2: Update JSX dropdown PT */}
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={form.pt}
            onChange={e=>setForm(f=>({...f, pt: e.target.value}))}
            disabled={form.role !== 'direktur'} // <-- Tambahan untuk menonaktifkan
          >
            {PT_LIST.map(pt => (
              <option key={pt.tag} value={pt.fullName}>
                {pt.tag}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4"
                 checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
          <span className="text-sm">Aktif</span>
        </label>

        <div className="md:col-span-6">
          {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Tambah User
          </Button>
        </div>
      </form>

      {/* Tabel */}
      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          {/* ... isi tabel tidak berubah ... */}
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>PT</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.name}</td>
                <td>{u.username}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.pt || '-'}</td>
                <td>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" checked={!!u.active} onChange={()=>toggleActive(u)}/>
                    <span>{u.active?'Aktif':'Non-aktif'}</span>
                  </label>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="text-right">
                  <Button type="button" variant="outline" className="mr-2" onClick={()=>onResetPassword(u)}>
                    Reset Password
                  </Button>
                </td>
              </tr>
            ))}
            {users.length===0 && <tr><td colSpan={7} className="py-4 text-muted-foreground">Belum ada user.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}