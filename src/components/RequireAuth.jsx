import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

export default function RequireAuth({ allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 403: tidak punya akses
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
