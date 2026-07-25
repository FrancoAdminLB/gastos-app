import { getExpenses } from "@/app/actions/expenses";
import { getIncomes } from "@/app/actions/incomes";
import { getExpenseCategories } from "@/app/actions/categories";
import { getFamilyMembers } from "@/app/actions/family-members";
import { ReportsCharts } from "@/components/reports-charts";
import { FamilyReport } from "@/components/family-report";
import { MovementsList } from "@/components/movements-list";
import { BarChart3 } from "lucide-react";
import { Suspense } from "react";

async function ReportsContent() {
  const [allExpenses, allIncomes, categories, familyMembers] = await Promise.all([
    getExpenses(),
    getIncomes(),
    getExpenseCategories(),
    getFamilyMembers(),
  ]);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const expenses = allExpenses.filter(
    (e) => new Date(e.fecha) >= sixMonthsAgo
  );

  const currentMonthExpenses = allExpenses.filter((e) => {
    const d = new Date(e.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Build unified movements list
  const movements = [
    ...allExpenses.map((e) => ({
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
      medioPago: e.medioPago,
    })),
    ...allIncomes.map((i) => ({
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
      medioPago: null,
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const hasData = expenses.length > 0 || allIncomes.length > 0;

  return (
    <>
      {!hasData ? (
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-[rgba(255,255,255,0.4)]" />
          </div>
          <div>
            <p className="font-medium text-white">Sin datos</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
              Carga gastos o ingresos para ver los reportes
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Movements list with PDF export */}
          <MovementsList movements={movements} />

          {/* Charts */}
          {expenses.length > 0 && (
            <>
              <FamilyReport
                expenses={currentMonthExpenses}
                familyMembers={familyMembers}
              />
              <ReportsCharts expenses={expenses} categories={categories} />
            </>
          )}
        </>
      )}
    </>
  );
}

export default function ReportesPage() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Reportes</h2>
      <Suspense fallback={<div className="space-y-3 animate-pulse"><div className="h-9 rounded-lg bg-[rgba(255,255,255,0.06)]" /><div className="grid grid-cols-3 gap-2"><div className="h-16 rounded-xl bg-[rgba(255,255,255,0.06)]" /><div className="h-16 rounded-xl bg-[rgba(255,255,255,0.06)]" /><div className="h-16 rounded-xl bg-[rgba(255,255,255,0.06)]" /></div></div>}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}
