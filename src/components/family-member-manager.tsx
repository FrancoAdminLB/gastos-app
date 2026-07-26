"use client";

import { useState } from "react";
import { createFamilyMember, updateFamilyMember, deleteFamilyMember } from "@/app/actions/family-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Trash2, Pencil, Check, X, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface FamilyMember {
  id: string;
  nombre: string;
  color: string;
}

export function FamilyMemberManager({
  members,
  isAdmin,
}: {
  members: FamilyMember[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createFamilyMember(formData);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    const formData = new FormData();
    formData.set("nombre", editingName.trim());
    try {
      await updateFamilyMember(id, formData);
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteFamilyMember(deleteId);
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
          Miembros de la Familia
        </h3>
        {isAdmin && (
          <button
            className="flex items-center gap-1 text-xs rounded-lg h-8 px-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </button>
        )}
      </div>

      <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
        {members.map((member) => {
          const isEditing = editingId === member.id;
          return (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${member.color}20` }}
              >
                <Users className="h-4 w-4" style={{ color: member.color }} />
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
                        if (e.key === "Enter") handleRename(member.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button className="p-1 rounded-lg text-[#4ADE80] hover:bg-[rgba(74,222,128,0.1)]" onClick={() => handleRename(member.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 rounded-lg text-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.06)]" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-white">{member.nombre}</p>
                )}
              </div>
              {isAdmin && !isEditing && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#7B61FF] hover:bg-[rgba(123,97,255,0.1)] transition-colors"
                    onClick={() => { setEditingId(member.id); setEditingName(member.nombre); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-[rgba(255,255,255,0.25)] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                    onClick={() => setDeleteId(member.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-[rgba(255,255,255,0.4)] text-center py-6">
            No hay miembros configurados
          </p>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0F1335] border-[rgba(255,255,255,0.1)]">
          <SheetHeader>
            <SheetTitle className="text-lg text-white">Nuevo Miembro</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="space-y-5 mt-4 px-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Nombre</Label>
                <Input
                  name="nombre"
                  placeholder="Ej: Papa"
                  required
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
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium gradient-card glow-primary border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Creando..." : "Agregar miembro"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar miembro"
        description="Se eliminará este miembro de la familia."
      />
    </div>
  );
}
