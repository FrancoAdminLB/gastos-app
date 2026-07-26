"use client";

import { useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";
import { createBudget, deleteBudget } from "@/app/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Trash2, ChevronRight, Pencil, Check, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrency } from "@/lib/format";

interface CategoryChild {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  tipo: string;
  parentId: string | null;
  children?: CategoryChild[];
}

interface Category extends CategoryChild {
  children?: CategoryChild[];
}

interface Budget {
  id: string;
  montoLimite: number;
  periodo: string;
  category: { id: string; nombre: string } | null;
  trip: { nombre: string } | null;
}

export function CategoryManager({
  categories,
  budgets,
  isAdmin,
}: {
  categories: Category[];
  budgets: Budget[];
  isAdmin: boolean;
}) {
  const [catOpen, setCatOpen] = useState(false);
  const [catFormKey, setCatFormKey] = useState(0);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [parentForNew, setParentForNew] = useState<string | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);

  const incomeCategories = categories.filter((c) => c.tipo === "ingreso" && !c.parentId);
  const expenseCategories = categories.filter((c) => c.tipo !== "ingreso" && !c.parentId);

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (parentForNew) {
      formData.set("parentId", parentForNew);
    }
    try {
      await createCategory(formData);
      setCatOpen(false);
      setParentForNew(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createBudget(formData);
      setBudgetOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCatId) return;
    try {
      await deleteCategory(deleteCatId);
    } finally {
      setDeleteCatId(null);
    }
  }

  async function handleDeleteBudget() {
    if (!deleteBudgetId) return;
    try {
      await deleteBudget(deleteBudgetId);
    } finally {
      setDeleteBudgetId(null);
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    const formData = new FormData();
    formData.set("nombre", editingName.trim());
    try {
      await updateCategory(id, formData);
    } finally {
      setEditingId(null);
    }
  }

  function startEditing(cat: CategoryChild) {
    setEditingId(cat.id);
    setEditingName(cat.nombre);
  }

  function openNewSubcategory(parentId: string, parentTipo: string) {
    setParentForNew(parentId);
    setCatFormKey((k) => k + 1);
    setCatOpen(true);
  }

  function renderCategoryItem(cat: CategoryChild, level: number = 0) {
    const isEditing = editingId === cat.id;
    const children = cat.children || [];
    const indent = level * 16;

    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cat.color}20` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-8 rounded-lg text-sm bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(cat.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  className="p-1 rounded-lg text-[#4ADE80] hover:bg-[rgba(74,222,128,0.1)]"
                  onClick={() => handleRename(cat.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1 rounded-lg text-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.06)]"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-white">{cat.nombre}</p>
            )}
            {level === 0 && children.length > 0 && !isEditing && (
              <p className="text-xs text-[rgba(255,255,255,0.3)]">
                {children.length} subcategoria{children.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {isAdmin && !isEditing && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#7B61FF] hover:bg-[rgba(123,97,255,0.1)] transition-colors"
                onClick={() => startEditing(cat)}
                aria-label="Renombrar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {level < 2 && cat.tipo !== "ingreso" && (
                <button
                  className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#4ADE80] hover:bg-[rgba(74,222,128,0.1)] transition-colors"
                  onClick={() => openNewSubcategory(cat.id, cat.tipo)}
                  aria-label="Agregar subcategoría"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                onClick={() => setDeleteCatId(cat.id)}
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        {children.map((child) => renderCategoryItem(child, level + 1))}
      </div>
    );
  }

  // Find the tipo for the parent category when creating subcategory
  function getParentTipo(): string {
    if (!parentForNew) return "ambos";
    const findCat = (cats: Category[]): string => {
      for (const c of cats) {
        if (c.id === parentForNew) return c.tipo;
        if (c.children) {
          for (const child of c.children) {
            if (child.id === parentForNew) return child.tipo || c.tipo;
          }
        }
      }
      return "ambos";
    };
    return findCat(categories);
  }

  // All expense categories flat for budget selector
  const allExpenseCatsFlat: { id: string; nombre: string; depth: string }[] = [];
  function flattenCats(cats: CategoryChild[], prefix: string = "") {
    for (const c of cats) {
      allExpenseCatsFlat.push({ id: c.id, nombre: prefix + c.nombre, depth: prefix });
      if (c.children) flattenCats(c.children, prefix + "  ");
    }
  }
  flattenCats(expenseCategories);

  return (
    <div className="space-y-8">
      {/* Income Sources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Fuentes de Ingreso
          </h3>
          {isAdmin && (
            <Sheet open={catOpen && parentForNew === null && !parentForNew} onOpenChange={(open) => {
              if (!open) { setCatOpen(false); setParentForNew(null); }
            }}>
              <button
                className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                onClick={() => { setParentForNew(null); setCatFormKey((k) => k + 1); setCatOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva
              </button>
            </Sheet>
          )}
        </div>

        <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
          {incomeCategories.map((cat) => renderCategoryItem(cat))}
          {incomeCategories.length === 0 && (
            <p className="text-sm text-[rgba(255,255,255,0.4)] text-center py-6">
              No hay fuentes de ingreso
            </p>
          )}
        </div>
      </div>

      {/* Expense Categories (hierarchical) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Categorias de Egreso
          </h3>
          {isAdmin && (
            <button
              className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              onClick={() => { setParentForNew(null); setCatFormKey((k) => k + 1); setCatOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          )}
        </div>

        <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
          {expenseCategories.map((cat) => renderCategoryItem(cat))}
          {expenseCategories.length === 0 && (
            <p className="text-sm text-[rgba(255,255,255,0.4)] text-center py-6">
              No hay categorias
            </p>
          )}
        </div>
      </div>

      {/* Budgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            Presupuestos
          </h3>
          {isAdmin && (
            <Sheet open={budgetOpen} onOpenChange={setBudgetOpen}>
              <SheetTrigger render={<Button size="sm" variant="outline" className="rounded-lg h-8 text-xs border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)]" />}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nuevo
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
                <SheetHeader>
                  <SheetTitle className="text-lg text-white">Nuevo Presupuesto</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleCreateBudget} className="space-y-5 mt-4 px-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Categoria</Label>
                    <Select name="categoryId" defaultValue="">
                      <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                        <SelectValue placeholder="Total general" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                        <SelectItem value="">Total general</SelectItem>
                        {allExpenseCatsFlat.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Limite</Label>
                      <Input name="montoLimite" type="number" step="0.01" required className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white focus:border-[#7B61FF] focus:ring-[#7B61FF]/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Periodo</Label>
                      <Select name="periodo" defaultValue="mensual">
                        <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                          <SelectItem value="mensual">Mensual</SelectItem>
                          <SelectItem value="viaje">Por viaje</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity" disabled={loading}>
                    {loading ? "Creando..." : "Crear presupuesto"}
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
          {budgets.map((budget) => (
            <div key={budget.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {budget.category?.nombre || "Total general"}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.4)] capitalize">
                  {formatCurrency(budget.montoLimite)} &middot; {budget.periodo}
                </p>
              </div>
              {isAdmin && (
                <button
                  className="p-1.5 rounded-lg text-[rgba(255,255,255,0.3)] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                  onClick={() => setDeleteBudgetId(budget.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {budgets.length === 0 && (
            <p className="text-sm text-[rgba(255,255,255,0.4)] text-center py-6">
              Sin presupuestos configurados
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteCatId}
        onOpenChange={(o) => !o && setDeleteCatId(null)}
        onConfirm={handleDeleteCategory}
        title="Eliminar categoría"
        description="Se eliminará esta categoría y todas sus subcategorías."
      />

      <ConfirmDialog
        open={!!deleteBudgetId}
        onOpenChange={(o) => !o && setDeleteBudgetId(null)}
        onConfirm={handleDeleteBudget}
        title="Eliminar presupuesto"
        description="Se eliminará este presupuesto."
      />

      {/* Create Category Sheet */}
      <Sheet open={catOpen} onOpenChange={(open) => { setCatOpen(open); if (!open) setParentForNew(null); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">
              {parentForNew ? "Nueva Subcategoria" : "Nueva Categoria"}
            </SheetTitle>
          </SheetHeader>
          {parentForNew && (
            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1 px-1">
              Dentro de: {categories.flatMap(c => [c, ...(c.children || [])]).find(c => c.id === parentForNew)?.nombre}
            </p>
          )}
          <form key={catFormKey} onSubmit={handleCreateCategory} className="space-y-5 mt-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
              <Input name="nombre" placeholder="Ej: Electricidad" required className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.2)] focus:border-[#7B61FF] focus:ring-[#7B61FF]/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Color</Label>
                <Input name="color" type="color" defaultValue="#6B7280" className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Tipo</Label>
                <Select name="tipo" defaultValue={parentForNew ? getParentTipo() : "ambos"}>
                  <SelectTrigger className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
                    <SelectItem value="ambos">Ambos</SelectItem>
                    <SelectItem value="gasto_diario">Diario</SelectItem>
                    <SelectItem value="viaje">Viaje</SelectItem>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity" disabled={loading}>
              {loading ? "Creando..." : parentForNew ? "Crear subcategoria" : "Crear categoria"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
