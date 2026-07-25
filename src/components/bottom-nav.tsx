"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Plane, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/viajes", label: "Viajes", icon: Plane },
  { href: "/inversiones", label: "Inversión", icon: TrendingUp },
  { href: "/categorias", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-3 mb-3 rounded-2xl bg-[#0F1335]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive ? "text-white" : "text-[rgba(255,255,255,0.35)]"
                )}
              >
                <div className="relative">
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      isActive && "text-[#7B61FF] drop-shadow-[0_0_8px_rgba(123,97,255,0.5)]"
                    )}
                  />
                  {isActive && (
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7B61FF] shadow-[0_0_6px_rgba(123,97,255,0.8)]" />
                  )}
                </div>
                <span className={cn("text-[10px] mt-1", isActive ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
