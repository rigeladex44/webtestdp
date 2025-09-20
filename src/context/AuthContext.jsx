import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const LS_USERS = "app_users";
const LS_SESSION = "app_session";
const ROLES = ["admin", "kasir", "keuangan"];

function readUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) ?? []; }
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem(LS_USERS, JSON.stringify(users)); }
function readSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION)) ?? null; }
  catch { return null; }
}
function saveSession(user) {
  if (user) localStorage.setItem(LS_SESSION, JSON.stringify({ id: user.id }));
  else localStorage.removeItem(LS_SESSION);
}

function seedIfEmpty() {
  const users = readUsers();
  if (users.length === 0) {
    const admin = {
      id: crypto.randomUUID(),
      name: "Administrator",
      username: "admin",
      password: "admin123",    // DEMO ONLY — ganti segera di produksi
      role: "admin",
      active: true,
      createdAt: Date.now(),
    };
    saveUsers([admin]);
    console.info("%cSeeded default admin: admin / admin123", "color:green");
  }
}
seedIfEmpty();

export default function AuthProvider({ children }) {
  const [users, setUsers] = useState(readUsers);
  const [user, setUser] = useState(null);

  // restore session
  useEffect(() => {
    const sess = readSession();
    if (!sess) return;
    const u = readUsers().find(x => x.id === sess.id && x.active);
    setUser(u ?? null);
  }, []);

  // keep LS in sync
  useEffect(() => { saveUsers(users); }, [users]);

  const login = (username, password) => {
    const u = readUsers().find(
      x => x.username?.toLowerCase() === String(username).toLowerCase()
    );
    if (!u) throw new Error("User tidak ditemukan");
    if (!u.active) throw new Error("User non-aktif");
    if (u.password !== password) throw new Error("Password salah");
    setUser(u);
    saveSession(u);
    return u;
  };

  const logout = () => { setUser(null); saveSession(null); };

  // Admin only
  const createUser = (payload) => {
    if (user?.role !== "admin") throw new Error("Hanya admin yang boleh membuat user");
    if (!payload.username || !payload.password || !payload.role)
      throw new Error("Lengkapi username, password, dan role");
    if (!ROLES.includes(payload.role)) throw new Error("Role tidak valid");

    const exists = users.some(
      x => x.username?.toLowerCase() === payload.username.toLowerCase()
    );
    if (exists) throw new Error("Username sudah dipakai");

    const nu = {
      id: crypto.randomUUID(),
      name: payload.name || payload.username,
      username: payload.username,
      password: payload.password, // DEMO ONLY
      role: payload.role,
      active: payload.active ?? true,
      createdAt: Date.now(),
    };
    setUsers(prev => [nu, ...prev]);
    return nu;
  };

  const updateUser = (id, patch) => {
    if (user?.role !== "admin") throw new Error("Hanya admin");
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...patch } : u)));
    // jika current user diubah menjadi non-aktif → logout
    if (user?.id === id && patch.active === false) logout();
  };

  const removeUser = (id) => {
    if (user?.role !== "admin") throw new Error("Hanya admin");
    setUsers(prev => prev.filter(u => u.id !== id));
    if (user?.id === id) logout();
  };

  const value = useMemo(() => ({
    user, users, roles: ROLES,
    login, logout, createUser, updateUser, removeUser,
  }), [user, users]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
