import { getInvestmentAccounts } from "@/app/actions/investments";
import { getExpenseCategories, getIncomeCategories } from "@/app/actions/categories";
import { getTrips } from "@/app/actions/trips";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { InvestmentPortfolio } from "@/components/investment-portfolio";
import { QuickAddButton } from "@/components/quick-add-button";

export default async function InversionesPage() {
  const [accounts, expenseCategories, incomeCategories, trips, creditCards, familyMembers] = await Promise.all([
    getInvestmentAccounts(),
    getExpenseCategories(),
    getIncomeCategories(),
    getTrips(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Ahorro e Inversión</h2>
      <InvestmentPortfolio accounts={accounts} />
      <QuickAddButton
        categories={expenseCategories}
        incomeCategories={incomeCategories}
        trips={trips}
        creditCards={creditCards}
        familyMembers={familyMembers}
      />
    </div>
  );
}
