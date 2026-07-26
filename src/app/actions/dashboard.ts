"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

function getBillingPeriod(diaCierre: number, now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // If we're past the closing day, current period started this month
  // If we're before/on closing day, current period started last month
  let periodStart: Date;
  let periodEnd: Date;
  let prevPeriodStart: Date;

  if (day > diaCierre) {
    // Current period: diaCierre+1 of this month → diaCierre of next month
    periodStart = new Date(year, month, diaCierre + 1);
    periodEnd = new Date(year, month + 1, diaCierre, 23, 59, 59);
    prevPeriodStart = new Date(year, month - 1, diaCierre + 1);
  } else {
    // Current period: diaCierre+1 of last month → diaCierre of this month
    periodStart = new Date(year, month - 1, diaCierre + 1);
    periodEnd = new Date(year, month, diaCierre, 23, 59, 59);
    prevPeriodStart = new Date(year, month - 2, diaCierre + 1);
  }

  return { periodStart, periodEnd, prevPeriodStart, prevPeriodEnd: new Date(periodStart.getTime() - 1) };
}

function getNextDueDate(diaCierre: number, diaVencimiento: number, now: Date): Date {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // The due date is for the LAST closed period
  // If cierre=23 and vencimiento=4:
  //   - Period closes on the 23rd
  //   - Payment is due on the 4th of the NEXT month after closing

  if (diaVencimiento > diaCierre) {
    // Due date is in the same month as closing
    if (day > diaCierre) {
      // Period just closed this month, due this month
      const dueDate = new Date(year, month, diaVencimiento);
      return dueDate >= now ? dueDate : new Date(year, month + 1, diaVencimiento);
    } else {
      // Period closed last month, due this month
      const dueDate = new Date(year, month, diaVencimiento);
      return dueDate >= now ? dueDate : new Date(year, month + 1, diaVencimiento);
    }
  } else {
    // Due date is in the month AFTER closing (most common: cierre 23, vto 4)
    if (day > diaCierre) {
      // Period just closed this month, due next month
      return new Date(year, month + 1, diaVencimiento);
    } else {
      // Period closed last month, due this month
      const dueDate = new Date(year, month, diaVencimiento);
      return dueDate >= now ? dueDate : new Date(year, month + 1, diaVencimiento);
    }
  }
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const userFilter = { userId: user.id };

  const [expenses, incomes, investmentAccounts, creditCards] = await Promise.all([
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
        creditCardId: true,
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
    prisma.creditCard.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        nombre: true,
        ultimos4: true,
        diaCierre: true,
        diaVencimiento: true,
        color: true,
      },
    }),
  ]);

  // === CREDIT CARD DEBT CALCULATION ===
  const ccExpensesAll = expenses.filter((e) => e.medioPago === "tarjeta_credito" && !e.tripId);

  const creditCardDebt: {
    cardId: string;
    nombre: string;
    ultimos4: string | null;
    color: string;
    periodoActual: number;
    proximoPago: number;
    proximoVencimiento: string | null;
    total: number;
  }[] = [];

  let totalCcDebt = 0;

  for (const card of creditCards) {
    const cardExpenses = ccExpensesAll.filter((e) => e.creditCardId === card.id);

    if (card.diaCierre) {
      const { periodStart, prevPeriodStart, prevPeriodEnd } = getBillingPeriod(card.diaCierre, now);

      // Current open period (not yet closed)
      const periodoActual = cardExpenses
        .filter((e) => new Date(e.fecha) >= periodStart)
        .reduce((s, e) => s + e.monto, 0);

      // Last closed period (closed, due on vencimiento)
      const proximoPago = cardExpenses
        .filter((e) => {
          const d = new Date(e.fecha);
          return d >= prevPeriodStart && d <= prevPeriodEnd;
        })
        .reduce((s, e) => s + e.monto, 0);

      const proximoVencimiento = card.diaVencimiento
        ? getNextDueDate(card.diaCierre, card.diaVencimiento, now).toISOString()
        : null;

      const total = periodoActual + proximoPago;
      totalCcDebt += total;

      creditCardDebt.push({
        cardId: card.id,
        nombre: card.nombre,
        ultimos4: card.ultimos4,
        color: card.color,
        periodoActual: Math.round(periodoActual * 100) / 100,
        proximoPago: Math.round(proximoPago * 100) / 100,
        proximoVencimiento,
        total: Math.round(total * 100) / 100,
      });
    } else {
      // Card without billing dates — just sum all current month CC expenses
      const total = cardExpenses
        .filter((e) => {
          const d = new Date(e.fecha);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, e) => s + e.monto, 0);

      totalCcDebt += total;

      creditCardDebt.push({
        cardId: card.id,
        nombre: card.nombre,
        ultimos4: card.ultimos4,
        color: card.color,
        periodoActual: Math.round(total * 100) / 100,
        proximoPago: 0,
        proximoVencimiento: null,
        total: Math.round(total * 100) / 100,
      });
    }
  }

  // Also sum CC expenses without a specific card assigned
  const unassignedCc = ccExpensesAll
    .filter((e) => !e.creditCardId)
    .filter((e) => {
      const d = new Date(e.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.monto, 0);
  totalCcDebt += unassignedCc;

  // Monthly breakdown (6 months) — EXCLUDE CC expenses from gastos/ahorro
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
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear() && !e.tripId && e.medioPago !== "tarjeta_credito";
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

  // Current month — EXCLUDE CC from cash expenses
  const currentMonthExpenses = expenses.filter((e) => {
    const ed = new Date(e.fecha);
    return ed.getMonth() === now.getMonth() && ed.getFullYear() === now.getFullYear() && !e.tripId;
  });
  const currentMonthCashExpenses = currentMonthExpenses.filter((e) => e.medioPago !== "tarjeta_credito");
  const currentMonthIncomes = incomes.filter((inc) => {
    const id = new Date(inc.fecha);
    return id.getMonth() === now.getMonth() && id.getFullYear() === now.getFullYear();
  });

  const totalCashExpenses = currentMonthCashExpenses.reduce((s, e) => s + e.monto, 0);
  const totalAllExpenses = currentMonthExpenses.reduce((s, e) => s + e.monto, 0);
  const totalIncome = currentMonthIncomes.reduce((s, i) => s + i.monto, 0);

  // Previous month for comparison (cash only)
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthCashExpenses = expenses
    .filter((e) => {
      const ed = new Date(e.fecha);
      return ed.getMonth() === prevMonth.getMonth() && ed.getFullYear() === prevMonth.getFullYear() && !e.tripId && e.medioPago !== "tarjeta_credito";
    })
    .reduce((s, e) => s + e.monto, 0);
  const prevMonthIncomes = incomes
    .filter((inc) => {
      const id = new Date(inc.fecha);
      return id.getMonth() === prevMonth.getMonth() && id.getFullYear() === prevMonth.getFullYear();
    })
    .reduce((s, inc) => s + inc.monto, 0);

  // Category breakdown (current month) — ALL expenses including CC (tracks spending)
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

  // Daily spending trend (current month — cash only, excludes CC)
  const dailySpending: { day: string; total: number }[] = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTotal = currentMonthCashExpenses
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
  const prevMonthsExpenses = monthlyData.slice(0, -1).filter((m) => m.gastos > 0);
  const avgExpenses = prevMonthsExpenses.length > 0
    ? prevMonthsExpenses.reduce((s, m) => s + m.gastos, 0) / prevMonthsExpenses.length
    : 0;

  // Liquidity: income/cash-expense ratio
  const liquidityRatio = totalCashExpenses > 0 ? totalIncome / totalCashExpenses : totalIncome > 0 ? 99 : 0;
  let liquidityLevel: string, liquidityLabel: string;
  if (liquidityRatio >= 1.5) { liquidityLevel = "excelente"; liquidityLabel = "Excelente"; }
  else if (liquidityRatio >= 1.2) { liquidityLevel = "buena"; liquidityLabel = "Buena"; }
  else if (liquidityRatio >= 1) { liquidityLevel = "normal"; liquidityLabel = "Ajustada"; }
  else if (liquidityRatio > 0) { liquidityLevel = "critica"; liquidityLabel = "Crítica"; }
  else { liquidityLevel = "normal"; liquidityLabel = "Sin datos"; }

  // Variable expenses vs average
  const varExpChange = avgExpenses > 0 ? ((totalCashExpenses - avgExpenses) / avgExpenses) * 100 : 0;
  let varExpLevel: string, varExpLabel: string;
  if (varExpChange > 20) { varExpLevel = "alto"; varExpLabel = "Más altos"; }
  else if (varExpChange > 5) { varExpLevel = "normal"; varExpLabel = "Levemente altos"; }
  else if (varExpChange >= -5) { varExpLevel = "buena"; varExpLabel = "Normal"; }
  else { varExpLevel = "bajo"; varExpLabel = "Más bajos"; }

  // Credit card spending vs average
  const ccExpensesMonth = currentMonthExpenses.filter((e) => e.medioPago === "tarjeta_credito").reduce((s, e) => s + e.monto, 0);
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
  const ccChange = avgCc > 0 ? ((ccExpensesMonth - avgCc) / avgCc) * 100 : 0;
  let ccLevel: string, ccLabel: string;
  if (ccChange > 15) { ccLevel = "por_encima"; ccLabel = "Por encima"; }
  else if (ccChange >= -15) { ccLevel = "normal"; ccLabel = "Normal"; }
  else { ccLevel = "por_debajo"; ccLabel = "Por debajo"; }

  // Savings rate (based on cash flow)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalCashExpenses) / totalIncome) * 100 : 0;
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
      totalExpenses: totalCashExpenses,
      totalAllExpenses: totalAllExpenses,
      totalIncome,
      balance: totalIncome - totalCashExpenses,
      expenseChange: prevMonthCashExpenses > 0 ? ((totalCashExpenses - prevMonthCashExpenses) / prevMonthCashExpenses) * 100 : 0,
      incomeChange: prevMonthIncomes > 0 ? ((totalIncome - prevMonthIncomes) / prevMonthIncomes) * 100 : 0,
    },
    creditCardDebt: {
      total: Math.round(totalCcDebt * 100) / 100,
      unassigned: Math.round(unassignedCc * 100) / 100,
      cards: creditCardDebt,
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
