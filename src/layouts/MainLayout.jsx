// src/layouts/MainLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar.jsx';
import UserMenu from '@/components/UserMenu.jsx';

const STORE_KEY = 'ui:sidebarCollapsedDesktop';

export default function MainLayout() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => localStorage.getItem(STORE_KEY) === '1');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(STORE_KEY, isDesktopCollapsed ? '1' : '0');
  }, [isDesktopCollapsed]);
  
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        isDesktopCollapsed={isDesktopCollapsed} 
        onDesktopToggle={() => setIsDesktopCollapsed(s => !s)} // <-- Prop baru ditambahkan di sini
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
      />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-secondary/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-secondary/75 sm:justify-end">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Buka navigasi"
            className="rounded-md border bg-background p-2 hover:bg-accent md:hidden"
          >
            <BurgerIcon />
          </button>
          
          <UserMenu />
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}