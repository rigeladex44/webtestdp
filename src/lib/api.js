// src/lib/api.js
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: false,
});

/** ===== SINGLE USER MODE (mock on/off) =====
 *  .env.local contoh:
 *  VITE_SINGLE_USER_MODE=true
 *  VITE_SINGLE_USER_EMAIL=keu
 *  VITE_SINGLE_USER_PASSWORD=keu123
 */
const SINGLE = (import.meta.env.VITE_SINGLE_USER_MODE ?? "true") === "true";
const EMAIL = import.meta.env.VITE_SINGLE_USER_EMAIL || "keu";
const PASS  = import.meta.env.VITE_SINGLE_USER_PASSWORD || "keu123";

if (SINGLE) {
  const mock = new AxiosMockAdapter(api, { delayResponse: 300 });

  // AUTH
  mock.onPost("/auth/login").reply((config) => {
    try {
      const body = JSON.parse(config.data || "{}");
      const ok = body.email === EMAIL && body.password === PASS;
      if (!ok) return [401, { detail: "Email atau password salah" }];
      return [
        200,
        {
          access_token: "mock-token-123",
          token_type: "bearer",
          role: "ADMIN",
          user: { name: "Keuangan", role: "keuangan", email: EMAIL },
        },
      ];
    } catch {
      return [400, { detail: "Bad request" }];
    }
  });

  // PROFIT & LOSS summary (untuk Dashboard)
  mock.onGet(/\/reports\/pl.*/).reply(() => {
    return [
      200,
      {
        summary: {
          kas_harian: 250_000,
          penjualan_harian: 120,
          hutang_ppn: 5_300_000,
        },
      },
    ];
  });

  // Kas kecil (list)
  mock.onGet(/\/cash-entries.*/).reply(() => {
    return [
      200,
      {
        items: [
          { id: 1, date: "2025-10-03", memo: "Beli ATK", debit: 150000, credit: 0 },
          { id: 2, date: "2025-10-03", memo: "Uang masuk", debit: 0, credit: 300000 },
          { id: 3, date: "2025-10-02", memo: "Transport", debit: 50000, credit: 0 },
        ],
      },
    ];
  });

  // Tambah entry
  mock.onPost("/cash-entries").reply((config) => {
    const body = JSON.parse(config.data || "{}");
    return [201, { id: Math.random().toString(36).slice(2), ...body }];
  });
}
