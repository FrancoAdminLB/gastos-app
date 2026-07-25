import { getExpenseCategories, getIncomeCategories } from "@/app/actions/categories";
import { getTrips } from "@/app/actions/trips";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { getDashboardData } from "@/app/actions/dashboard";
import { getSavingsGoals } from "@/app/actions/savings-goals";
import { getFinancialEvents } from "@/app/actions/financial-events";
import { QuickAddButton } from "@/components/quick-add-button";
import { DashboardCharts } from "@/components/dashboard-charts";
import { SavingsGoals } from "@/components/savings-goals";
import { FinancialCalendar } from "@/components/financial-calendar";
import { formatCurrency } from "@/lib/format";
import { Wallet } from "lucide-react";
import { Suspense } from "react";

// Main dashboard data — critical, loaded first
async function DashboardContent() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    return (
      <div className="text-center py-16">
        <p className="text-white">Inicia sesión para ver tu dashboard</p>
      </div>
    );
  }

  const { currentMonth, monthName, year } = dashboardData;
  const patrimonioTotal = currentMonth.balance + dashboardData.investments.total;

  return (
    <>
      {/* Hero Balance Card */}
      <div className="rounded-2xl gradient-card glow-primary p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/70 capitalize">{monthName} {year}</p>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white/80" />
            </div>
          </div>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Balance del mes</p>
          <p className={`text-3xl font-bold tracking-tight ${currentMonth.balance >= 0 ? "text-white" : "text-[#FF6B6B]"}`}>
            {currentMonth.balance >= 0 ? "+" : ""}{formatCurrency(currentMonth.balance)}
          </p>
          {dashboardData.investments.total > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Patrimonio total</p>
              <p className="text-lg font-bold text-white/90 mt-0.5">{formatCurrency(patrimonioTotal)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Charts & Financial Health */}
      <DashboardCharts data={dashboardData} />
    </>
  );
}

// Secondary sections — can stream in
async function SecondaryContent() {
  const [savingsGoals, financialEvents, creditCards] = await Promise.all([
    getSavingsGoals(),
    getFinancialEvents(),
    getCreditCards(),
  ]);

  return (
    <>
      <SavingsGoals goals={savingsGoals} />
      <FinancialCalendar events={financialEvents} creditCards={creditCards} />
    </>
  );
}

// FAB data — least critical
async function QuickAddContent() {
  const [expenseCategories, incomeCategories, trips, creditCards, familyMembers] = await Promise.all([
    getExpenseCategories(),
    getIncomeCategories(),
    getTrips(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  return (
    <QuickAddButton
      categories={expenseCategories}
      incomeCategories={incomeCategories}
      trips={trips}
      creditCards={creditCards}
      familyMembers={familyMembers}
    />
  );
}

export default function HomePage() {
  return (
    <div className="space-y-5">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
      <Suspense fallback={null}>
        <SecondaryContent />
      </Suspense>
      <Suspense fallback={null}>
        <QuickAddContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="rounded-2xl bg-[rgba(255,255,255,0.06)] h-40" />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[rgba(255,255,255,0.06)] h-24" />
        <div className="rounded-xl bg-[rgba(255,255,255,0.06)] h-24" />
        <div className="rounded-xl bg-[rgba(255,255,255,0.06)] h-24" />
        <div className="rounded-xl bg-[rgba(255,255,255,0.06)] h-24" />
      </div>
    </div>
  );
}
