"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Check } from "lucide-react";

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPass.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPass !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("No se pudo obtener el usuario");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (signInError) {
      setError("La contraseña actual es incorrecta");
      setLoading(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPass,
    });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-xl glass p-4 text-left hover:bg-[rgba(255,255,255,0.06)] transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-[rgba(123,97,255,0.15)] flex items-center justify-center shrink-0">
          <KeyRound className="h-5 w-5 text-[#7B61FF]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Cambiar contraseña</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.4)]">Actualizar tu contraseña de acceso</p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl glass p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(123,97,255,0.15)] flex items-center justify-center shrink-0">
          <KeyRound className="h-5 w-5 text-[#7B61FF]" />
        </div>
        <p className="text-sm font-medium text-white">Cambiar contraseña</p>
      </div>

      {success ? (
        <div className="flex items-center gap-2 rounded-xl bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-4 py-3">
          <Check className="h-4 w-4 text-[#4ADE80]" />
          <span className="text-sm text-[#4ADE80]">Contraseña actualizada</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="Contraseña actual"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            className="h-11 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
          />
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
            className="h-11 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
          />
          <Input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="h-11 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
          />

          {error && (
            <p className="text-xs text-[#FF6B6B] px-1">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-xl border-[rgba(255,255,255,0.1)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.06)]"
              onClick={() => { setOpen(false); setError(null); setCurrent(""); setNewPass(""); setConfirm(""); }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl gradient-card border-0 hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
