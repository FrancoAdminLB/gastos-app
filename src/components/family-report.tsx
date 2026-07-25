"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Users, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Expense {
  id: string;
  monto: number;
  moneda: string;
  fecha: Date;
  descripcion: string | null;
  category: { nombre: string; color: string };
  familyMember?: { id: string; nombre: string; color: string } | null;
}

interface FamilyMember {
  id: string;
  nombre: string;
  color: string;
}

export function FamilyReport({
  expenses,
  familyMembers,
}: {
  expenses: Expense[];
  familyMembers: FamilyMember[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  if (familyMembers.length === 0) return null;

  // Group expenses by family member
  const byMember = new Map<string, { member: FamilyMember; expenses: Expense[]; total: number }>();

  // Initialize all members
  for (const m of familyMembers) {
    byMember.set(m.id, { member: m, expenses: [], total: 0 });
  }

  // Also track unassigned
  const unassigned: Expense[] = [];
  let unassignedTotal = 0;

  for (const exp of expenses) {
    if (exp.familyMember?.id && byMember.has(exp.familyMember.id)) {
      const entry = byMember.get(exp.familyMember.id)!;
      entry.expenses.push(exp);
      entry.total += exp.monto;
    } else {
      unassigned.push(exp);
      unassignedTotal += exp.monto;
    }
  }

  const memberData = Array.from(byMember.values()).filter((d) => d.expenses.length > 0);

  if (memberData.length === 0) return null;

  function generateReportText(member: FamilyMember, memberExpenses: Expense[], total: number): string {
    const now = new Date();
    const monthName = now.toLocaleString("es-AR", { month: "long", year: "numeric" });

    let text = `Reporte de gastos - ${member.nombre}\n`;
    text += `${monthName}\n`;
    text += `${"─".repeat(30)}\n\n`;

    // Group by category
    const byCat = new Map<string, { nombre: string; items: { desc: string; monto: number; fecha: string }[]; total: number }>();
    for (const exp of memberExpenses) {
      const catName = exp.category.nombre;
      if (!byCat.has(catName)) {
        byCat.set(catName, { nombre: catName, items: [], total: 0 });
      }
      const entry = byCat.get(catName)!;
      entry.items.push({
        desc: exp.descripcion || "Sin detalle",
        monto: exp.monto,
        fecha: new Date(exp.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
      });
      entry.total += exp.monto;
    }

    for (const [, cat] of byCat) {
      text += `${cat.nombre}: ${formatCurrency(cat.total)}\n`;
      for (const item of cat.items) {
        text += `  • ${item.fecha} - ${item.desc}: ${formatCurrency(item.monto)}\n`;
      }
      text += `\n`;
    }

    text += `${"─".repeat(30)}\n`;
    text += `TOTAL: ${formatCurrency(total)}\n`;

    return text;
  }

  async function handleShare(member: FamilyMember, memberExpenses: Expense[], total: number) {
    const text = generateReportText(member, memberExpenses, total);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Gastos de ${member.nombre}`,
          text,
        });
        return;
      } catch {
        // User cancelled or share not available
      }
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(text);
    setCopied(member.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
        Gastos por miembro
      </h3>

      <div className="space-y-3">
        {memberData.map(({ member, expenses: memberExpenses, total }) => {
          const isCopied = copied === member.id;
          return (
            <div key={member.id} className="rounded-xl glass p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${member.color}20` }}
                  >
                    <Users className="h-4 w-4" style={{ color: member.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.nombre}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.4)]">
                      {memberExpenses.length} gasto{memberExpenses.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white tabular-nums">
                    {formatCurrency(total)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
                    onClick={() => handleShare(member, memberExpenses, total)}
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Share2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Top categories for this member */}
              <div className="space-y-1.5">
                {(() => {
                  const cats = new Map<string, { nombre: string; color: string; total: number }>();
                  for (const exp of memberExpenses) {
                    const existing = cats.get(exp.category.nombre);
                    if (existing) { existing.total += exp.monto; }
                    else { cats.set(exp.category.nombre, { nombre: exp.category.nombre, color: exp.category.color, total: exp.monto }); }
                  }
                  return Array.from(cats.values()).sort((a, b) => b.total - a.total).slice(0, 3).map((cat) => (
                    <div key={cat.nombre} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.5)]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.nombre}
                      </span>
                      <span className="text-white font-medium tabular-nums">{formatCurrency(cat.total)}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
