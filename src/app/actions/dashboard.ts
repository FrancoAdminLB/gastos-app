"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const userFilter = { userId: user.id };

  const [expenses, incomes, investmentAccounts] = await Promise.all([
    prisma.expense.findMany({
      where: { ...userFilter, fecha: { gte: sixMonthsAgo } },
      select: {
        id: true,
        monto: true,
        moneda: true,
        fecha: true,
        descripcion: true,
        medioPago: true,
        tripId: true,
        categoryId: true,
        category: { select: { nombre: true, color: true } },
        familyMember: { select: { nombre: true } },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.income.findMany({
      where: { ...userFilter, fecha: { gte: sixMonthsAgo } },
      select: {
        id: true,
        monto: true,
        fecha: true,
        descripcion: true,
        categoryId: true,
        category: { select: { nombre: true, color: true } },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.investmentAccount.findMany({
      where: { userId: user.id },
      select: {
        nombre: true,
        tipo: true,
        color: true,
        saldoActual: true,
        moneda: true,
        movimientos: {
          select: { tipo: true, monto: true },
        },
      },
    }),
  ]);

  // Monthly breakdown (6 months)
  const monthlyData: {
    month: string;
    monthKey: string;
    ingresos: number;
    gastos: number;
    ahorro: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-AR", { month: "short" });

    const monthExpenses = expenses
      .filter((e) => {
        const ed = new Date(e.fecha);
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear() && !e.tripId;
      })
      .reduce((s, e) => s + e.monto, 0);

    const monthIncomes = incomes
      .filter((inc) => {
        const id = new Date(inc.fecha);
        return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
      })
      .reduce((s, inc) => s + inc.monto, 0);

    monthlyData.push({
      month: label,
      monthKey,
      ingresos: Math.round(monthIncomes * 100) / 100,
      gastos: Math.round(monthExpenses * 100) / 100,
      ahorro: Math.round((monthIncomes - monthExpenses) * 100) / 100,
    });
  }

  // Current month
  const currentMonthExpenses = expenses.filter((e) => {
    const ed = new Date(e.fecha);
    return ed.getMonth() === now.getMonth() && ed.getFullYear() === now.getFullYear() && !e.tripId;
  });
  const currentMonthIncomes = incomes.filter((inc) => {
    const id = new Date(inc.fecha);
    return id.getMonth() === now.getMonth() && id.getFullYear() === now.getFullYear();
  });

  const totalExpenses = currentMonthExpenses.reduce((s, e) => s + e.monto, 0);
  const totalIncome = currentMonthIncomes.reduce((s, i) => s + i.monto, 0);

  // Previous month for comparison
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthExpenses = expenses
    .filter((e) => {
      const ed = new Date(e.fecha);
      return ed.getMonth() === prevMonth.getMonth() && ed.getFullYear() === prevMonth.getFullYear() && !e.tripId;
    })
    .reduce((s, e) => s + e.monto, 0);
  const prevMonthIncomes = incomes
    .filter((inc) => {
      const id = new Date(inc.fecha);
      return id.getMonth() === prevMonth.getMonth() && id.getFullYear() === prevMonth.getFullYear();
    })
    .reduce((s, inc) => s + inc.monto, 0);

  // Category breakdown (current month)
  const byCategory: { nombre: string; color: string; total: number }[] = [];
  const catMap = new Map<string, { nombre: string; color: string; total: number }>();
  for (const exp of currentMonthExpenses) {
    const existing = catMap.get(exp.categoryId);
    if (existing) {
      existing.total += exp.monto;
    } else {
      catMap.set(exp.categoryId, {
        nombre: exp.category.nombre,
        color: exp.category.color,
        total: exp.monto,
      });
    }
  }
  byCategory.push(...Array.from(catMap.values()).sort((a, b) => b.total - a.total));

  // Income by source (current month)
  const incomeBySource: { nombre: string; color: string; total: number }[] = [];
  const srcMap = new Map<string, { nombre: string; color: string; total: number }>();
  for (const inc of currentMonthIncomes) {
    const existing = srcMap.get(inc.categoryId);
    if (existing) {
      existing.total += inc.monto;
    } else {
      srcMap.set(inc.categoryId, {
        nombre: inc.category.nombre,
        color: inc.category.color,
        total: inc.monto,
      });
    }
  }
  incomeBySource.push(...Array.from(srcMap.values()).sort((a, b) => b.total - a.total));

  // Investment portfolio
  const investmentTotal = investmentAccounts.reduce((s, a) => s + a.saldoActual, 0);
  const investmentDeposits = investmentAccounts.reduce((s, a) => {
    const deps = a.movimientos.filter((m) => m.tipo === "deposito").reduce((ss, m) => ss + m.monto, 0);
    const wds = a.movimientos.filter((m) => m.tipo === "retiro").reduce((ss, m) => ss + m.monto, 0);
    return s + deps - wds;
  }, 0);

  const investmentsByAccount = investmentAccounts.map((a) => ({
    nombre: a.nombre,
    tipo: a.tipo,
    color: a.color,
    saldo: a.saldoActual,
    moneda: a.moneda,
  }));

  // Daily spending trend (current month)
  const dailySpending: { day: string; total: number }[] = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTotal = currentMonthExpenses
      .filter((e) => new Date(e.fecha).getDate() === d)
      .reduce((s, e) => s + e.monto, 0);
    dailySpending.push({ day: String(d), total: dayTotal });
  }

  // Recent transactions (mixed income + expenses, last 8)
  const recentTransactions = [
    ...currentMonthExpenses.slice(0, 10).map((e) => ({
      id: e.id,
      tipo: "gasto" as const,
      monto: e.monto,
      categoria: e.category.nombre,
      color: e.category.color,
      fecha: e.fecha,
      descripcion: e.descripcion,
      familyMember: e.familyMember?.nombre || null,
    })),
    ...currentMonthIncomes.slice(0, 10).map((i) => ({
      id: i.id,
      tipo: "ingreso" as const,
      monto: i.monto,
      categoria: i.category.nombre,
      color: i.category.color,
      fecha: i.fecha,
      descripcion: i.descripcion,
      familyMember: null,
    })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);

  // === FINANCIAL HEALTH INDICATORS ===

  // Average expenses over previous months (exclude current)
  const prevMonthsExpenses = monthlyData.slice(0, -1).filter((m) => m.gastos > 0);
  const avgExpenses = prevMonthsExpenses.length > 0
    ? prevMonthsExpenses.reduce((s, m) => s + m.gastos, 0) / prevMonthsExpenses.length
    : 0;
  const avgIncomes = prevMonthsExpenses.length > 0
    ? prevMonthsExpenses.reduce((s, m) => s + m.ingresos, 0) / prevMonthsExpenses.length
    : 0;

  // Liquidity: income/expense ratio
  const liquidityRatio = totalExpenses > 0 ? totalIncome / totalExpenses : totalIncome > 0 ? 99 : 0;
  let liquidityLevel: string, liquidityLabel: string;
  if (liquidityRatio >= 1.5) { liquidityLevel = "excelente"; liquidityLabel = "Excelente"; }
  else if (liquidityRatio >= 1.2) { liquidityLevel = "buena"; liquidityLabel = "Buena"; }
  else if (liquidityRatio >= 1) { liquidityLevel = "normal"; liquidityLabel = "Ajustada"; }
  else if (liquidityRatio > 0) { liquidityLevel = "critica"; liquidityLabel = "Crítica"; }
  else { liquidityLevel = "normal"; liquidityLabel = "Sin datos"; }

  // Variable expenses vs average
  const varExpChange = avgExpenses > 0 ? ((totalExpenses - avgExpenses) / avgExpenses) * 100 : 0;
  let varExpLevel: string, varExpLabel: string;
  if (varExpChange > 20) { varExpLevel = "alto"; varExpLabel = "Más altos"; }
  else if (varExpChange > 5) { varExpLevel = "normal"; varExpLabel = "Levemente altos"; }
  else if (varExpChange >= -5) { varExpLevel = "buena"; varExpLabel = "Normal"; }
  else { varExpLevel = "bajo"; varExpLabel = "Más bajos"; }

  // Credit card spending vs average
  const ccExpenses = currentMonthExpenses.filter((e) => e.medioPago === "tarjeta_credito").reduce((s, e) => s + e.monto, 0);
  const prevCcExpenses: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const pm = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthCc = expenses
      .filter((e) => {
        const ed = new Date(e.fecha);
        return ed.getMonth() === pm.getMonth() && ed.getFullYear() === pm.getFullYear() && !e.tripId && e.medioPago === "tarjeta_credito";
      })
      .reduce((s, e) => s + e.monto, 0);
    if (monthCc > 0) prevCcExpenses.push(monthCc);
  }
  const avgCc = prevCcExpenses.length > 0 ? prevCcExpenses.reduce((s, v) => s + v, 0) / prevCcExpenses.length : 0;
  const ccChange = avgCc > 0 ? ((ccExpenses - avgCc) / avgCc) * 100 : 0;
  let ccLevel: string, ccLabel: string;
  if (ccChange > 15) { ccLevel = "por_encima"; ccLabel = "Por encima"; }
  else if (ccChange >= -15) { ccLevel = "normal"; ccLabel = "Normal"; }
  else { ccLevel = "por_debajo"; ccLabel = "Por debajo"; }

  // Savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  let savingsLevel: string, savingsLabel: string;
  if (savingsRate >= 30) { savingsLevel = "excelente"; savingsLabel = "Excelente"; }
  else if (savingsRate >= 15) { savingsLevel = "buena"; savingsLabel = "Buena"; }
  else if (savingsRate >= 5) { savingsLevel = "normal"; savingsLabel = "Baja"; }
  else if (savingsRate >= 0) { savingsLevel = "ajustada"; savingsLabel = "Muy baja"; }
  else { savingsLevel = "nula"; savingsLabel = "Negativa"; }

  const financialHealth = {
    liquidity: { level: liquidityLevel, label: liquidityLabel, ratio: liquidityRatio },
    variableExpenses: { level: varExpLevel, label: varExpLabel, changePercent: varExpChange },
    creditCards: { level: ccLevel, label: ccLabel, changePercent: ccChange },
    savingsRate: { level: savingsLevel, label: savingsLabel, rate: savingsRate },
  };

  return {
    monthlyData,
    currentMonth: {
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses,
      expenseChange: prevMonthExpenses > 0 ? ((totalExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0,
      incomeChange: prevMonthIncomes > 0 ? ((totalIncome - prevMonthIncomes) / prevMonthIncomes) * 100 : 0,
    },
    byCategory,
    incomeBySource,
    investments: {
      total: investmentTotal,
      deposited: investmentDeposits,
      gainLoss: investmentTotal - investmentDeposits,
      accounts: investmentsByAccount,
    },
    dailySpending,
    recentTransactions,
    financialHealth,
    monthName: now.toLocaleString("es-AR", { month: "long" }),
    year: now.getFullYear(),
  };
}
