"use client";

import { useState } from "react";
import {
  createInvestmentAccount,
  updateInvestmentAccount,
  deleteInvestmentAccount,
  addInvestmentMovement,
  deleteInvestmentMovement,
} from "@/app/actions/investments";
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
  Pencil,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Landmark,
  Bitcoin,
  Globe,
  Banknote,
  MoreHorizontal,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Movement {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string | null;
  fecha: Date;
}

interface Account {
  id: string;
  nombre: string;
  tipo: string;
  moneda: string;
  saldoActual: number;
  color: string;
  movimientos: Movement[];
}

const ACCOUNT_TYPES = [
  { value: "cripto", label: "Billetera Cripto", icon: Bitcoin },
  { value: "bolsa", label: "Sociedad de Bolsa", icon: Landmark },
  { value: "online", label: "Inversión Online", icon: Globe },
  { value: "banco", label: "Cuenta Bancaria", icon: Banknote },
  { value: "otro", label: "Otro", icon: MoreHorizontal },
];

function getTypeIcon(tipo: string) {
  const found = ACCOUNT_TYPES.find((t) => t.value === tipo);
  return found ? found.icon : MoreHorizontal;
}

function getTypeLabel(tipo: string) {
  return ACCOUNT_TYPES.find((t) => t.value === tipo)?.label || tipo;
}

