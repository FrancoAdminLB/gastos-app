"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Check } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#7B61FF] opacity-[0.07] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-3xl gradient-card glow-primary flex items-center justify-center">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Nueva contraseña</h1>
          <p className="text-sm text-[rgba(255,255,255,0.45)]">
            Ingresá tu nueva contraseña
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-5 py-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#4ADE80]" />
              <p className="text-sm font-medium text-[#4ADE80]">Contraseña actualizada</p>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.45)]">
              Redirigiendo...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-widest">
                Nueva contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="h-14 rounded-2xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-base placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-widest">
                Confirmar contraseña
              </label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
