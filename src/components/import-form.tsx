"use client";

import { useState } from "react";
import { parseAndPreview, confirmImport } from "@/app/actions/import";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Check, Scan, AlertCircle } from "lucide-react";

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

interface PreviewData {
  monto: number;
  moneda: string;
  comercio: string;
  fecha: string;
  medioPago: "efectivo" | "cheque" | "transferencia_bancaria" | "cripto" | "tarjeta_credito";
  fuente: string;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  cheque: "Cheque",
  transferencia_bancaria: "Transferencia",
  cripto: "Cripto",
  tarjeta_credito: "Tarjeta de Crédito",
};

export function ImportForm({ categories }: { categories: Category[] }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editMonto, setEditMonto] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const router = useRouter();

  // Only top-level expense categories (filter out ingreso)
  const expenseCategories = categories.filter(
    (c) => c.tipo !== "ingreso" && !c.parentId
  );

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError(false);
    setPreview(null);
    setSaved(false);

    let result: PreviewData | null = null;
    try {
      result = await parseAndPreview(text.trim());
    } catch {
      setError(true);
      setLoading(false);
      return;
    }

    if (result) {
      setPreview(result);
      setEditMonto(result.monto.toString());
      setEditCategory(result.suggestedCategoryId || "");
    } else {
      setError(true);
    }
    setLoading(false);
  }

  async function handleConfirm() {
    if (!preview || !editCategory) return;
    setSaving(true);

    try {
      await confirmImport({
        monto: parseFloat(editMonto),
        moneda: preview.moneda,
        categoryId: editCategory,
        fecha: preview.fecha,
        descripcion: preview.comercio,
        medioPago: preview.medioPago,
      });

      setSaved(true);
      setText("");
      setPreview(null);

      setTimeout(() => {
        router.push("/movimientos");
      }, 1000);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Input area */}
      <div className="space-y-3">
        <div className="rounded-xl glass p-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(false);
              setSaved(false);
            }}
            placeholder={`Ejemplos:\n• Pagaste $1.500,00 en Carrefour con tu dinero en cuenta\n• Compra aprobada por $5.200 en RAPPI con tu Visa\n• VISA *4589 Compra $1.200,50 COTO CICSA`}
            rows={4}
            className="rounded-xl resize-none text-base border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none text-white placeholder:text-[rgba(255,255,255,0.25)]"
          />
        </div>

        <Button
          onClick={handleParse}
          className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
          disabled={!text.trim() || loading}
        >
          <Scan className="h-4 w-4 mr-2" />
          {loading ? "Analizando..." : "Analizar texto"}
        </Button>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] px-4 py-3">
            <AlertCircle className="h-4 w-4 text-[#FF6B6B] shrink-0" />
            <p className="text-sm text-[#FF6B6B]">
              No pude detectar un gasto en ese texto. Proba con otro formato.
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Gasto detectado
          </h3>

          <div className="rounded-xl glass p-4 space-y-4">
            {/* Source badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(123,97,255,0.15)] text-[#B4A0FF] font-medium capitalize">
                {preview.fuente}
              </span>
              <span className="text-xs text-[rgba(255,255,255,0.4)]">
                {PAYMENT_LABELS[preview.medioPago]}
              </span>
            </div>

            {/* Merchant */}
            <p className="font-medium text-white">{preview.comercio}</p>

            {/* Editable amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
                  Monto
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editMonto}
                  onChange={(e) => setEditMonto(e.target.value)}
                  className="h-12 rounded-xl text-lg font-bold tabular-nums bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
                  Moneda
                </Label>
                <Input
                  value={preview.moneda}
                  disabled
                  className="h-12 rounded-xl text-lg font-medium bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)]"
                />
              </div>
            </div>

            {/* Category selector - hierarchical */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
                Categoria
                {preview.suggestedCategoryName && (
                  <span className="normal-case tracking-normal font-normal text-[#B4A0FF] ml-1">
                    (sugerida: {preview.suggestedCategoryName})
                  </span>
                )}
              </Label>
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v ?? "")}>
                <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                  <SelectValue placeholder="Elegir categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)] max-h-72">
                  {expenseCategories.map((cat) => {
                    const children = cat.children || [];
                    if (children.length === 0) {
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            {cat.nombre}
                          </span>
                        </SelectItem>
                      );
                    }
                    return (
                      <SelectGroup key={cat.id}>
                        <SelectLabel className="text-[rgba(255,255,255,0.35)] text-xs px-2 py-1.5 font-semibold uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.nombre}
                        </SelectLabel>
                        <SelectItem value={cat.id}>
                          <span className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            {cat.nombre} (general)
                          </span>
                        </SelectItem>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            <span className="flex items-center gap-2.5 pl-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: child.color }} />
                              {child.nombre}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
            disabled={!editCategory || saving}
          >
            {saving ? (
              "Guardando..."
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Guardado
              </>
            ) : (
              "Confirmar gasto"
            )}
          </Button>
        </div>
      )}

      {/* Saved */}
      {saved && !preview && (
        <div className="flex items-center gap-2.5 rounded-xl bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-4 py-3">
          <Check className="h-4 w-4 text-[#4ADE80] shrink-0" />
          <p className="text-sm text-[#4ADE80]">
            Gasto guardado. Redirigiendo...
          </p>
        </div>
      )}
    </div>
  );
}
