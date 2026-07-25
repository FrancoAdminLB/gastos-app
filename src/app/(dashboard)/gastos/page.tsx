import { getExpenses } from "@/app/actions/expenses";
import { getExpenseCategories, getIncomeCategories } from "@/app/actions/categories";
import { getTrips } from "@/app/actions/trips";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { QuickAddButton } from "@/components/quick-add-button";
import { ExpenseList } from "@/components/expense-list";
import { Receipt } from "lucide-react";

export default async function GastosPage() {
  const [expenses, categories, incomeCategories, trips, creditCards, familyMembers] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getIncomeCategories(),
    getTrips(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Gastos</h2>
        <span className="text-sm text-[rgba(255,255,255,0.4)]">{expenses.length} registros</span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <Receipt className="h-7 w-7 text-[rgba(255,255,255,0.4)]" />
          </div>
          <div>
            <p className="font-medium text-white">Sin gastos</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">Toca el + para registrar uno</p>
          </div>
        </div>
      ) : (
        <ExpenseList
          expenses={expenses}
          categories={categories}
          trips={trips}
          creditCards={creditCards}
          familyMembers={familyMembers}
        />
      )}

      <QuickAddButton
        categories={categories}
        incomeCategories={incomeCategories}
        trips={trips}
        creditCards={creditCards}
        familyMembers={familyMembers}
      />
    </div>
  );
}
