"use client";

import { useState } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import { deleteIncome } from "@/app/actions/incomes";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "./income-form";
import {
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";

interface Movement {
  id: string;
  tipo: "ingreso" | "gasto";
  monto: number;
  moneda: string;
  fecha: Date;
  descripcion: string | null;
  categoria: string;
  color: string;
  categoryId: string;
  familyMember?: string | null;
  familyMemberId?: string | null;
  medioPago?: string | null;
  tripId?: string | null;
  creditCardId?: string | null;
}

interface CategoryChild {
  id: string;
  nombre: string;
  color: string;
}

interface Category {
  id: string;
  nombre: string;
  color: string;
  tipo: string;
  parentId: string | null;
  children?: CategoryChild[];
}

interface IncomeCategory {
  id: string;
  nombre: string;
  color: string;
}

interface Trip {
  id: string;
  nombre: string;
}

interface CreditCard {
  id: string;
  nombre: string;
  ultimos4: string | null;
  color: string;
}

interface FamilyMember {
  id: string;
  nombre: string;
  color: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  cheque: "Cheque",
  transferencia_bancaria: "Transferencia",
  cripto: "Cripto",
  tarjeta_credito: "T. Crédito",
};

type Period = "mes" | "trimestre" | "ano";

const PERIOD_LABELS: Record<Period, string> = {
  mes: "Este mes",
  trimestre: "Trimestre",
  ano: "Este año",
};

function filterByPeriod(movements: Movement[], period: Period): Movement[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return movements.filter((m) => {
    const d = new Date(m.fecha);
    if (period === "mes") {
      return d.getMonth() === month && d.getFullYear() === year;
    }
    if (period === "trimestre") {
      const qStart = new Date(year, Math.floor(month / 3) * 3, 1);
      const qEnd = new Date(year, Math.floor(month / 3) * 3 + 3, 0, 23, 59, 59);
      return d >= qStart && d <= qEnd;
    }
    // ano
    return d.getFullYear() === year;
  });
}

function getPeriodLabel(period: Period): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString("es-AR", { month: "long" });

  if (period === "mes") return `${monthName} ${year}`;
  if (period === "trimestre") {
    const q = Math.floor(month / 3) + 1;
    return `Q${q} ${year}`;
  }
  return `${year}`;
}

