"use client";

import { useState } from "react";
import { createCreditCard, updateCreditCard, deleteCreditCard } from "@/app/actions/credit-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Trash2, Pencil, CreditCard, Calendar } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface CreditCardData {
  id: string;
  nombre: string;
  ultimos4: string | null;
  diaCierre: number | null;
  diaVencimiento: number | null;
  color: string;
}

export function CreditCardManager({
  cards,
  isAdmin,
}: {
  cards: CreditCardData[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editCard, setEditCard] = useState<CreditCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editCard) {
        await updateCreditCard(editCard.id, formData);
      } else {
        await createCreditCard(formData);
      }
      setOpen(false);
      setEditCard(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteCreditCard(deleteId);
    } finally {
      setDeleteId(null);
    }
  }

  function openEdit(card: CreditCardData) {
    setEditCard(card);
    setOpen(true);
  }

  function openNew() {
    setEditCard(null);
    setOpen(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
          Tarjetas de Credito
        </h3>
        {isAdmin && (
          <button
            className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            onClick={openNew}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva
          </button>
        )}
      </div>

      <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
        {cards.map((card) => (
          <div key={card.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <CreditCard className="h-4 w-4" style={{ color: card.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {card.nombre}
                  {card.ultimos4 && (
                    <span className="text-[rgba(255,255,255,0.5)] font-normal"> *{card.ultimos4}</span>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-[rgba(255,255,255,0.4)]">
                    <Calendar className="h-2.5 w-2.5" />
                    Cierre: <span className="text-white font-medium">{card.diaCierre ?? "—"}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[rgba(255,255,255,0.4)]">
                    Vto: <span className="text-white font-medium">{card.diaVencimiento ?? "—"}</span>
                  </span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    className="p-2 rounded-lg text-[rgba(255,255,255,0.4)] hover:text-[#7B61FF] hover:bg-[rgba(123,97,255,0.1)] transition-colors"
                    onClick={() => openEdit(card)}
                    aria-label="Editar tarjeta"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="p-2 rounded-lg text-[rgba(255,255,255,0.4)] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                    onClick={() => setDeleteId(card.id)}
                    aria-label="Eliminar tarjeta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-[rgba(255,255,255,0.4)] text-center py-6">
            No hay tarjetas configuradas
          </p>
        )}
      </div>

      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditCard(null); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">
              {editCard ? "Editar Tarjeta" : "Nueva Tarjeta"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4 px-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
                <Input
                  name="nombre"
                  placeholder="Visa Galicia"
                  defaultValue={editCard?.nombre}
                  required
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Ultimos 4</Label>
                <Input
                  name="ultimos4"
                  placeholder="4589"
                  maxLength={4}
                  defaultValue={editCard?.ultimos4 || ""}
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Día de cierre</Label>
                <Input
                  name="diaCierre"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="23"
                  defaultValue={editCard?.diaCierre || ""}
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Día de vencimiento</Label>
                <Input
                  name="diaVencimiento"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="4"
                  defaultValue={editCard?.diaVencimiento || ""}
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Color</Label>
              <Input
                name="color"
                type="color"
                defaultValue={editCard?.color || "#3B82F6"}
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Guardando..." : editCard ? "Guardar cambios" : "Crear tarjeta"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar tarjeta"
        description="Se eliminará esta tarjeta de crédito."
      />
    </div>
  );
}
