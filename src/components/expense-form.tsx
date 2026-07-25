"use client";

import { useState } from "react";
import { createExpense, updateExpense } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP", "UYU", "GBP"];
const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "transferencia_bancaria", label: "Transferencia" },
  { value: "cripto", label: "Cripto" },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito" },
];

interface CategoryChild {
  id: string;
  nombre: string;
  color: string;
}

interface Category {
  id: string;
  nombre: string;
  color: string;
  tipo: string;
  parentId: string | null;
  children?: CategoryChild[];
}

interface Trip {
  id: string;
  nombre: string;
}

interface CreditCard {
  id: string;
  nombre: string;
  ultimos4: string | null;
  color: string;
}

interface FamilyMember {
  id: string;
  nombre: string;
  color: string;
}

interface ExpenseData {
  id: string;
  monto: number;
  moneda: string;
  categoryId: string;
  tripId: string | null;
  familyMemberId?: string | null;
  creditCardId?: string | null;
  fecha: Date;
  descripcion: string | null;
  medioPago: string;
}

export function ExpenseForm({
  categories,
  trips,
  creditCards,
  familyMembers,
  expense,
  onSuccess,
}: {
  categories: Category[];
  trips: Trip[];
  creditCards?: CreditCard[];
  familyMembers?: FamilyMember[];
  expense?: ExpenseData;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(expense?.medioPago || "efectivo");
  const isEditing = !!expense;

  const expenseCategories = categories.filter(
    (c) => c.tipo !== "ingreso" && !c.parentId
  );

  const showCreditCards = selectedPayment === "tarjeta_credito" && creditCards && creditCards.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (isEditing) {
        await updateExpense(expense.id, formData);
      } else {
        await createExpense(formData);
      }
      if (!isEditing) {
        (e.target as HTMLFormElement).reset();
        setSelectedPayment("efectivo");
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Monto</Label>
        <div className="flex gap-2">
          <Input
            name="monto"
            type="number"
            step="0.01"
            placeholder="0.00"
            defaultValue={expense?.monto}
            required
            autoFocus
            className="h-14 text-2xl font-bold rounded-xl flex-1 tabular-nums bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
          />
          <Select name="moneda" defaultValue={expense?.moneda || "ARS"}>
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

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Categoria</Label>
        <Select name="categoryId" defaultValue={expense?.categoryId} required>
          <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
            <SelectValue placeholder="Elegir categoria" />
          </SelectTrigger>
          <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)] max-h-72">
            {expenseCategories.map((cat) => {
              const children = cat.children || [];
              if (children.length === 0) {
                return (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.nombre}
                    </span>
                  </SelectItem>
                );
              }
              return (
                <SelectGroup key={cat.id}>
                  <SelectLabel className="text-[rgba(255,255,255,0.35)] text-xs px-2 py-1.5 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.nombre}
                  </SelectLabel>
                  <SelectItem value={cat.id}>
                    <span className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.nombre} (general)
                    </span>
                  </SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <span className="flex items-center gap-2.5 pl-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: child.color }} />
                        {child.nombre}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Date + Payment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Fecha</Label>
          <Input
            name="fecha"
            type="date"
            defaultValue={expense ? new Date(expense.fecha).toISOString().split("T")[0] : today}
            required
            className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Pago</Label>
          <Select
            name="medioPago"
            defaultValue={expense?.medioPago || "efectivo"}
            onValueChange={(v) => setSelectedPayment(v ?? "efectivo")}
          >
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

      {/* Credit Card — shown only when payment = tarjeta_credito */}
      {showCreditCards && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Tarjeta</Label>
          <Select name="creditCardId" defaultValue={expense?.creditCardId || ""}>
            <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
              <SelectValue placeholder="Elegir tarjeta" />
            </SelectTrigger>
            <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="">Sin especificar</SelectItem>
              {creditCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                    {card.nombre}
                    {card.ultimos4 && <span className="text-[rgba(255,255,255,0.35)]">*{card.ultimos4}</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Family Member */}
      {familyMembers && familyMembers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Miembro</Label>
          <Select name="familyMemberId" defaultValue={expense?.familyMemberId || ""}>
            <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="">Sin asignar</SelectItem>
              {familyMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    {m.nombre}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Trip */}
      {trips.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Viaje</Label>
          <Select name="tripId" defaultValue={expense?.tripId || ""}>
            <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
              <SelectValue placeholder="Gasto diario" />
            </SelectTrigger>
            <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="">Gasto diario</SelectItem>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>{trip.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Note */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nota</Label>
        <Textarea
          name="descripcion"
          placeholder="Opcional..."
          rows={2}
          defaultValue={expense?.descripcion || ""}
          className="rounded-xl resize-none bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
        disabled={loading}
      >
        {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar gasto"}
      </Button>
    </form>
  );
}
