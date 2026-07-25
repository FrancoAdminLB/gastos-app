"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Wallet } from "lucide-react";

export function Header({ userName }: { userName?: string }) {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-5 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-card flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-base">Gastos</span>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <span className="text-sm text-[rgba(255,255,255,0.5)]">{userName}</span>
          )}
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
