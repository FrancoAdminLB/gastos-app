"use client";

import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Activity,
  Minus,
} from "lucide-react";

interface HealthData {
  liquidity: { level: string; label: string; ratio: number };
  variableExpenses: { level: string; label: string; changePercent: number };
  creditCards: { level: string; label: string; changePercent: number };
  savingsRate: { level: string; label: string; rate: number };
}

const LEVEL_CONFIG: Record<string, { bg: string; text: string; glow: string }> = {
  excelente: { bg: "rgba(74,222,128,0.12)", text: "#4ADE80", glow: "rgba(74,222,128,0.3)" },
  buena: { bg: "rgba(96,165,250,0.12)", text: "#60A5FA", glow: "rgba(96,165,250,0.3)" },
  normal: { bg: "rgba(251,191,36,0.12)", text: "#FBBF24", glow: "rgba(251,191,36,0.3)" },
  ajustada: { bg: "rgba(251,146,60,0.12)", text: "#FB923C", glow: "rgba(251,146,60,0.3)" },
  critica: { bg: "rgba(255,107,107,0.12)", text: "#FF6B6B", glow: "rgba(255,107,107,0.3)" },
  alto: { bg: "rgba(255,107,107,0.12)", text: "#FF6B6B", glow: "rgba(255,107,107,0.3)" },
  bajo: { bg: "rgba(74,222,128,0.12)", text: "#4ADE80", glow: "rgba(74,222,128,0.3)" },
  por_encima: { bg: "rgba(255,107,107,0.12)", text: "#FF6B6B", glow: "rgba(255,107,107,0.3)" },
  por_debajo: { bg: "rgba(74,222,128,0.12)", text: "#4ADE80", glow: "rgba(74,222,128,0.3)" },
  nula: { bg: "rgba(255,107,107,0.12)", text: "#FF6B6B", glow: "rgba(255,107,107,0.3)" },
};

function getConfig(level: string) {
  return LEVEL_CONFIG[level] || LEVEL_CONFIG.normal;
}

function LiquidityIcon({ level }: { level: string }) {
  if (level === "excelente" || level === "buena") return <ShieldCheck className="h-4 w-4" />;
  if (level === "ajustada") return <ShieldAlert className="h-4 w-4" />;
  return <ShieldX className="h-4 w-4" />;
}

function TrendIcon({ value }: { value: number }) {
  if (value > 5) return <TrendingUp className="h-3.5 w-3.5" />;
  if (value < -5) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

export function FinancialHealth({ data }: { data: HealthData }) {
  // Build indicators, only showing those with meaningful data
  const indicators: { label: string; value: string; level: string; detail: string; icon: React.ReactNode }[] = [];

  // Liquidity: only show if ratio > 0 (means there's income or expenses)
  if (data.liquidity.ratio > 0 && data.liquidity.label !== "Sin datos") {
    indicators.push({
      label: "Liquidez",
      value: data.liquidity.label,
      level: data.liquidity.level,
      detail: data.liquidity.ratio >= 99 ? "Sin gastos" : `Ratio ${data.liquidity.ratio.toFixed(1)}x`,
      icon: <LiquidityIcon level={data.liquidity.level} />,
    });
  }

  // Variable expenses: only show if there's historical comparison data
  if (data.variableExpenses.changePercent !== 0) {
    indicators.push({
      label: "Gastos Variables",
      value: data.variableExpenses.label,
      level: data.variableExpenses.level,
      detail: `${data.variableExpenses.changePercent > 0 ? "+" : ""}${Math.round(data.variableExpenses.changePercent)}% vs promedio`,
      icon: <TrendIcon value={data.variableExpenses.changePercent} />,
    });
  }

  // Credit cards: only show if there's any credit card data
  if (data.creditCards.changePercent !== 0) {
    indicators.push({
      label: "Tarjetas",
      value: data.creditCards.label,
      level: data.creditCards.level,
      detail: `${data.creditCards.changePercent > 0 ? "+" : ""}${Math.round(data.creditCards.changePercent)}% vs promedio`,
      icon: <CreditCard className="h-4 w-4" />,
    });
  }

  // Savings rate: only show if there's income
  if (data.savingsRate.rate !== 0 || data.savingsRate.level !== "ajustada") {
    indicators.push({
      label: "Tasa de Ahorro",
      value: data.savingsRate.label,
      level: data.savingsRate.level,
      detail: `${Math.round(data.savingsRate.rate)}% del ingreso`,
      icon: <Activity className="h-4 w-4" />,
    });
  }

  if (indicators.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
        Estado Financiero
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {indicators.map((ind) => {
          const cfg = getConfig(ind.level);
          return (
            <div
              key={ind.label}
              className="rounded-xl glass p-3.5 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 opacity-40"
                style={{ backgroundColor: cfg.glow }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    {ind.icon}
                  </div>
                  <span className="text-[10px] text-[rgba(255,255,255,0.45)] uppercase tracking-wider font-medium">
                    {ind.label}
                  </span>
                </div>
                <p className="text-sm font-bold" style={{ color: cfg.text }}>
                  {ind.value}
                </p>
                <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-0.5">
                  {ind.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
