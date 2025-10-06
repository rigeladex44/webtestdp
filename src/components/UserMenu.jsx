// src/components/UserMenu.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUser, logout } from "@/lib/auth.js";

/** Sync user object from localStorage and listen to changes */
function useAuthUser() {
  const [user, setUser] = useState(getUser());
  useEffect(() => {
    const onChange = () => setUser(getUser());
    window.addEventListener("auth-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("auth-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return user || {};
}

export default function UserMenu() {
  const user = useAuthUser();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const initials =
    (user.name || "U")
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  const avatarUrl = user?.avatar; // pakai user.avatar jika ada (optional)

  return (
    <div className="relative" ref={ref}>
      {/* === Trigger: HANYA AVATAR BULAT === */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label="Buka menu akun"
        title={user?.name || "Akun"}
        className="h-9 w-9 grid place-items-center rounded-full border bg-background hover:bg-accent"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || "Avatar"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="h-8 w-8 rounded-full grid place-items-center bg-primary/20 text-primary text-xs font-semibold">
            {initials}
          </span>
        )}
      </button>

      {/* === Dropdown === */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-xl">
          <div className="px-3 py-3 border-b flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || "Avatar"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="h-9 w-9 rounded-full grid place-items-center bg-primary/20 text-primary text-sm font-semibold">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user?.name || "User"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.role || "-"}</div>
            </div>
          </div>

          <nav className="py-1">
            <Link to="/profile" className="block px-3 py-2 text-sm hover:bg-accent">
              Profil
            </Link>
            <Link to="/settings" className="block px-3 py-2 text-sm hover:bg-accent">
              Pengaturan
            </Link>
            <Link to="/change-password" className="block px-3 py-2 text-sm hover:bg-accent">
              Ganti Password
            </Link>
            <button
              onClick={() => {
                logout();
                nav("/login");
              }}
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
