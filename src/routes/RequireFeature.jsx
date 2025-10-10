import React from "react";
import { hasFeature } from "@/lib/features.js";
import { getCurrentUser } from "@/lib/auth.js";

/**
 * Gate fitur berbasis feature-flag per user.
 * Pakai:
 * <RequireFeature feature={FEATURES.CASHFLOW_VIEW}><Page /></RequireFeature>
 * atau
 * <RequireFeature anyOf={[FEATURES.PNL_VIEW, FEATURES.CASHFLOW_VIEW]}><Page /></RequireFeature>
 */
export default function RequireFeature({ feature, anyOf, children }) {
  const user = getCurrentUser();

  const allowed = React.useMemo(() => {
    if (Array.isArray(anyOf) && anyOf.length > 0) {
      return anyOf.some((f) => hasFeature(f, user));
    }
    if (feature) return hasFeature(feature, user);
    return true; // kalau tak diberi feature/anyOf, lepas aja
  }, [feature, anyOf, user]);

  if (!allowed) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="text-center max-w-md">
          <div className="text-3xl font-semibold">403</div>
          <p className="mt-2 text-muted-foreground">
            Anda tidak memiliki akses ke halaman ini.
          </p>
          <div className="mt-4 inline-flex gap-2">
            <a
              href="/dashboard"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              Kembali ke Dashboard
            </a>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              Halaman sebelumnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
