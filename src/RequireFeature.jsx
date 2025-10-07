// src/routes/RequireFeature.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { hasFeature } from "@/lib/features.js";

export default function RequireFeature({ feature, children, fallback = "/dashboard" }) {
  if (!feature) return children;
  return hasFeature(feature) ? children : <Navigate to={fallback} replace />;
}
