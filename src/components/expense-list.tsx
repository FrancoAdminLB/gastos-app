"use client";

import { useState } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExpenseForm } from "./expense-form";
import { formatCurrency } from "@/lib/format";
import { Trash2, CreditCard, User } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Expense {
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
  category: { nombre: string; color: string };
  trip: { nombre: string } | null;
  familyMember?: { id: string; nombre: string; color: string } | null;
  creditCard?: { id: string; nombre: string; ultimos4: string | null; color: string } | null;
}

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

interface CreditCardType {
  id: string;
  nombre: string;
  ultimos4: string | null;
  color: string;
}

interface FamilyMemberType {
  id: string;
  nombre: string;
  color: string;
}

export function ExpenseList({
  expenses,
  categories,
  trips,
  creditCards,
  familyMembers,
}: {
  expenses: Expense[];
  categories: Category[];
  trips: Trip[];
  creditCards?: CreditCardType[];
  familyMembers?: FamilyMemberType[];
}) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(deleteId);
    try {
      await deleteExpense(deleteId);
    } finally {
      setDeleting(null);
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 px-4 py-3 active:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setEditingExpense(expense)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditingExpense(expense); } }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${expense.category.color}20` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: expense.category.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {expense.category.nombre}
                {expense.trip && (
                  <span className="text-[rgba(255,255,255,0.4)] font-normal">
                    {" "}&middot; {expense.trip.nombre}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.4)] truncate">
                <span>
                  {new Date(expense.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  {expense.descripcion && ` — ${expense.descripcion}`}
                </span>
                {expense.familyMember && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: `${expense.familyMember.color}20`, color: expense.familyMember.color }}
                  >
                    {expense.familyMember.nombre}
                  </span>
                )}
                {expense.creditCard && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[rgba(255,255,255,0.35)]">
                    <CreditCard className="h-2.5 w-2.5" />
                    {expense.creditCard.ultimos4 ? `*${expense.creditCard.ultimos4}` : expense.creditCard.nombre}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold tabular-nums text-white">
                {formatCurrency(expense.monto, expense.moneda)}
              </span>
              <button
                className="p-1.5 rounded-lg text-[rgba(255,255,255,0.3)] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                aria-label="Eliminar gasto"
                onClick={(e) => { e.stopPropagation(); setDeleteId(expense.id); }}
                disabled={deleting === expense.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Sheet
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">Editar Gasto</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-1">
            {editingExpense && (
              <ExpenseForm
                categories={categories}
                trips={trips}
                creditCards={creditCards}
                familyMembers={familyMembers}
                expense={editingExpense}
                onSuccess={() => setEditingExpense(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar gasto"
        description="Se eliminará este gasto permanentemente."
      />
    </>
  );
}
