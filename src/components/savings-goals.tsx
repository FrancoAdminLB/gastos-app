"use client";

import { useState } from "react";
import {
  createSavingsGoal,
  updateSavingsGoalAmount,
  deleteSavingsGoal,
} from "@/app/actions/savings-goals";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Target,
  Home,
  Car,
  Plane,
  GraduationCap,
  PiggyBank,
  Clock,
  CalendarClock,
  CalendarDays,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Goal {
  id: string;
  nombre: string;
  montoTarget: number;
  montoActual: number;
  moneda: string;
  plazo: string;
  fechaLimite: Date | null;
  color: string;
  icono: string;
}

const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  target: Target,
  home: Home,
  car: Car,
  plane: Plane,
  graduation: GraduationCap,
  piggy: PiggyBank,
};

const PLAZO_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  corto: { label: "Corto plazo", icon: Clock, color: "#4ADE80" },
  mediano: { label: "Mediano plazo", icon: CalendarClock, color: "#FBBF24" },
  largo: { label: "Largo plazo", icon: CalendarDays, color: "#7B61FF" },
};

export function SavingsGoals({ goals }: { goals: Goal[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const byPlazo = {
    corto: goals.filter((g) => g.plazo === "corto"),
    mediano: goals.filter((g) => g.plazo === "mediano"),
    largo: goals.filter((g) => g.plazo === "largo"),
  };

  // Group totals by currency to avoid mixing ARS + USD
  const currencies = [...new Set(goals.map((g) => g.moneda))];
  const totalsByCurrency = currencies.map((moneda) => {
    const filtered = goals.filter((g) => g.moneda === moneda);
    const target = filtered.reduce((s, g) => s + g.montoTarget, 0);
    const actual = filtered.reduce((s, g) => s + g.montoActual, 0);
    const pct = target > 0 ? (actual / target) * 100 : 0;
    return { moneda, target, actual, pct };
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createSavingsGoal(formData);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFunds(goal: Goal) {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await updateSavingsGoalAmount(goal.id, goal.montoActual + amount);
    } finally {
      setUpdatingId(null);
      setAddAmount("");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSavingsGoal(deleteId);
    } finally {
      setDeleteId(null);
    }
  }

  function daysRemaining(fecha: Date | null): string | null {
    if (!fecha) return null;
    const diff = new Date(fecha).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Vencido";
    if (days === 0) return "Hoy";
    if (days === 1) return "1 día";
    if (days < 30) return `${days} días`;
    if (days < 365) return `${Math.round(days / 30)} meses`;
    return `${(days / 365).toFixed(1)} años`;
  }

  function renderGoal(goal: Goal) {
    const Icon = ICONS[goal.icono] || Target;
    const pct = goal.montoTarget > 0 ? Math.min((goal.montoActual / goal.montoTarget) * 100, 100) : 0;
    const remaining = goal.montoTarget - goal.montoActual;
    const isComplete = goal.montoActual >= goal.montoTarget;
    const timeLeft = daysRemaining(goal.fechaLimite);

    return (
      <div key={goal.id} className="rounded-xl glass p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: goal.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                {goal.nombre}
                <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.45)]">
                  {goal.moneda}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded text-[rgba(255,255,255,0.2)] hover:text-[#FF6B6B] transition-colors"
                  aria-label="Eliminar objetivo"
                  onClick={() => setDeleteId(goal.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-white tabular-nums">
                  {formatCurrency(goal.montoActual, goal.moneda)}
                </span>
                <span className="text-[rgba(255,255,255,0.4)] tabular-nums">
                  {formatCurrency(goal.montoTarget, goal.moneda)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all relative"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: goal.color,
                  }}
                >
                  {pct > 8 && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white/90">
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {!isComplete && (
                  <span className="text-[10px] text-[rgba(255,255,255,0.4)]">
                    Faltan {formatCurrency(remaining, goal.moneda)}
                  </span>
                )}
                {isComplete && (
                  <span className="text-[10px] font-semibold text-[#4ADE80]">
                    Completado
                  </span>
                )}
              </div>
              {timeLeft && (
                <span className="text-[10px] text-[rgba(255,255,255,0.35)]">
                  {timeLeft}
                </span>
              )}
            </div>

            {/* Add funds */}
            {!isComplete && (
              <div className="mt-2.5">
                {updatingId === goal.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Monto"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="h-8 rounded-lg text-xs bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddFunds(goal);
                        if (e.key === "Escape") { setUpdatingId(null); setAddAmount(""); }
                      }}
                    />
                    <button
                      className="h-8 px-3 rounded-lg text-xs font-medium text-black bg-[#4ADE80] hover:bg-[#3bcc71] transition-colors"
                      onClick={() => handleAddFunds(goal)}
                    >
                      Ahorrar
                    </button>
                  </div>
                ) : (
                  <button
                    className="w-full h-8 rounded-lg text-xs font-medium border border-dashed border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.25)] transition-colors"
                    onClick={() => setUpdatingId(goal.id)}
                  >
                    + Agregar fondos
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
          Objetivos de Ahorro
        </h3>
        <button
          className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo
        </button>
      </div>

      {/* Overall progress per currency */}
      {goals.length > 0 && (
        <div className="rounded-xl glass p-4 space-y-3">
          {totalsByCurrency.map((t) => (
            <div key={t.moneda}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[rgba(255,255,255,0.5)]">
                  Progreso {t.moneda}
                </span>
                <span className="text-xs font-semibold text-white">{Math.round(t.pct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7B61FF] to-[#4ADE80] transition-all"
                  style={{ width: `${t.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[rgba(255,255,255,0.35)] tabular-nums">
                  {formatCurrency(t.actual, t.moneda)} ahorrado
                </span>
                <span className="text-[10px] text-[rgba(255,255,255,0.35)] tabular-nums">
                  Meta: {formatCurrency(t.target, t.moneda)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals by plazo */}
      {(["corto", "mediano", "largo"] as const).map((plazo) => {
        const list = byPlazo[plazo];
        if (list.length === 0) return null;
        const cfg = PLAZO_CONFIG[plazo];
        const PlazoIcon = cfg.icon;
        return (
          <div key={plazo} className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <PlazoIcon className="h-3 w-3" style={{ color: cfg.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            {list.map(renderGoal)}
          </div>
        );
      })}

      {goals.length === 0 && (
        <div className="text-center py-8 space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl glass flex items-center justify-center">
            <Target className="h-5 w-5 text-[rgba(255,255,255,0.4)]" />
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.4)]">
            Crea tu primer objetivo de ahorro
          </p>
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">Nuevo Objetivo de Ahorro</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
              <Input
                name="nombre"
                placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia"
                required
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Moneda</Label>
              <Select name="moneda" defaultValue="ARS">
                <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                  <SelectItem value="ARS" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">$ Pesos Argentinos (ARS)</SelectItem>
                  <SelectItem value="USD" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">US$ Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Meta</Label>
                <Input
                  name="montoTarget"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="100000"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Ya ahorrado</Label>
                <Input
                  name="montoActual"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Plazo</Label>
                <Select name="plazo" defaultValue="mediano">
                  <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                    <SelectItem value="corto" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Corto plazo</SelectItem>
                    <SelectItem value="mediano" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Mediano plazo</SelectItem>
                    <SelectItem value="largo" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Largo plazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Fecha límite</Label>
                <Input
                  name="fechaLimite"
                  type="date"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Ícono</Label>
                <Select name="icono" defaultValue="target">
                  <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                    <SelectItem value="target" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Meta</SelectItem>
                    <SelectItem value="home" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Casa</SelectItem>
                    <SelectItem value="car" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Auto</SelectItem>
                    <SelectItem value="plane" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Viaje</SelectItem>
                    <SelectItem value="graduation" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Educación</SelectItem>
                    <SelectItem value="piggy" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Color</Label>
                <Input
                  name="color"
                  type="color"
                  defaultValue="#7B61FF"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear objetivo"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar objetivo"
        description="Se eliminará este objetivo de ahorro."
      />
    </div>
  );
}
