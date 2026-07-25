"use client";

import { useState } from "react";
import { createIncome } from "@/app/actions/incomes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = ["ARS", "USD", "EUR", "BRL"];
const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "transferencia_bancaria", label: "Transferencia" },
  { value: "cripto", label: "Cripto" },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito" },
];

interface IncomeCategory {
  id: string;
  nombre: string;
  color: string;
}

export function IncomeForm({
  categories,
  onSuccess,
}: {
  categories: IncomeCategory[];
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createIncome(formData);
      (e.target as HTMLFormElement).reset();
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Monto</Label>
        <div className="flex gap-2">
          <Input
            name="monto"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            autoFocus
            className="h-14 text-2xl font-bold rounded-xl flex-1 tabular-nums bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#4ADE80] focus:ring-[#4ADE80]/20"
          />
          <Select name="moneda" defaultValue="ARS">
            <SelectTrigger className="h-14 w-24 rounded-xl text-base font-medium bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Fuente</Label>
        <Select name="categoryId" required>
          <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
            <SelectValue placeholder="Elegir fuente" />
          </SelectTrigger>
          <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.nombre}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Fecha</Label>
          <Input
            name="fecha"
            type="date"
            defaultValue={today}
            required
            className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#4ADE80] focus:ring-[#4ADE80]/20"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Medio</Label>
          <Select name="medioPago" defaultValue="efectivo">
            <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
              {PAYMENT_METHODS.map((pm) => (
                <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nota</Label>
        <Input
          name="descripcion"
          placeholder="Opcional"
          className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#4ADE80] focus:ring-[#4ADE80]/20"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-medium border-0 hover:opacity-90 transition-opacity bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-white shadow-[0_8px_32px_rgba(74,222,128,0.25)]"
        disabled={loading}
      >
        {loading ? "Guardando..." : "Agregar ingreso"}
      </Button>
    </form>
  );
}
