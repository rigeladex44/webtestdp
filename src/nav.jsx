// src/nav.jsx
import React from 'react';

/* ===== util ikon ===== */
function IconBase({ className, children }) {
  return (
    <svg
      className={className}
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/* ===== set ikon ===== */
export const HomeIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M3 10.5 12 4l9 6.5" />
    <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5" />
  </IconBase>
);

export const WalletIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M16 12h3" />
    <path d="M3 10h14a2 2 0 0 0 0-4H7a4 4 0 0 0-4 4Z" />
  </IconBase>
);

export const BarChartIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M3 21h18" />
    <rect x="5" y="10" width="3" height="8" rx="1" />
    <rect x="11" y="6" width="3" height="12" rx="1" />
    <rect x="17" y="13" width="3" height="5" rx="1" />
  </IconBase>
);

export const ActivityIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M22 12H18l-3 8-6-16-3 8H2" />
  </IconBase>
);

export const UserIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21a6 6 0 0 1 12 0" />
  </IconBase>
);
export const UserPlusIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </IconBase>
);

// ——— IKON BARU: Coins ———
export const CoinsIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="12" r="3" />
    <path d="M5 8h6M13 12h6" />
  </IconBase>
);

// ——— IKON Entri Penjualan (sebelumnya sudah) ———
export const ShoppingCartIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </IconBase>
);

/* ===== NAV dengan role ===== */
export const NAV = [
  {
    group: 'Dashboard',
    children: [
      { label: 'Beranda Utama',   path: '/dashboard',        icon: HomeIcon,         roles: ['kasir','keuangan'] },
      { label: 'Arus Kas Kecil',  path: '/arus-kas-kecil',   icon: WalletIcon,       roles: ['kasir','keuangan'] },
      { label: 'Entri Penjualan', path: '/entri-penjualan',  icon: ShoppingCartIcon, roles: ['kasir','keuangan'] },
      { label: 'Pendapatan Lain-lain', path: '/pendapatan-lain', icon: CoinsIcon, roles: ['kasir','keuangan'] },
      { label: 'Laba Rugi',       path: '/laba-rugi',        icon: BarChartIcon,     roles: ['keuangan','direktur','admin'] },
    ],
  },
  {
    group: 'Admin',
    children: [
      { label: 'Panel Admin',  path: '/admin',         icon: UserIcon,       roles: ['admin'] },
      { label: 'Kelola Users', path: '/admin/users',   icon: UserPlusIcon,   roles: ['admin'] },
      { label: 'Audit Log',    path: '/admin/audit',   icon: ActivityIcon,   roles: ['admin'] },
    ],
  },
];
