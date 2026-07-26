"use client";

import { useState } from "react";
import {
  createFinancialEvent,
  deleteFinancialEvent,
} from "@/app/actions/financial-events";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  ChevronLeft,
  ChevronRight,
  Banknote,
  CreditCard,
  Zap,
  Car,
  FileText,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

interface FinancialEvent {
  id: string;
  nombre: string;
  tipo: string;
  dia: number;
  monto: number | null;
  recurrente: boolean;
  color: string;
  notas: string | null;
}

interface CreditCardData {
  id: string;
  nombre: string;
  diaCierre: number | null;
  diaVencimiento: number | null;
  color: string;
}

const EVENT_TYPES = [
  { value: "cobro", label: "Cobro / Ingreso", icon: Banknote, defaultColor: "#4ADE80" },
  { value: "vencimiento_tarjeta", label: "Vto. Tarjeta", icon: CreditCard, defaultColor: "#FF6B6B" },
  { value: "vencimiento_servicio", label: "Vto. Servicio", icon: Zap, defaultColor: "#FBBF24" },
  { value: "patente", label: "Patente", icon: Car, defaultColor: "#FB923C" },
  { value: "impuesto", label: "Impuesto", icon: FileText, defaultColor: "#F472B6" },
  { value: "otro", label: "Otro", icon: CalendarDays, defaultColor: "#60A5FA" },
];

function getEventIcon(tipo: string) {
  return EVENT_TYPES.find((t) => t.value === tipo)?.icon || CalendarDays;
}

export function FinancialCalendar({
  events,
  creditCards,
}: {
  events: FinancialEvent[];
  creditCards: CreditCardData[];
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Auto-generate credit card events
  const autoEvents: FinancialEvent[] = [];
  for (const card of creditCards) {
    if (card.diaCierre) {
      autoEvents.push({
        id: `cc-cierre-${card.id}`,
        nombre: `Cierre ${card.nombre}`,
        tipo: "vencimiento_tarjeta",
        dia: card.diaCierre,
        monto: null,
        recurrente: true,
        color: card.color,
        notas: null,
      });
    }
    if (card.diaVencimiento) {
      autoEvents.push({
        id: `cc-vto-${card.id}`,
        nombre: `Vto. ${card.nombre}`,
        tipo: "vencimiento_tarjeta",
        dia: card.diaVencimiento,
        monto: null,
        recurrente: true,
        color: "#FF6B6B",
        notas: null,
      });
    }
  }

  const allEvents = [...events, ...autoEvents];

  // Calendar data
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("es-AR", { month: "long" });

  const today = now.getDate();
  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();

  // Events for selected day
  const dayEvents = selectedDay ? allEvents.filter((e) => e.dia === selectedDay) : [];

  // Upcoming events (next 7 days)
  const upcomingEvents: (FinancialEvent & { daysUntil: number })[] = [];
  for (const ev of allEvents) {
    let eventDate = new Date(viewYear, viewMonth, ev.dia);
    if (eventDate < now) {
      eventDate = new Date(viewYear, viewMonth + 1, ev.dia);
    }
    const diffMs = eventDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) {
      upcomingEvents.push({ ...ev, daysUntil });
    }
  }
  upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
    setSelectedDay(null);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createFinancialEvent(formData);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId || deleteId.startsWith("cc-")) return;
    try {
      await deleteFinancialEvent(deleteId);
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
          Calendario Financiero
        </h3>
        <button
          className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          onClick={() => { setFormKey((k) => k + 1); setOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Evento
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl glass p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            className="p-1.5 rounded-lg text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            onClick={prevMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-white capitalize">
            {monthName} {viewYear}
          </p>
          <button
            className="p-1.5 rounded-lg text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            onClick={nextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-[rgba(255,255,255,0.3)] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvents = allEvents.some((e) => e.dia === day);
            const isToday = isCurrentMonth && day === today;
            const isSelected = selectedDay === day;
            const isPast = isCurrentMonth && day < today;
            const dayEvts = allEvents.filter((e) => e.dia === day);

            return (
              <button
                key={day}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-xs ${
                  isSelected
                    ? "bg-[#7B61FF] text-white font-bold"
                    : isToday
                    ? "bg-[rgba(123,97,255,0.2)] text-white font-semibold ring-1 ring-[#7B61FF]"
                    : isPast
                    ? "text-[rgba(255,255,255,0.25)]"
                    : "text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.06)]"
                }`}
                onClick={() => setSelectedDay(isSelected ? null : day)}
              >
                {day}
                {hasEvents && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayEvts.slice(0, 3).map((ev, j) => (
                      <div
                        key={j}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isSelected ? "white" : ev.color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && dayEvents.length > 0 && (
        <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
          {dayEvents.map((ev) => {
            const Icon = getEventIcon(ev.tipo);
            const isAuto = ev.id.startsWith("cc-");
            return (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${ev.color}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: ev.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{ev.nombre}</p>
                  {ev.notas && (
                    <p className="text-[10px] text-[rgba(255,255,255,0.4)]">{ev.notas}</p>
                  )}
                </div>
                {ev.monto && (
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {formatCurrency(ev.monto)}
                  </span>
                )}
                {!isAuto && (
                  <button
                    className="p-1 rounded text-[rgba(255,255,255,0.2)] hover:text-[#FF6B6B] transition-colors"
                    onClick={() => setDeleteId(ev.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && dayEvents.length === 0 && (
        <div className="rounded-xl glass p-4 text-center">
          <p className="text-xs text-[rgba(255,255,255,0.4)]">Sin eventos el día {selectedDay}</p>
        </div>
      )}

      {/* Upcoming alerts */}
      {upcomingEvents.length > 0 && !selectedDay && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <AlertCircle className="h-3 w-3 text-[#FBBF24]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
              Próximos 7 días
            </span>
          </div>
          <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
            {upcomingEvents.map((ev) => {
              const Icon = getEventIcon(ev.tipo);
              return (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${ev.color}20` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: ev.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">{ev.nombre}</p>
                    <p className="text-[10px] text-[rgba(255,255,255,0.4)]">
                      Día {ev.dia} · {ev.daysUntil === 0 ? "Hoy" : ev.daysUntil === 1 ? "Mañana" : `En ${ev.daysUntil} días`}
                    </p>
                  </div>
                  {ev.monto && (
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {formatCurrency(ev.monto)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Event Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">Nuevo Evento Financiero</SheetTitle>
          </SheetHeader>
          <form key={formKey} onSubmit={handleCreate} className="space-y-4 mt-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
              <Input
                name="nombre"
                placeholder="Ej: Vto. Edenor, Cobro sueldo, Patente auto"
                required
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Tipo</Label>
                <Select name="tipo" defaultValue="otro">
                  <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Día del mes</Label>
                <Input
                  name="dia"
                  type="number"
                  min="1"
                  max="31"
                  required
                  placeholder="15"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Monto (opcional)</Label>
                <Input
                  name="monto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Color</Label>
                <Input
                  name="color"
                  type="color"
                  defaultValue="#3B82F6"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Notas</Label>
              <Input
                name="notas"
                placeholder="Opcional"
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Creando..." : "Agregar evento"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar evento"
        description="Se eliminará este evento financiero."
      />
    </div>
  );
}
