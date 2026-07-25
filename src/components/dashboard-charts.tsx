"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { FinancialHealth } from "@/components/financial-health";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Receipt,
  PiggyBank,
  Landmark,
  Bitcoin,
  Globe,
  Banknote,
  MoreHorizontal,
} from "lucide-react";

interface DashboardData {
  monthlyData: {
    month: string;
    monthKey: string;
    ingresos: number;
    gastos: number;
    ahorro: number;
  }[];
  currentMonth: {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
    expenseChange: number;
    incomeChange: number;
  };
  byCategory: { nombre: string; color: string; total: number }[];
  incomeBySource: { nombre: string; color: string; total: number }[];
  investments: {
    total: number;
    deposited: number;
    gainLoss: number;
    accounts: { nombre: string; tipo: string; color: string; saldo: number; moneda: string }[];
  };
  dailySpending: { day: string; total: number }[];
  recentTransactions: {
    id: string;
    tipo: "gasto" | "ingreso";
    monto: number;
    categoria: string;
    color: string;
    fecha: Date;
    descripcion: string | null;
    familyMember: string | null;
  }[];
  financialHealth: {
    liquidity: { level: string; label: string; ratio: number };
    variableExpenses: { level: string; label: string; changePercent: number };
    creditCards: { level: string; label: string; changePercent: number };
    savingsRate: { level: string; label: string; rate: number };
  };
  monthName: string;
  year: number;
}

