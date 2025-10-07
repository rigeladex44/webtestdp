// src/routes/RequireFeature.jsx
import React from 'react';
import { hasFeature } from '@/lib/features.js';

export default function RequireFeature({ feature, children, fallback = null }) {
  if (!feature) return children;
  return hasFeature(feature) ? children : (fallback ?? null);
}
