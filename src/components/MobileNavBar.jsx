// src/components/MobileNavBar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Wallet, ShoppingCart, BarChart2 } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Beranda", Icon: Home },
  { to: "/arus-kas-kecil", label: "Kas Kecil", Icon: Wallet },
  { to: "/entri-penjualan", label: "Penjualan", Icon: ShoppingCart },
  { to: "/laba-rugi", label: "Laba Rugi", Icon: BarChart2 },
];

export default function MobileNavBar({ hidden = false }) {
  return (
    <nav
      role="navigation"
      aria-label="Mobile tabs"
      className={[
        "md:hidden fixed bottom-0 inset-x-0 z-50",        // z-index dinaikkan
        "border-t bg-card/95 backdrop-blur",
        "transition-transform duration-300",
        hidden ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <div className="grid grid-cols-4 gap-1 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center py-2 rounded-md text-xs",
                "hover:bg-muted/60",
                isActive ? "text-primary" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
