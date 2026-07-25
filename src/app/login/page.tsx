"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Ingresá tu email");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#7B61FF] opacity-[0.07] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-10 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-3xl gradient-card glow-primary flex items-center justify-center">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gastos</h1>
          <p className="text-sm text-[rgba(255,255,255,0.45)]">
            Control de gastos personales
          </p>
        </div>

        {/* Form */}
        {resetSent ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-5 py-4 text-center space-y-1">
              <p className="text-sm font-medium text-[#4ADE80]">Email enviado</p>
              <p className="text-xs text-[rgba(255,255,255,0.45)]">
                Revisá tu casilla de correo para restablecer tu contraseña
              </p>
            </div>
            <button
              className="w-full text-sm text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
              onClick={() => { setResetSent(false); setResetMode(false); }}
            >
              Volver al login
            </button>
          </div>
        ) : resetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-widest">
                Email
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-base placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-3 text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-base font-semibold gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar email de recuperación"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
              onClick={() => { setResetMode(false); setError(null); }}
            >
              Volver al login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-widest">
                Email
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-base placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-widest">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 rounded-2xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-base placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-3 text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-base font-semibold gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
              onClick={() => { setResetMode(true); setError(null); }}
            >
              Olvidé mi contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