function generatePdfHtml(movements: Movement[], periodLabel: string): string {
  const totalIngresos = movements.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const totalEgresos = movements.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
  const balance = totalIngresos - totalEgresos;

  const rows = movements
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((m) => {
      const fecha = new Date(m.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const signo = m.tipo === "ingreso" ? "+" : "-";
      const color = m.tipo === "ingreso" ? "#16a34a" : "#dc2626";
      const medio = m.medioPago ? (PAYMENT_METHOD_LABELS[m.medioPago] || m.medioPago) : "-";
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">${fecha}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">${m.tipo === "ingreso" ? "Ingreso" : "Egreso"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">${m.categoria}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">${medio}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">${m.descripcion || "-"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:right;color:${color};font-weight:600">${signo} ${formatCurrency(m.monto, m.moneda)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Movimientos - ${periodLabel}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:40px;color:#1a1a1a}
  h1{font-size:20px;margin-bottom:4px}
  .sub{color:#666;font-size:13px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{text-align:left;padding:8px 10px;border-bottom:2px solid #333;font-size:12px;text-transform:uppercase;color:#666;letter-spacing:0.5px}
  th:last-child{text-align:right}
  .summary{display:flex;gap:32px;margin-bottom:24px}
  .summary-item{padding:12px 16px;border-radius:8px;background:#f5f5f5}
  .summary-item .label{font-size:11px;text-transform:uppercase;color:#666;letter-spacing:0.5px}
  .summary-item .value{font-size:18px;font-weight:700;margin-top:2px}
  .green{color:#16a34a}.red{color:#dc2626}
  @media print{body{margin:20px}@page{margin:15mm}}
</style></head><body>
<h1>Movimientos Financieros</h1>
<p class="sub">${periodLabel} &mdash; Generado el ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</p>
<div class="summary">
  <div class="summary-item"><div class="label">Ingresos</div><div class="value green">+${formatCurrency(totalIngresos)}</div></div>
  <div class="summary-item"><div class="label">Egresos</div><div class="value red">-${formatCurrency(totalEgresos)}</div></div>
  <div class="summary-item"><div class="label">Balance</div><div class="value ${balance >= 0 ? "green" : "red"}">${balance >= 0 ? "+" : ""}${formatCurrency(balance)}</div></div>
</div>
<table>
<thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Medio</th><th>Descripción</th><th>Monto</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="font-size:11px;color:#999;text-align:center">Total: ${movements.length} movimientos</p>
</body></html>`;
}

export function MovementsList({
  movements,
  expenseCategories,
  incomeCategories,
  trips,
  creditCards,
  familyMembers,
}: {
  movements: Movement[];
  expenseCategories?: Category[];
  incomeCategories?: IncomeCategory[];
  trips?: Trip[];
  creditCards?: CreditCard[];
  familyMembers?: FamilyMember[];
}) {
  const [period, setPeriod] = useState<Period>("mes");
  const [filter, setFilter] = useState<"todos" | "ingresos" | "egresos">("todos");
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const filtered = filterByPeriod(movements, period);
  const displayed = filter === "todos"
    ? filtered
    : filter === "ingresos"
    ? filtered.filter((m) => m.tipo === "ingreso")
    : filtered.filter((m) => m.tipo === "gasto");

  const totalIngresos = filtered.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const totalEgresos = filtered.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);

  const canEdit = !!expenseCategories && !!incomeCategories;

  async function handleDelete(e: React.MouseEvent, m: Movement) {
    e.stopPropagation();
    const label = m.tipo === "ingreso" ? "ingreso" : "gasto";
    if (!confirm(`Eliminar este ${label}?`)) return;
    if (m.tipo === "gasto") {
      await deleteExpense(m.id);
    } else {
      await deleteIncome(m.id);
    }
  }

  function exportPdf() {
    const html = generatePdfHtml(displayed, getPeriodLabel(period));
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div className="space-y-4">
      {/* Period selector + export */}
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="h-9 rounded-lg bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={exportPdf}
          aria-label="Exportar a PDF"
          className="h-10 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl glass p-3 text-center">
          <p className="text-[9px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Ingresos</p>
          <p className="text-sm font-bold text-[#4ADE80] tabular-nums mt-0.5">+{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="rounded-xl glass p-3 text-center">
          <p className="text-[9px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Egresos</p>
          <p className="text-sm font-bold text-[#FF6B6B] tabular-nums mt-0.5">-{formatCurrency(totalEgresos)}</p>
        </div>
        <div className="rounded-xl glass p-3 text-center">
          <p className="text-[9px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Balance</p>
          <p className={`text-sm font-bold tabular-nums mt-0.5 ${totalIngresos - totalEgresos >= 0 ? "text-[#4ADE80]" : "text-[#FF6B6B]"}`}>
            {totalIngresos - totalEgresos >= 0 ? "+" : ""}{formatCurrency(totalIngresos - totalEgresos)}
          </p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.06)]">
        {([["todos", "Todos"], ["ingresos", "Ingresos"], ["egresos", "Egresos"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key
                ? "bg-[rgba(123,97,255,0.2)] text-[#B4A0FF]"
                : "text-[rgba(255,255,255,0.4)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period label */}
      <p className="text-[10px] text-[rgba(255,255,255,0.5)] uppercase tracking-widest px-1">
        {getPeriodLabel(period)} &middot; {displayed.length} movimientos
      </p>

      {/* Movements list */}
      {displayed.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-[rgba(255,255,255,0.4)]">Sin movimientos en este período</p>
        </div>
      ) : (
        <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
          {displayed.map((m) => (
            <div
              key={`${m.tipo}-${m.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 ${canEdit ? "active:bg-[rgba(255,255,255,0.04)] cursor-pointer" : ""} transition-colors`}
              onClick={() => canEdit && setEditingMovement(m)}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${m.color}15` }}
              >
                {m.tipo === "ingreso" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" style={{ color: m.color }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {m.categoria}
                  {m.familyMember && (
                    <span className="text-[rgba(255,255,255,0.5)] font-normal text-xs"> · {m.familyMember}</span>
                  )}
                </p>
                <p className="text-[11px] text-[rgba(255,255,255,0.5)] truncate">
                  {new Date(m.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  {m.medioPago && ` · ${PAYMENT_METHOD_LABELS[m.medioPago] || m.medioPago}`}
                  {m.descripcion && ` — ${m.descripcion}`}
                </p>
              </div>

              {/* Amount + actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-sm font-semibold tabular-nums ${m.tipo === "ingreso" ? "text-[#4ADE80]" : "text-white"}`}>
                  {m.tipo === "ingreso" ? "+" : "-"}{formatCurrency(m.monto, m.moneda)}
                </span>
                {canEdit && (
                  <button
                    onClick={(e) => handleDelete(e, m)}
                    aria-label="Eliminar movimiento"
                    className="p-2 -mr-1 rounded-lg text-[rgba(255,255,255,0.3)] hover:text-[#FF6B6B] active:bg-[rgba(255,107,107,0.1)] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Sheet */}
      {canEdit && (
        <Sheet
          open={!!editingMovement}
          onOpenChange={(open) => !open && setEditingMovement(null)}
        >
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
            <SheetHeader>
              <SheetTitle className="text-lg text-white">
                {editingMovement?.tipo === "ingreso" ? "Editar Ingreso" : "Editar Gasto"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 px-1">
              {editingMovement?.tipo === "gasto" && expenseCategories && (
                <ExpenseForm
                  categories={expenseCategories}
                  trips={trips || []}
                  creditCards={creditCards}
                  familyMembers={familyMembers}
                  expense={{
                    id: editingMovement.id,
                    monto: editingMovement.monto,
                    moneda: editingMovement.moneda,
                    categoryId: editingMovement.categoryId,
                    tripId: editingMovement.tripId || null,
                    familyMemberId: editingMovement.familyMemberId || null,
                    creditCardId: editingMovement.creditCardId || null,
                    fecha: editingMovement.fecha,
                    descripcion: editingMovement.descripcion,
                    medioPago: editingMovement.medioPago || "efectivo",
                  }}
                  onSuccess={() => setEditingMovement(null)}
                />
              )}
              {editingMovement?.tipo === "ingreso" && incomeCategories && (
                <IncomeForm
                  categories={incomeCategories}
                  income={{
                    id: editingMovement.id,
                    monto: editingMovement.monto,
                    moneda: editingMovement.moneda,
                    categoryId: editingMovement.categoryId,
                    fecha: editingMovement.fecha,
                    descripcion: editingMovement.descripcion,
                    medioPago: editingMovement.medioPago || "efectivo",
                  }}
                  onSuccess={() => setEditingMovement(null)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
