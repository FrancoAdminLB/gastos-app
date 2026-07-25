"use client";

import { useState } from "react";
import { Plus, ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "./income-form";

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

export function QuickAddButton({
  categories,
  incomeCategories,
  trips,
  creditCards,
  familyMembers,
}: {
  categories: Category[];
  incomeCategories?: { id: string; nombre: string; color: string }[];
  trips: Trip[];
  creditCards?: CreditCard[];
  familyMembers?: FamilyMember[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"expense" | "income">("expense");

  function openSheet(m: "expense" | "income") {
    setMode(m);
    setOpen(true);
  }

  const hasIncomeCategories = incomeCategories && incomeCategories.length > 0;

  return (
    <>
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
        {hasIncomeCategories && (
          <button
            onClick={() => openSheet("income")}
            className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-white shadow-[0_4px_16px_rgba(74,222,128,0.3)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => openSheet("expense")}
          className="h-12 w-12 rounded-full gradient-card glow-primary text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">
              {mode === "expense" ? "Nuevo Gasto" : "Nuevo Ingreso"}
            </SheetTitle>
          </SheetHeader>

          {hasIncomeCategories && (
            <div className="flex gap-1 mt-2 mb-1 p-1 rounded-xl bg-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setMode("expense")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "expense"
                    ? "bg-[rgba(123,97,255,0.2)] text-[#B4A0FF]"
                    : "text-[rgba(255,255,255,0.4)]"
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" />
                Gasto
              </button>
              <button
                onClick={() => setMode("income")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "income"
                    ? "bg-[rgba(74,222,128,0.15)] text-[#4ADE80]"
                    : "text-[rgba(255,255,255,0.4)]"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Ingreso
              </button>
            </div>
          )}

          <div className="mt-4 px-1">
            {mode === "expense" ? (
              <ExpenseForm
                categories={categories}
                trips={trips}
                creditCards={creditCards}
                familyMembers={familyMembers}
                onSuccess={() => setOpen(false)}
              />
            ) : (
              incomeCategories && (
                <IncomeForm
                  categories={incomeCategories}
                  onSuccess={() => setOpen(false)}
                />
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