export function InvestmentPortfolio({ accounts }: { accounts: Account[] }) {
  const [sheetMode, setSheetMode] = useState<"account" | "movement" | "adjust" | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [movementType, setMovementType] = useState("deposito");
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteMovementId, setDeleteMovementId] = useState<string | null>(null);

  const totalPortfolio = accounts.reduce((sum, a) => sum + a.saldoActual, 0);

  // Calculate total deposited vs current for gain/loss
  const totalDeposited = accounts.reduce((sum, a) => {
    const deposits = a.movimientos
      .filter((m) => m.tipo === "deposito")
      .reduce((s, m) => s + m.monto, 0);
    const withdrawals = a.movimientos
      .filter((m) => m.tipo === "retiro")
      .reduce((s, m) => s + m.monto, 0);
    return sum + deposits - withdrawals;
  }, 0);
  const gainLoss = totalPortfolio - totalDeposited;

  function openNewAccount() {
    setEditAccount(null);
    setSheetMode("account");
  }

  function openEditAccount(account: Account) {
    setEditAccount(account);
    setSheetMode("account");
  }

  function openMovement(account: Account, type: string) {
    setSelectedAccount(account);
    setMovementType(type);
    setSheetMode(type === "ajuste" ? "adjust" : "movement");
  }

  async function handleAccountSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editAccount) {
        await updateInvestmentAccount(editAccount.id, formData);
      } else {
        await createInvestmentAccount(formData);
      }
      setSheetMode(null);
      setEditAccount(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleMovementSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("accountId", selectedAccount!.id);
    formData.set("tipo", movementType);
    try {
      await addInvestmentMovement(formData);
      setSheetMode(null);
      setSelectedAccount(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("accountId", selectedAccount!.id);
    formData.set("tipo", "ajuste");
    try {
      await addInvestmentMovement(formData);
      setSheetMode(null);
      setSelectedAccount(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteAccountId) return;
    try {
      await deleteInvestmentAccount(deleteAccountId);
    } finally {
      setDeleteAccountId(null);
    }
  }

  async function handleDeleteMovement() {
    if (!deleteMovementId) return;
    try {
      await deleteInvestmentMovement(deleteMovementId);
    } finally {
      setDeleteMovementId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Portfolio summary */}
      <div className="rounded-2xl gradient-card glow-primary p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/70">Portfolio Total</p>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white/80" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalPortfolio)}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              {gainLoss >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-[#FF6B6B]" />
              )}
              <span className={`text-sm font-semibold ${gainLoss >= 0 ? "text-[#4ADE80]" : "text-[#FF6B6B]"}`}>
                {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss)}
              </span>
            </div>
            <span className="text-xs text-white/40">
              {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
          Cuentas de Inversión
        </h3>
        <button
          className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          onClick={openNewAccount}
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <Landmark className="h-7 w-7 text-[rgba(255,255,255,0.4)]" />
          </div>
          <div>
            <p className="font-medium text-white">Sin cuentas</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
              Crea tu primera cuenta de inversión
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const Icon = getTypeIcon(account.tipo);
            const isExpanded = expandedId === account.id;
            const deposits = account.movimientos
              .filter((m) => m.tipo === "deposito")
              .reduce((s, m) => s + m.monto, 0);
            const withdrawals = account.movimientos
              .filter((m) => m.tipo === "retiro")
              .reduce((s, m) => s + m.monto, 0);
            const netInvested = deposits - withdrawals;
            const accountGain = account.saldoActual - netInvested;
            const pctOfPortfolio = totalPortfolio > 0 ? (account.saldoActual / totalPortfolio) * 100 : 0;

            return (
              <div key={account.id} className="rounded-xl glass overflow-hidden">
                {/* Account header */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{account.nombre}</p>
                        <p className="text-base font-bold text-white tabular-nums">
                          {formatCurrency(account.saldoActual, account.moneda)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-[rgba(255,255,255,0.4)]">
                          {getTypeLabel(account.tipo)}
                        </p>
                        <div className="flex items-center gap-1">
                          {accountGain !== 0 && (
                            <span className={`text-xs font-medium ${accountGain >= 0 ? "text-[#4ADE80]" : "text-[#FF6B6B]"}`}>
                              {accountGain >= 0 ? "+" : ""}{formatCurrency(accountGain, account.moneda)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio percentage bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pctOfPortfolio}%`, backgroundColor: account.color }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg h-8 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#4ADE80] hover:bg-[rgba(74,222,128,0.1)] transition-colors"
                      onClick={() => openMovement(account, "deposito")}
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      Depositar
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg h-8 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                      onClick={() => openMovement(account, "retiro")}
                    >
                      <ArrowDownRight className="h-3 w-3" />
                      Retirar
                    </button>
                    <button
                      className="flex items-center justify-center gap-1.5 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#7B61FF] hover:bg-[rgba(123,97,255,0.1)] transition-colors"
                      onClick={() => openMovement(account, "ajuste")}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Ajustar
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#7B61FF] hover:bg-[rgba(123,97,255,0.1)] transition-colors"
                      onClick={() => openEditAccount(account)}
                      aria-label="Editar cuenta"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                      onClick={() => setDeleteAccountId(account.id)}
                      aria-label="Eliminar cuenta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable movements */}
                {account.movimientos.length > 0 && (
                  <>
                    <button
                      className="w-full flex items-center justify-center gap-1 py-2 text-xs text-[rgba(255,255,255,0.35)] hover:text-white border-t border-[rgba(255,255,255,0.06)] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : account.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Ocultar" : "Ver"} movimientos ({account.movimientos.length})
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.06)]">
                        {account.movimientos.map((mov) => (
                          <div key={mov.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              mov.tipo === "deposito"
                                ? "bg-[rgba(74,222,128,0.15)]"
                                : mov.tipo === "retiro"
                                ? "bg-[rgba(255,107,107,0.15)]"
                                : "bg-[rgba(123,97,255,0.15)]"
                            }`}>
                              {mov.tipo === "deposito" ? (
                                <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" />
                              ) : mov.tipo === "retiro" ? (
                                <ArrowDownRight className="h-3 w-3 text-[#FF6B6B]" />
                              ) : (
                                <RefreshCw className="h-3 w-3 text-[#7B61FF]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white">
                                {mov.tipo === "deposito" ? "Depósito" : mov.tipo === "retiro" ? "Retiro" : "Ajuste"}
                              </p>
                              <p className="text-[10px] text-[rgba(255,255,255,0.4)]">
                                {new Date(mov.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                                {mov.descripcion && ` · ${mov.descripcion}`}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${
                              mov.tipo === "retiro" ? "text-[#FF6B6B]" : mov.monto >= 0 ? "text-[#4ADE80]" : "text-[#FF6B6B]"
                            }`}>
                              {mov.tipo === "retiro" ? "-" : mov.monto >= 0 ? "+" : ""}
                              {formatCurrency(Math.abs(mov.monto), account.moneda)}
                            </span>
                            <button
                              className="p-1 rounded text-[rgba(255,255,255,0.2)] hover:text-[#FF6B6B] transition-colors"
                              onClick={() => setDeleteMovementId(mov.id)}
                              aria-label="Eliminar movimiento"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New/Edit Account Sheet */}
      <Sheet open={sheetMode === "account"} onOpenChange={(o) => { if (!o) { setSheetMode(null); setEditAccount(null); } }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">
              {editAccount ? "Editar Cuenta" : "Nueva Cuenta de Inversión"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4 mt-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
              <Input
                name="nombre"
                placeholder="Ej: Binance, Bull Market, Ualá"
                defaultValue={editAccount?.nombre}
                required
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Tipo</Label>
                <Select name="tipo" defaultValue={editAccount?.tipo || "otro"}>
                  <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Moneda</Label>
                <Select name="moneda" defaultValue={editAccount?.moneda || "ARS"}>
                  <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                    <SelectItem value="ARS" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">ARS</SelectItem>
                    <SelectItem value="USD" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">EUR</SelectItem>
                    <SelectItem value="USDT" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">USDT</SelectItem>
                    <SelectItem value="BTC" className="text-white focus:bg-[rgba(255,255,255,0.08)] focus:text-white">BTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editAccount && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Saldo Inicial</Label>
                <Input
                  name="saldoInicial"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Color</Label>
              <Input
                name="color"
                type="color"
                defaultValue={editAccount?.color || "#F59E0B"}
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Guardando..." : editAccount ? "Guardar cambios" : "Crear cuenta"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Deposit/Withdraw Sheet */}
      <Sheet open={sheetMode === "movement"} onOpenChange={(o) => { if (!o) { setSheetMode(null); setSelectedAccount(null); } }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">
              {movementType === "deposito" ? "Depositar fondos" : "Retirar fondos"}
              {selectedAccount && <span className="text-white/50 font-normal"> — {selectedAccount.nombre}</span>}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4 mt-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Monto</Label>
              <Input
                name="monto"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-lg placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Fecha</Label>
                <Input
                  name="fecha"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nota</Label>
                <Input
                  name="descripcion"
                  placeholder="Opcional"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
            </div>
            <Button
              type="submit"
              className={`w-full h-12 rounded-xl text-base font-medium border-0 hover:opacity-90 transition-opacity ${
                movementType === "deposito"
                  ? "bg-[#4ADE80] text-black hover:bg-[#4ADE80]"
                  : "bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]"
              }`}
              disabled={loading}
            >
              {loading ? "Procesando..." : movementType === "deposito" ? "Confirmar depósito" : "Confirmar retiro"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Adjust Balance Sheet */}
      <Sheet open={sheetMode === "adjust"} onOpenChange={(o) => { if (!o) { setSheetMode(null); setSelectedAccount(null); } }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">
              Ajustar saldo
              {selectedAccount && <span className="text-white/50 font-normal"> — {selectedAccount.nombre}</span>}
            </SheetTitle>
          </SheetHeader>
          {selectedAccount && (
            <form onSubmit={handleAdjustSubmit} className="space-y-4 mt-4 px-1">
              <div className="rounded-xl glass p-3">
                <p className="text-xs text-[rgba(255,255,255,0.4)]">Saldo actual</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(selectedAccount.saldoActual, selectedAccount.moneda)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nuevo saldo</Label>
                <Input
                  name="monto"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ingresa el saldo actual real"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white text-lg placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nota</Label>
                <Input
                  name="descripcion"
                  placeholder="Ej: Actualización por rendimiento"
                  className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-medium bg-[#7B61FF] text-white border-0 hover:bg-[#7B61FF] hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Actualizar saldo"}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteAccountId}
        onOpenChange={(o) => !o && setDeleteAccountId(null)}
        onConfirm={handleDeleteAccount}
        title="Eliminar cuenta"
        description="Se eliminará esta cuenta y todos sus movimientos."
      />

      <ConfirmDialog
        open={!!deleteMovementId}
        onOpenChange={(o) => !o && setDeleteMovementId(null)}
        onConfirm={handleDeleteMovement}
        title="Eliminar movimiento"
        description="Se revertirá el saldo de este movimiento."
      />
    </div>
  );
}
