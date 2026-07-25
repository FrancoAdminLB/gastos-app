import { getExpenses } from "@/app/actions/expenses";
import { getIncomes } from "@/app/actions/incomes";
import { getExpenseCategories, getIncomeCategories } from "@/app/actions/categories";
import { getTrips } from "@/app/actions/trips";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { QuickAddButton } from "@/components/quick-add-button";
import { MovementsList } from "@/components/movements-list";
import { ArrowLeftRight } from "lucide-react";
import { Suspense } from "react";

async function MovimientosContent() {
  const [expenses, incomes, expenseCategories, incomeCategories, trips, creditCards, familyMembers] = await Promise.all([
    getExpenses(),
    getIncomes(),
    getExpenseCategories(),
    getIncomeCategories(),
    getTrips(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  const movements = [
    ...expenses.map((e) => ({
      id: e.id,
      tipo: "gasto" as const,
      monto: e.monto,
      moneda: e.moneda,
      fecha: e.fecha,
      descripcion: e.descripcion,
      categoria: e.category.nombre,
      color: e.category.color,
      categoryId: e.categoryId,
      familyMember: e.familyMember?.nombre || null,
      familyMemberId: e.familyMemberId || null,
      medioPago: e.medioPago,
      tripId: e.tripId,
      creditCardId: e.creditCardId || null,
    })),
    ...incomes.map((i) => ({
      id: i.id,
      tipo: "ingreso" as const,
      monto: i.monto,
      moneda: i.moneda,
      fecha: i.fecha,
      descripcion: i.descripcion,
      categoria: i.category.nombre,
      color: i.category.color,
      categoryId: i.categoryId,
      familyMember: null,
      familyMemberId: null,
      medioPago: i.medioPago,
      tripId: null,
      creditCardId: null,
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const hasData = movements.length > 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Movimientos</h2>
        <span className="text-sm text-[rgba(255,255,255,0.4)]">{movements.length} registros</span>
      </div>

      {!hasData ? (
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <ArrowLeftRight className="h-7 w-7 text-[rgba(255,255,255,0.4)]" />
          </div>
          <div>
            <p className="font-medium text-white">Sin movimientos</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
              Toca el + para registrar un gasto o ingreso
            </p>
          </div>
        </div>
      ) : (
        <MovementsList
          movements={movements}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          trips={trips}
          creditCards={creditCards}
          familyMembers={familyMembers}
        />
      )}

      <QuickAddButton
        categories={expenseCategories}
        incomeCategories={incomeCategories}
        trips={trips}
        creditCards={creditCards}
        familyMembers={familyMembers}
      />
    </>
  );
}

export default function MovimientosPage() {
  return (
    <div className="space-y-5">
      <Suspense fallback={<div className="space-y-3 animate-pulse"><div className="h-8 w-40 rounded bg-[rgba(255,255,255,0.06)]" /><div className="h-9 rounded-lg bg-[rgba(255,255,255,0.06)]" /><div className="grid grid-cols-3 gap-2"><div className="h-16 rounded-xl bg-[rgba(255,255,255,0.06)]" /><div className="h-16 rounded-xl bg-[rgba(255,255,255,0.06)]" /><div className="h-16 rounded-xl bg-[rgba(255,255,255,0.06)]" /></div></div>}>
        <MovimientosContent />
      </Suspense>
    </div>
  );
}
