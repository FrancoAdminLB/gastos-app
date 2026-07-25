import { getTripWithExpenses } from "@/app/actions/trips";
import { getExpenseCategories } from "@/app/actions/categories";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { Progress } from "@/components/ui/progress";
import { ExpenseList } from "@/components/expense-list";
import { QuickAddButton } from "@/components/quick-add-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane } from "lucide-react";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trip, categories, creditCards, familyMembers] = await Promise.all([
    getTripWithExpenses(id),
    getExpenseCategories(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  if (!trip) notFound();

  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.monto, 0);
  const mainCurrency = trip.monedaBase;
  const percentage = trip.presupuestoTotal
    ? Math.min((totalSpent / trip.presupuestoTotal) * 100, 100)
    : 0;
  const isOver = trip.presupuestoTotal
    ? totalSpent > trip.presupuestoTotal
    : false;

  // Group by category
  const byCategory = new Map<string, { nombre: string; color: string; total: number }>();
  for (const exp of trip.expenses) {
    const existing = byCategory.get(exp.categoryId);
    if (existing) {
      existing.total += exp.monto;
    } else {
      byCategory.set(exp.categoryId, {
        nombre: exp.category.nombre,
        color: exp.category.color,
        total: exp.monto,
      });
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href="/viajes"
        className="inline-flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Viajes
      </Link>

      {/* Trip header */}
      <div className="rounded-2xl gradient-card glow-primary p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Plane className="h-5 w-5 text-white/70" />
            <p className="text-sm text-white/60">
              {formatDate(trip.fechaInicio)}
              {trip.fechaFin && ` — ${formatDate(trip.fechaFin)}`}
            </p>
          </div>
          <h2 className="text-xl font-bold mb-1">{trip.nombre}</h2>
          <p className="text-3xl font-bold tracking-tight mt-2">
            {formatCurrency(totalSpent, mainCurrency)}
          </p>
          {trip.presupuestoTotal && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2 text-white/70">
                <span>Presupuesto</span>
                <span className={isOver ? "font-bold text-[#FF6B6B]" : ""}>
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-[#FF6B6B]" : "bg-white/80"}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1.5">
                de {formatCurrency(trip.presupuestoTotal, mainCurrency)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      {byCategory.size > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Por categoria
          </h3>
          <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
            {Array.from(byCategory.values())
              .sort((a, b) => b.total - a.total)
              .map((cat) => (
                <div key={cat.nombre} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <span className="text-sm font-medium flex-1 text-white">{cat.nombre}</span>
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {formatCurrency(cat.total, mainCurrency)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expenses */}
      {trip.expenses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Gastos ({trip.expenses.length})
          </h3>
          <ExpenseList
            expenses={trip.expenses}
            categories={categories}
            trips={[{ id: trip.id, nombre: trip.nombre }]}
            creditCards={creditCards}
            familyMembers={familyMembers}
          />
        </div>
      )}

      <QuickAddButton
        categories={categories}
        trips={[{ id: trip.id, nombre: trip.nombre }]}
        creditCards={creditCards}
        familyMembers={familyMembers}
      />
    </div>
  );
}
