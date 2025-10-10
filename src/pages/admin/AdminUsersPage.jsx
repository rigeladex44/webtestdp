// src/pages/admin/AdminUsersPage.jsx
import React, { useMemo, useState } from "react";
import { listUsers, upsertUser, deleteUser } from "@/lib/adminStore.js";
import { FEATURES } from "@/lib/features.js";
import { PT_LIST } from "@/lib/constants.js";

export default function AdminUsersPage() {
  const [users, setUsers] = useState(() => listUsers());
  const empty = {
    id: null,
    name: "",
    title: "",
    username: "",
    password: "",
    features: [],
    ptAccess: [],
    active: true,
  };
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const featurePairs = useMemo(
    () => [
      ["Dashboard", FEATURES.DASHBOARD_VIEW],
      ["Kas Kecil", FEATURES.CASHFLOW_VIEW],
      ["Laba Rugi", FEATURES.PNL_VIEW],
      ["Entri Penjualan", FEATURES.SALES_ENTRY],
      ["Pendapatan Lain", FEATURES.OTHER_INCOME],
      ["Review Approval", FEATURES.APPROVAL_REVIEW],
      ["Admin Panel", FEATURES.ADMIN_PANEL],
      ["Admin Users", FEATURES.ADMIN_USERS],
      ["Admin Audit", FEATURES.ADMIN_AUDIT],
    ],
    []
  );

  const toggleFeature = (code) => {
    const set = new Set(form.features || []);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    setForm({ ...form, features: Array.from(set) });
  };

  const togglePT = (fullName) => {
    const set = new Set(form.ptAccess || []);
    if (set.has(fullName)) set.delete(fullName);
    else set.add(fullName);
    setForm({ ...form, ptAccess: Array.from(set) });
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      if (!form.name?.trim() || !form.username?.trim()) {
        setErr("Nama dan username wajib diisi");
        return;
      }

      if (!form.id && !form.password?.trim()) {
        setErr("Password wajib diisi saat menambah user baru");
        return;
      }

      if (form.password && form.password.length < 4) {
        setErr("Password minimal 4 karakter");
        return;
      }

      if (form.username.toLowerCase() !== "keu" && form.ptAccess.length === 0) {
        setErr("Minimal pilih 1 PT untuk user ini");
        return;
      }

      upsertUser(form);
      setUsers(listUsers());
      setSuccess(form.id ? "✅ User berhasil diupdate!" : "✅ User berhasil ditambahkan!");
      setForm(empty);

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setErr(error?.message || "Gagal menyimpan user");
    }
  };

  const edit = (u) => {
    setErr("");
    setSuccess("");
    setForm({
      id: u.id,
      name: u.name || "",
      title: u.jobTitle || u.title || "",
      username: u.username || "",
      password: "",
      features: Array.isArray(u.features) ? u.features : [],
      ptAccess: Array.isArray(u.ptAccess) ? u.ptAccess : [],
      active: u.active !== false,
    });
  };

  const remove = (id) => {
    if (!confirm("Hapus user ini?")) return;
    deleteUser(id);
    setUsers(listUsers());
    setSuccess("✅ User berhasil dihapus");
    if (form.id === id) setForm(empty);
    setTimeout(() => setSuccess(""), 3000);
  };

  const reset = () => {
    setErr("");
    setSuccess("");
    setForm(empty);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Kelola Users</h2>
      </div>

      <form onSubmit={submit} className="card p-4 space-y-3">
        {err && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            ❌ {err}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Nama Lengkap">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
              required
            />
          </Field>
          <Field label="Jabatan">
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Mis: Direktur, Keuangan, Kasir"
            />
          </Field>
          <Field label="Username">
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username login"
              required
            />
          </Field>
          <Field label={form.id ? "Password (kosongkan jika tidak ganti)" : "Password"}>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={form.id ? "(opsional)" : "password"}
              required={!form.id}
            />
          </Field>
          <Field label="Status">
            <label className="inline-flex items-center gap-2 h-10 px-3 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              User Aktif
            </label>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Fitur yang Diberikan</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featurePairs.map(([label, code]) => (
                <label key={code} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(form.features || []).includes(code)}
                    onChange={() => toggleFeature(code)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Akses PT</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PT_LIST.map((pt) => (
                <label key={pt.fullName} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(form.ptAccess || []).includes(pt.fullName)}
                    onChange={() => togglePT(pt.fullName)}
                  />
                  {pt.tag} — {pt.fullName}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn" type="submit">
            {form.id ? "💾 Simpan Perubahan" : "➕ Tambah User"}
          </button>
          <button className="btn-secondary" type="button" onClick={reset}>
            🔄 Reset
          </button>
        </div>
      </form>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Nama</th>
              <th>Jabatan</th>
              <th>Username</th>
              <th>Status</th>
              <th>Fitur</th>
              <th>PT</th>
              <th className="text-right w-[180px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t align-top">
                <td className="py-2">{u.name}</td>
                <td>{u.jobTitle || u.title || "-"}</td>
                <td>
                  {u.username}
                  {u.username === "keu" && (
                    <span className="ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs bg-purple-100 text-purple-800">
                      🔑 Master
                    </span>
                  )}
                </td>
                <td>
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                    u.active !== false 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {u.active !== false ? "✓ Aktif" : "✗ Nonaktif"}
                  </span>
                </td>
                <td>{(u.features || []).length} fitur</td>
                <td>
                  {(u.ptAccess || [])
                    .map((n) => PT_LIST.find((p) => p.fullName === n)?.tag || n)
                    .join(", ") || "-"}
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn xs" onClick={() => edit(u)} type="button">
                      ✏️ Edit
                    </button>
                    {u.username !== "keu" && (
                      <button
                        className="btn-danger xs"
                        onClick={() => remove(u.id)}
                        type="button"
                      >
                        🗑️ Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted-foreground">
                  Belum ada user. Tambahkan user pertama di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      {children}
    </label>
  );
}