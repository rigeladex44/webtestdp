// src/layouts/MainLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import UserMenu from "../components/UserMenu.jsx";
import MobileNavBar from "../components/MobileNavBar.jsx";

const STORE_KEY = "ui:sidebarCollapsedDesktop";

export default function MainLayout() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(
    () => localStorage.getItem(STORE_KEY) === "1"
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

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
              {/* Burger MOBILE: buka drawer */}
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

              {/* Burger DESKTOP: collapse/expand */}
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

              <div className="font-semibold tracking-tight text-base sm:text-lg">
                SUMBER JAYA GRUP
              </div>

              <div className="ml-auto">
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

      {/* Bottom mobile nav bar */}
      <MobileNavBar hidden={isMobileNavOpen} />
    </>
  );
}
