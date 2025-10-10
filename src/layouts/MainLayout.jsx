// src/layouts/MainLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import UserMenu from "../components/UserMenu.jsx";
import MobileNavBar from "../components/MobileNavBar.jsx";

import { useTransactions } from "@/context/TransactionsContext.jsx";
import { getCurrentUser } from "@/lib/auth.js";
import { hasFeature, FEATURES } from "@/lib/features.js";
import { getAllowedPTsForUser } from "@/lib/pt-access.js";

const STORE_KEY = "ui:sidebarCollapsedDesktop";
const NEED_APPROVAL_LIMIT = 300_000;

function isOutType(t) {
  const s = String(t || "").trim().toLowerCase();
  return s === "keluar" || s === "expense" || s === "kredit";
}

export default function MainLayout() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(
    () => localStorage.getItem(STORE_KEY) === "1"
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { transactions } = useTransactions();
  const me = useMemo(() => getCurrentUser(), []);
  const canReviewApproval = hasFeature(FEATURES.APPROVAL_REVIEW, me);
  const allowedPTs = getAllowedPTsForUser(me);

  const pendingCount = useMemo(() => {
    if (!canReviewApproval) return 0;
    return transactions.filter((t) => {
      if (!(t && t.affectsCash === true)) return false;
      if (!allowedPTs.includes(t.pt || "")) return false;
      if (!isOutType(t.type)) return false;
      const amt = Number(t.amount || 0);
      if (amt <= NEED_APPROVAL_LIMIT) return false;
      return (t.approvalStatus || "pending") === "pending";
    }).length;
  }, [transactions, canReviewApproval, allowedPTs]);

  const [badgePing, setBadgePing] = useState(false);
  useEffect(() => {
    const onNewApproval = (e) => {
      if (!canReviewApproval) return;
      const pt = e?.detail?.pt || "";
      if (pt && pt.length && !allowedPTs.includes(pt)) return;
      setBadgePing(true);
      const to = setTimeout(() => setBadgePing(false), 1200);
      return () => clearTimeout(to);
    };
    window.addEventListener("approval-created", onNewApproval);
    return () => window.removeEventListener("approval-created", onNewApproval);
  }, [canReviewApproval, allowedPTs]);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, isDesktopCollapsed ? "1" : "0");
  }, [isDesktopCollapsed]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const body = document.body;
    if (isMobileNavOpen) body.classList.add("overflow-hidden");
    else body.classList.remove("overflow-hidden");
    return () => body.classList.remove("overflow-hidden");
  }, [isMobileNavOpen]);

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          isDesktopCollapsed={isDesktopCollapsed}
          onDesktopToggle={() => setIsDesktopCollapsed((s) => !s)}
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
        />

        {/* CONTENT */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 h-14 border-b bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/75">
            <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-3 sm:px-6">
              {/* Burger MOBILE */}
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Buka navigasi"
                title="Buka navigasi"
                className="md:hidden rounded-md border bg-background p-2 hover:bg-accent"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Burger DESKTOP */}
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed((s) => !s)}
                aria-label={isDesktopCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
                title={isDesktopCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
                className="hidden md:inline-flex rounded-md border bg-background p-2 hover:bg-accent"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* ✨ BRANDING - SUMBER JAYA GRUP (Text Only, Bold, Always Visible) */}
              <h1 className="text-lg font-extrabold text-foreground tracking-wide uppercase">
                SUMBER JAYA GRUP
              </h1>

              {/* spacer */}
              <div className="flex-1" />

              {/* Bell untuk reviewer approval */}
              {canReviewApproval && (
                <button
                  type="button"
                  onClick={() => navigate("/arus-kas-kecil")}
                  aria-label="Lihat pengeluaran yang menunggu persetujuan"
                  title="Lihat pengeluaran yang menunggu persetujuan"
                  className="relative inline-flex items-center justify-center rounded-md border bg-background p-2 hover:bg-accent"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>

                  {pendingCount > 0 && (
                    <span
                      className={[
                        "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
                        "rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center",
                        badgePing ? "animate-pulse" : "",
                      ].join(" ")}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {/* Avatar / menu user */}
              <div className="ml-1">
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <MobileNavBar hidden={isMobileNavOpen} />
    </>
  );
}