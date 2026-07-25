"use client";

import { useState } from "react";
import { createTrip } from "@/app/actions/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP", "UYU", "GBP"];

export function TripActions({ categories: _categories }: { categories: unknown[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createTrip(formData);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="rounded-lg gradient-card glow-primary border-0 text-white hover:opacity-90" />}>
        <Plus className="h-4 w-4 mr-1" />
        Nuevo
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
        <SheetHeader>
          <SheetTitle className="text-lg text-white">Nuevo Viaje</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4 px-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
            <Input
              name="nombre"
              placeholder="Ej: Vacaciones Europa"
              required
              className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Inicio</Label>
              <Input name="fechaInicio" type="date" required className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Fin</Label>
              <Input name="fechaFin" type="date" className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Moneda</Label>
              <Select name="monedaBase" defaultValue="USD">
                <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Presupuesto</Label>
              <Input
                name="presupuestoTotal"
                type="number"
                step="0.01"
                placeholder="Opcional"
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity" disabled={loading}>
            {loading ? "Creando..." : "Crear viaje"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
