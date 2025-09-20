// src/admin-nav.jsx
import React from 'react';
import { HomeIcon, UserIcon, ActivityIcon } from '@/nav.jsx';

export const ADMIN_NAV = [
  {
    group: 'Admin',
    children: [
      { label: 'Beranda Admin', path: '/admin', icon: HomeIcon },
      { label: 'Users',         path: '/admin/users', icon: UserIcon },
      { label: 'Audit Log',     path: '/admin/audit', icon: ActivityIcon },
    ],
  },
];