const tooltipStyle = {
  backgroundColor: "#161B3D",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#EEEEF0",
  fontSize: "12px",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTooltipValue = (value: any) =>
  formatCurrency(Number(value));

function getTypeIcon(tipo: string) {
  switch (tipo) {
    case "cripto": return Bitcoin;
    case "bolsa": return Landmark;
    case "online": return Globe;
    case "banco": return Banknote;
    default: return MoreHorizontal;
  }
}

function ChangeIndicator({ value, invert }: { value: number; invert?: boolean }) {
  if (value === 0) return null;
  const isPositive = invert ? value < 0 : value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
      isPositive ? "bg-[rgba(74,222,128,0.15)] text-[#4ADE80]" : "bg-[rgba(255,107,107,0.15)] text-[#FF6B6B]"
    }`}>
      {value > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
      {Math.abs(Math.round(value))}%
    </span>
  );
}

export function DashboardCharts({ data }: { data: DashboardData }) {
  const { currentMonth, monthlyData, byCategory, incomeBySource, investments, dailySpending, recentTransactions } = data;
  const totalCatExpenses = byCategory.reduce((s, c) => s + c.total, 0);
  const hasAnyData = currentMonth.totalExpenses > 0 || currentMonth.totalIncome > 0;
  const hasHistory = monthlyData.some((m) => m.ingresos > 0 || m.gastos > 0);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl glass p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(74,222,128,0.15)] flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
            </div>
            <ChangeIndicator value={currentMonth.incomeChange} />
          </div>
          <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Ingresos</p>
          <p className="text-base font-bold text-white tabular-nums mt-0.5">
            {formatCurrency(currentMonth.totalIncome)}
          </p>
        </div>

        <div className="rounded-xl glass p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(255,107,107,0.15)] flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5 text-[#FF6B6B]" />
            </div>
            <ChangeIndicator value={currentMonth.expenseChange} invert />
          </div>
          <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Gastos</p>
          <p className="text-base font-bold text-white tabular-nums mt-0.5">
            {formatCurrency(currentMonth.totalExpenses)}
          </p>
        </div>

        <div className="rounded-xl glass p-3.5">
          <div className="mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(123,97,255,0.15)] flex items-center justify-center">
              <PiggyBank className="h-3.5 w-3.5 text-[#7B61FF]" />
            </div>
          </div>
          <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Ahorro</p>
          <p className={`text-base font-bold tabular-nums mt-0.5 ${currentMonth.balance >= 0 ? "text-[#4ADE80]" : "text-[#FF6B6B]"}`}>
            {currentMonth.balance >= 0 ? "+" : ""}{formatCurrency(currentMonth.balance)}
          </p>
        </div>

        <Link href="/inversiones" className="block">
          <div className="rounded-xl glass p-3.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors h-full">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-[#F59E0B]" />
              </div>
              {investments.gainLoss !== 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  investments.gainLoss >= 0 ? "bg-[rgba(74,222,128,0.15)] text-[#4ADE80]" : "bg-[rgba(255,107,107,0.15)] text-[#FF6B6B]"
                }`}>
                  {investments.gainLoss >= 0 ? "+" : ""}{formatCurrency(investments.gainLoss)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Inversiones</p>
            <p className="text-base font-bold text-white tabular-nums mt-0.5">
              {formatCurrency(investments.total)}
            </p>
          </div>
        </Link>
      </div>

      {/* Financial Health — only show when there's meaningful data */}
      {hasAnyData && <FinancialHealth data={data.financialHealth} />}

      {/* Income vs Expenses Area Chart */}
      {hasHistory && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Ingresos vs Gastos
          </h3>
          <div className="rounded-xl glass p-4 pt-2">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} />
                <YAxis hide />
                <Tooltip formatter={formatTooltipValue} contentStyle={tooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.5)" }} />
                <Area type="monotone" dataKey="ingresos" stroke="#4ADE80" strokeWidth={2} fill="url(#incomeGrad)" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" stroke="#FF6B6B" strokeWidth={2} fill="url(#expenseGrad)" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 -mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-[#4ADE80]" />
                <span className="text-[10px] text-[rgba(255,255,255,0.4)]">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-[#FF6B6B]" />
                <span className="text-[10px] text-[rgba(255,255,255,0.4)]">Gastos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending by Category - Donut + Daily Spending side by side on larger screens */}
      {byCategory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Gastos por Categoría
          </h3>
          <div className="rounded-xl glass p-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="total" nameKey="nombre" cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} cornerRadius={4}>
                      {byCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltipValue} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] text-[rgba(255,255,255,0.5)]">Total</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(totalCatExpenses)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {byCategory.slice(0, 5).map((cat) => {
                  const pct = totalCatExpenses > 0 ? ((cat.total / totalCatExpenses) * 100).toFixed(0) : "0";
                  return (
                    <div key={cat.nombre} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-[11px] text-[rgba(255,255,255,0.5)] flex-1 truncate">{cat.nombre}</span>
                      <span className="text-[11px] font-semibold text-white tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
                {byCategory.length > 5 && (
                  <p className="text-[10px] text-[rgba(255,255,255,0.45)] pl-4">+{byCategory.length - 5} más</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Spending Trend */}
      {dailySpending.some((d) => d.total > 0) && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Gasto Diario
          </h3>
          <div className="rounded-xl glass p-4 pt-2">
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={dailySpending}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.45)" }} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip formatter={formatTooltipValue} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="total" stroke="#7B61FF" strokeWidth={2} fill="url(#dailyGrad)" name="Gasto" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Savings Bar — only if there's history */}
      {monthlyData.filter((m) => m.ahorro !== 0).length > 1 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Ahorro Mensual
          </h3>
          <div className="rounded-xl glass p-4 pt-2">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={monthlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} />
                <YAxis hide />
                <Tooltip formatter={formatTooltipValue} contentStyle={tooltipStyle} />
                <Bar dataKey="ahorro" radius={[6, 6, 0, 0]} name="Ahorro">
                  {monthlyData.map((entry, index) => (
                    <Cell key={index} fill={entry.ahorro >= 0 ? "#7B61FF" : "#FF6B6B"} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Income Sources */}
      {incomeBySource.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Fuentes de Ingreso
          </h3>
          <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
            {incomeBySource.map((src) => {
              const pct = currentMonth.totalIncome > 0 ? (src.total / currentMonth.totalIncome) * 100 : 0;
              return (
                <div key={src.nombre} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${src.color}20` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">{src.nombre}</span>
                      <span className="text-sm font-semibold tabular-nums text-white">{formatCurrency(src.total)}</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                      <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Investment Portfolio */}
      {investments.accounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
              Portfolio de Inversión
            </h3>
            <Link href="/inversiones" className="text-xs text-[#7B61FF] hover:text-white transition-colors">
              Ver todo
            </Link>
          </div>
          <div className="rounded-xl glass p-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 90, height: 90 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={investments.accounts} dataKey="saldo" nameKey="nombre" cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} cornerRadius={3}>
                      {investments.accounts.map((a, i) => (
                        <Cell key={i} fill={a.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <TrendingUp className="h-3.5 w-3.5 text-[#F59E0B]" />
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {investments.accounts.map((account) => {
                  const Icon = getTypeIcon(account.tipo);
                  return (
                    <div key={account.nombre} className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: account.color }} />
                      <span className="text-[11px] text-[rgba(255,255,255,0.5)] flex-1 truncate">{account.nombre}</span>
                      <span className="text-[11px] font-semibold text-white tabular-nums">
                        {formatCurrency(account.saldo, account.moneda)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-xs text-[rgba(255,255,255,0.4)]">Rendimiento</span>
              <span className={`text-xs font-semibold ${investments.gainLoss >= 0 ? "text-[#4ADE80]" : "text-[#FF6B6B]"}`}>
                {investments.gainLoss >= 0 ? "+" : ""}{formatCurrency(investments.gainLoss)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Últimos Movimientos
          </h3>
          <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tx.color}15` }}>
                  {tx.tipo === "ingreso" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" style={{ color: tx.color }} />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tx.color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {tx.categoria}
                    {tx.familyMember && (
                      <span className="text-[rgba(255,255,255,0.5)] font-normal text-xs"> · {tx.familyMember}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-[rgba(255,255,255,0.5)] truncate">
                    {tx.descripcion || new Date(tx.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${tx.tipo === "ingreso" ? "text-[#4ADE80]" : "text-white"}`}>
                  {tx.tipo === "ingreso" ? "+" : "-"}{formatCurrency(tx.monto)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
