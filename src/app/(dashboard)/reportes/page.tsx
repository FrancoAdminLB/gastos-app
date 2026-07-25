import { getExpenses } from "@/app/actions/expenses";
import { getExpenseCategories } from "@/app/actions/categories";
import { getFamilyMembers } from "@/app/actions/family-members";
import { ReportsCharts } from "@/components/reports-charts";
import { FamilyReport } from "@/components/family-report";
import { BarChart3 } from "lucide-react";

export default async function ReportesPage() {
  const [allExpenses, categories, familyMembers] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getFamilyMembers(),
  ]);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const expenses = allExpenses.filter(
    (e) => new Date(e.fecha) >= sixMonthsAgo
  );

  // Current month expenses for family report
  const currentMonthExpenses = allExpenses.filter((e) => {
    const d = new Date(e.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Reportes</h2>

      {expenses.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-[rgba(255,255,255,0.4)]" />
          </div>
          <div>
            <p className="font-medium text-white">Sin datos</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
              Carga gastos para ver los reportes
            </p>
          </div>
        </div>
      ) : (
        <>
          <FamilyReport
            expenses={currentMonthExpenses}
            familyMembers={familyMembers}
          />
          <ReportsCharts expenses={expenses} categories={categories} />
        </>
      )}
    </div>
  );
}
