"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface Expense {
  id: string;
  monto: number;
  moneda: string;
  categoryId: string;
  tripId: string | null;
  fecha: Date;
  category: { nombre: string; color: string };
  trip: { nombre: string } | null;
}

interface Category {
  id: string;
  nombre: string;
  color: string;
}

export function ReportsCharts({
  expenses,
  categories,
}: {
  expenses: Expense[];
  categories: Category[];
}) {
  const dailyExpenses = expenses.filter((e) => !e.tripId);

  // PIE: by category
  const byCategory = new Map<string, { nombre: string; color: string; total: number }>();
  for (const exp of dailyExpenses) {
    const existing = byCategory.get(exp.categoryId);
    if (existing) {
      existing.total += exp.monto;
    } else {
      const cat = categories.find((c) => c.id === exp.categoryId);
      byCategory.set(exp.categoryId, {
        nombre: cat?.nombre || "Otro",
        color: cat?.color || "#6B7280",
        total: exp.monto,
      });
    }
  }
  const pieData = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
  const totalDaily = pieData.reduce((s, d) => s + d.total, 0);

  // BAR: monthly
  const byMonth = new Map<string, number>();
  for (const exp of dailyExpenses) {
    const date = new Date(exp.fecha);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) || 0) + exp.monto);
  }
  const monthlyData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => {
      const [y, m] = month.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleString("es-AR", { month: "short" });
      return { month: label, total: Math.round(total * 100) / 100 };
    });

  // Trip comparison
  const tripExpenses = expenses.filter((e) => e.tripId);
  const byTrip = new Map<string, { nombre: string; total: number }>();
  for (const exp of tripExpenses) {
    const existing = byTrip.get(exp.tripId!);
    if (existing) {
      existing.total += exp.monto;
    } else {
      byTrip.set(exp.tripId!, { nombre: exp.trip?.nombre || "Viaje", total: exp.monto });
    }
  }
  const tripData = Array.from(byTrip.values()).sort((a, b) => b.total - a.total);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTooltip = (value: any) =>
    Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2 });

  const tooltipStyle = {
    backgroundColor: "#161B3D",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#EEEEF0",
  };

  return (
    <div className="space-y-5">
      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Gastos por categoria
          </h3>
          <div className="rounded-xl glass p-4">
            <div className="flex items-center gap-4">
              {/* Chart */}
              <div className="w-[130px] h-[130px] shrink-0 relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="total"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={58}
                      paddingAngle={3}
                      cornerRadius={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Total</p>
                  <p className="text-[11px] font-bold text-white tabular-nums">{formatCurrency(totalDaily)}</p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {pieData.map((cat) => {
                  const pct = totalDaily > 0 ? ((cat.total / totalDaily) * 100).toFixed(0) : "0";
                  return (
                    <div key={cat.nombre} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-[rgba(255,255,255,0.6)] truncate">{cat.nombre}</span>
                      </div>
                      <span className="text-xs font-semibold text-white tabular-nums shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Evolucion mensual
          </h3>
          <div className="rounded-xl glass p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="25%">
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }}
                />
                <YAxis hide />
                <Tooltip formatter={formatTooltip} contentStyle={tooltipStyle} />
                <Bar
                  dataKey="total"
                  fill="#7B61FF"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trip comparison */}
      {tripData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Viajes
          </h3>
          <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
            {tripData.map((trip) => {
              const maxTrip = tripData[0].total;
              const pct = maxTrip > 0 ? (trip.total / maxTrip) * 100 : 0;
              return (
                <div key={trip.nombre} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{trip.nombre}</span>
                    <span className="text-sm font-semibold tabular-nums text-white">
                      {trip.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7B61FF] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
