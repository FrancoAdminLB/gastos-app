import { Suspense } from "react";
import { getInvestmentAccounts } from "@/app/actions/investments";
import { getExpenseCategories, getIncomeCategories } from "@/app/actions/categories";
import { getTrips } from "@/app/actions/trips";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { InvestmentPortfolio } from "@/components/investment-portfolio";
import { QuickAddButton } from "@/components/quick-add-button";

async function InversionesContent() {
  const [accounts, expenseCategories, incomeCategories, trips, creditCards, familyMembers] = await Promise.all([
    getInvestmentAccounts(),
    getExpenseCategories(),
    getIncomeCategories(),
    getTrips(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  return (
    <>
      <InvestmentPortfolio accounts={accounts} />
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

export default function InversionesPage() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Ahorro e Inversión</h2>
      <Suspense fallback={<div className="h-48 rounded-2xl glass animate-pulse" />}>
        <InversionesContent />
      </Suspense>
    </div>
  );
}
