/**
 * ADMIN · Dish Library — full CRUD via DishService (OP-001 / Carril A1).
 * Capability: dishes.read / dishes.create / dishes.update / dishes.archive / dishes.restore
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Archive, RotateCcw, Clock, Flame, Scale } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { DishService } from "@/services/dish-service";
import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";
import { AdminHeader, DataTable, PanelCard, SectionTitle, StatusChip } from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dishes")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "dishes.read");
  },
  component: AdminDishesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Dish Library" },
      {
        name: "description",
        content: "Catálogo de platos del tenant — alta, edición, archivo y activación operativa.",
      },
    ],
  }),
});

const EU_ALLERGENS = [
  { id: "gluten", label: "Gluten" },
  { id: "crustaceans", label: "Crustáceos" },
  { id: "eggs", label: "Huevos" },
  { id: "fish", label: "Pescado" },
  { id: "peanuts", label: "Cacahuetes" },
  { id: "soy", label: "Soja" },
  { id: "milk", label: "Lácteos" },
  { id: "nuts", label: "Frutos de cáscara" },
  { id: "celery", label: "Apio" },
  { id: "mustard", label: "Mostaza" },
  { id: "sesame", label: "Sésamo" },
  { id: "sulphites", label: "Sulfitos" },
  { id: "lupin", label: "Altramuces" },
  { id: "molluscs", label: "Moluscos" },
] as const;

type CreateFormState = {
  name: string;
  description: string;
  price: string;
  cost: string;
  kcal: string;
  weightG: string;
  prepMinutes: string;
  prepInstructions: string;
  protein: string;
  carbs: string;
  fat: string;
  allergens: string[];
};

const emptyCreateForm: CreateFormState = {
  name: "",
  description: "",
  price: "",
  cost: "",
  kcal: "",
  weightG: "",
  prepMinutes: "",
  prepInstructions: "",
  protein: "",
  carbs: "",
  fat: "",
  allergens: [],
};

type EditDishFormState = {
  name: string;
  description: string;
  price: string;
  cost: string;
  kcal: string;
  weightG: string;
  prepMinutes: string;
  prepInstructions: string;
  status: "draft" | "active" | "archived";
  protein: string;
  carbs: string;
  fat: string;
  allergens: string[];
};

function dishRowToEditForm(d: DishRow): EditDishFormState {
  const macros =
    d.macros && typeof d.macros === "object" ? (d.macros as Record<string, unknown>) : {};
  return {
    name: d.name,
    description: d.description ?? "",
    price: d.price != null ? String(d.price) : "0",
    cost: d.cost != null ? String(d.cost) : "0",
    kcal: d.kcal != null ? String(d.kcal) : "",
    weightG: d.weight_g != null ? String(d.weight_g) : "",
    prepMinutes: d.prep_minutes != null ? String(d.prep_minutes) : "",
    prepInstructions: d.prep_instructions ?? "",
    status: (d.status as "draft" | "active" | "archived") || "active",
    protein: macros.protein != null ? String(macros.protein) : "",
    carbs: macros.carbs != null ? String(macros.carbs) : "",
    fat: macros.fat != null ? String(macros.fat) : "",
    allergens: Array.isArray(d.allergens) ? d.allergens : [],
  };
}

function AdminDishesPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [activeRows, setActiveRows] = useState<DishRow[]>([]);
  const [archivedRows, setArchivedRows] = useState<DishRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [editingDish, setEditingDish] = useState<DishRow | null>(null);
  const [editForm, setEditForm] = useState<EditDishFormState | null>(null);
  const [archivingDish, setArchivingDish] = useState<DishRow | null>(null);
  const [restoringDish, setRestoringDish] = useState<DishRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const [actives, archived] = await Promise.all([
        DishService.list(ctx),
        DishService.listArchived(ctx),
      ]);
      setActiveRows(actives);
      setArchivedRows(archived);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const macros: Record<string, number> = {};
      if (createForm.protein) macros.protein = Number(createForm.protein);
      if (createForm.carbs) macros.carbs = Number(createForm.carbs);
      if (createForm.fat) macros.fat = Number(createForm.fat);

      await DishService.create(ctx, {
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        price: createForm.price ? Number(createForm.price) : 0,
        cost: createForm.cost ? Number(createForm.cost) : 0,
        kcal: createForm.kcal ? Number(createForm.kcal) : null,
        weightG: createForm.weightG ? Number(createForm.weightG) : null,
        prepMinutes: createForm.prepMinutes ? Number(createForm.prepMinutes) : null,
        prepInstructions: createForm.prepInstructions.trim() || null,
        macros,
        allergens: createForm.allergens,
        status: "active",
      });
      setCreateForm(emptyCreateForm);
      setShowForm(false);
      await reload();
      toast.success("Plato creado y activo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(dish: DishRow) {
    setEditingDish(dish);
    setEditForm(dishRowToEditForm(dish));
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId || !editingDish || !editForm) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const macros: Record<string, number> = {};
      if (editForm.protein) macros.protein = Number(editForm.protein);
      if (editForm.carbs) macros.carbs = Number(editForm.carbs);
      if (editForm.fat) macros.fat = Number(editForm.fat);

      await DishService.update(ctx, editingDish.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: editForm.price ? Number(editForm.price) : 0,
        cost: editForm.cost ? Number(editForm.cost) : 0,
        kcal: editForm.kcal ? Number(editForm.kcal) : null,
        weightG: editForm.weightG ? Number(editForm.weightG) : null,
        prepMinutes: editForm.prepMinutes ? Number(editForm.prepMinutes) : null,
        prepInstructions: editForm.prepInstructions.trim() || null,
        status: editForm.status,
        macros,
        allergens: editForm.allergens,
      });

      toast.success(`Plato "${editForm.name}" actualizado`);
      setEditingDish(null);
      setEditForm(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: string) {
    if (!user || !tenantId) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await DishService.update(ctx, id, { status: "active" });
      await reload();
      toast.success("Plato activado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmArchive() {
    if (!user || !tenantId || !archivingDish) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await DishService.archive(ctx, archivingDish.id);
      toast.success(`Plato "${archivingDish.name}" archivado`);
      setArchivingDish(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRestore() {
    if (!user || !tenantId || !restoringDish) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await DishService.restore(ctx, restoringDish.id);
      toast.success(`Plato "${restoringDish.name}" restaurado como borrador`);
      setRestoringDish(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleAllergen(formType: "create" | "edit", allergenId: string) {
    if (formType === "create") {
      setCreateForm((f) => ({
        ...f,
        allergens: f.allergens.includes(allergenId)
          ? f.allergens.filter((a) => a !== allergenId)
          : [...f.allergens, allergenId],
      }));
    } else if (editForm) {
      setEditForm((f) =>
        f
          ? {
              ...f,
              allergens: f.allergens.includes(allergenId)
                ? f.allergens.filter((a) => a !== allergenId)
                : [...f.allergens, allergenId],
            }
          : null,
      );
    }
  }

  const activeColumns: Column<DishRow>[] = [
    {
      key: "name",
      header: "Plato",
      render: (r) => (
        <div className="space-y-1">
          <p className="font-semibold">{r.name}</p>
          {r.description ? (
            <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {r.kcal != null ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Flame className="size-3 text-amber-500" />
                {r.kcal} kcal
              </span>
            ) : null}
            {r.weight_g != null ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Scale className="size-3 text-blue-500" />
                {r.weight_g} g
              </span>
            ) : null}
            {r.prep_minutes != null ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Clock className="size-3 text-emerald-500" />
                {r.prep_minutes} min
              </span>
            ) : null}
            {Array.isArray(r.allergens) && r.allergens.length > 0 ? (
              <div className="flex flex-wrap gap-1 ml-1">
                {r.allergens.map((a) => (
                  <Badge key={a} variant="outline" className="text-[10px] py-0 px-1 font-normal">
                    {EU_ALLERGENS.find((ea) => ea.id === a)?.label ?? a}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => (
        <StatusChip
          tone={r.status === "active" ? "positive" : r.status === "draft" ? "neutral" : "warning"}
          label={r.status}
        />
      ),
    },
    {
      key: "price",
      header: "Precio",
      render: (r) => (
        <span className="tabular-nums text-sm font-medium">
          {Number(r.price ?? 0).toFixed(2)} €
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {can("dishes.update") ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => startEdit(r)}
              className="h-8 px-2.5 text-xs"
            >
              <Pencil className="size-3.5 mr-1" />
              Editar
            </Button>
          ) : null}

          {r.status !== "active" && can("dishes.update") ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => activate(r.id)}
              disabled={busy}
              className="h-8 px-2.5 text-xs"
            >
              Activar
            </Button>
          ) : null}

          {can("dishes.archive") ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setArchivingDish(r)}
              disabled={busy}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              title="Archivar plato"
            >
              <Archive className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const archivedColumns: Column<DishRow>[] = [
    {
      key: "name",
      header: "Plato Archivado",
      render: (r) => (
        <div>
          <p className="font-semibold text-muted-foreground line-through decoration-muted-foreground/50">
            {r.name}
          </p>
          {r.description ? (
            <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
          ) : null}
          {r.deleted_at ? (
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Archivado: {new Date(r.deleted_at).toLocaleDateString("es-ES")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: () => <StatusChip tone="neutral" label="archived" />,
    },
    {
      key: "price",
      header: "Precio",
      render: (r) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {Number(r.price ?? 0).toFixed(2)} €
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        can("dishes.restore") ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRestoringDish(r)}
              disabled={busy}
              className="h-8 px-2.5 text-xs"
            >
              <RotateCcw className="size-3.5 mr-1" />
              Restaurar
            </Button>
          </div>
        ) : null,
    },
  ];

  const rows = tab === "active" ? activeRows : archivedRows;
  const columns = tab === "active" ? activeColumns : archivedColumns;

  return (
    <div className="animate-fade-in space-y-4">
      <SectionTitle
        overline="Operaciones"
        title="Biblioteca de platos"
        subtitle={
          tab === "active"
            ? "Catálogo maestro de platos del tenant — alta, edición y activación operativa."
            : "Platos archivados del tenant — consulta y restauración al catálogo activo."
        }
      />
      <AdminHeader
        goal="Publicar y mantener platos operativos"
        capability="dishes.read / dishes.create / dishes.update / dishes.archive / dishes.restore"
        object="Dish"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Platos activos ({activeRows.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("archived")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Archivados ({archivedRows.length})
          </button>
        </div>

        {tab === "active" && can("dishes.create") ? (
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4 mr-1" />
            Nuevo plato
          </Button>
        ) : null}
      </div>

      {showForm && tab === "active" ? (
        <PanelCard>
          <form onSubmit={submitCreate} className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Alta de plato operativo
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dish-name">Nombre *</Label>
                <Input
                  id="dish-name"
                  required
                  placeholder="ej. Salmón al horno con verduras"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dish-desc">Descripción</Label>
                <Textarea
                  id="dish-desc"
                  rows={2}
                  placeholder="Breve descripción del plato, técnica culinaria o ingredientes clave..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dish-price">Precio de venta (€) *</Label>
                <Input
                  id="dish-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={createForm.price}
                  onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dish-cost">Coste (€)</Label>
                <Input
                  id="dish-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={createForm.cost}
                  onChange={(e) => setCreateForm((f) => ({ ...f, cost: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dish-kcal">Kcal</Label>
                <Input
                  id="dish-kcal"
                  type="number"
                  min="0"
                  placeholder="ej. 520"
                  value={createForm.kcal}
                  onChange={(e) => setCreateForm((f) => ({ ...f, kcal: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dish-weight">Peso (g)</Label>
                <Input
                  id="dish-weight"
                  type="number"
                  min="0"
                  placeholder="ej. 350"
                  value={createForm.weightG}
                  onChange={(e) => setCreateForm((f) => ({ ...f, weightG: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dish-prep-minutes">Tiempo prep. (min)</Label>
                <Input
                  id="dish-prep-minutes"
                  type="number"
                  min="0"
                  placeholder="ej. 25"
                  value={createForm.prepMinutes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, prepMinutes: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Macronutrientes (g)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Prot (g)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={createForm.protein}
                    onChange={(e) => setCreateForm((f) => ({ ...f, protein: e.target.value }))}
                  />
                  <Input
                    placeholder="Carb (g)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={createForm.carbs}
                    onChange={(e) => setCreateForm((f) => ({ ...f, carbs: e.target.value }))}
                  />
                  <Input
                    placeholder="Gras (g)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={createForm.fat}
                    onChange={(e) => setCreateForm((f) => ({ ...f, fat: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dish-prep-instructions">
                  Instrucciones de preparación (Cocina)
                </Label>
                <Textarea
                  id="dish-prep-instructions"
                  rows={2}
                  placeholder="Pautas operativas para producción y regeneración..."
                  value={createForm.prepInstructions}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      prepInstructions: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Alérgenos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EU_ALLERGENS.map((allergen) => {
                    const selected = createForm.allergens.includes(allergen.id);
                    return (
                      <button
                        type="button"
                        key={allergen.id}
                        onClick={() => toggleAllergen("create", allergen.id)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer",
                          selected
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/40",
                        )}
                      >
                        {allergen.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button type="submit" disabled={busy}>
                Crear activo
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </PanelCard>
      ) : null}

      <PanelCard>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando platos…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              tab === "active"
                ? "No hay platos activos. Crea el primero para poder armar el menú semanal."
                : "No hay platos archivados en este tenant."
            }
          />
        )}
      </PanelCard>

      {/* Edit Dish Dialog */}
      <Dialog
        open={Boolean(editingDish && editForm)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDish(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editForm && editingDish ? (
            <form onSubmit={submitEdit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Editar plato: {editingDish.name}</DialogTitle>
                <DialogDescription>
                  Modifica los datos del plato en el catálogo del tenant. Todos los cambios quedan
                  auditados.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input
                    id="edit-name"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, name: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-desc">Descripción</Label>
                  <Textarea
                    id="edit-desc"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, description: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-price">Precio (€) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, price: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cost">Coste (€)</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.cost}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, cost: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-kcal">Kcal</Label>
                  <Input
                    id="edit-kcal"
                    type="number"
                    min="0"
                    value={editForm.kcal}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, kcal: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-weight">Peso (g)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    min="0"
                    value={editForm.weightG}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, weightG: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-prep-min">Tiempo prep. (min)</Label>
                  <Input
                    id="edit-prep-min"
                    type="number"
                    min="0"
                    value={editForm.prepMinutes}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, prepMinutes: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-status">Estado</Label>
                  <select
                    id="edit-status"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f
                          ? {
                              ...f,
                              status: e.target.value as "draft" | "active" | "archived",
                            }
                          : null,
                      )
                    }
                  >
                    <option value="active">Activo</option>
                    <option value="draft">Borrador</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Macronutrientes (g)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        Proteína
                      </span>
                      <Input
                        placeholder="0"
                        type="number"
                        min="0"
                        step="0.1"
                        value={editForm.protein}
                        onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, protein: e.target.value } : null))
                        }
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        Carbohidratos
                      </span>
                      <Input
                        placeholder="0"
                        type="number"
                        min="0"
                        step="0.1"
                        value={editForm.carbs}
                        onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, carbs: e.target.value } : null))
                        }
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        Grasas
                      </span>
                      <Input
                        placeholder="0"
                        type="number"
                        min="0"
                        step="0.1"
                        value={editForm.fat}
                        onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, fat: e.target.value } : null))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-prep-instructions">Instrucciones de preparación</Label>
                  <Textarea
                    id="edit-prep-instructions"
                    rows={2}
                    value={editForm.prepInstructions}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, prepInstructions: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Alérgenos</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {EU_ALLERGENS.map((allergen) => {
                      const selected = editForm.allergens.includes(allergen.id);
                      return (
                        <button
                          type="button"
                          key={allergen.id}
                          onClick={() => toggleAllergen("edit", allergen.id)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer",
                            selected
                              ? "bg-primary text-primary-foreground border-primary font-medium"
                              : "bg-background text-muted-foreground border-border hover:border-foreground/40",
                          )}
                        >
                          {allergen.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingDish(null);
                    setEditForm(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy}>
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={Boolean(archivingDish)}
        onOpenChange={(open) => {
          if (!open) setArchivingDish(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar plato?</AlertDialogTitle>
            <AlertDialogDescription>
              El plato <strong>"{archivingDish?.name}"</strong> pasará a la lista de archivados y no
              estará disponible para añadir a nuevos menús semanales. Los pedidos históricos
              conservarán su información.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archivar plato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={Boolean(restoringDish)}
        onOpenChange={(open) => {
          if (!open) setRestoringDish(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar plato?</AlertDialogTitle>
            <AlertDialogDescription>
              El plato <strong>"{restoringDish?.name}"</strong> se restaurará al catálogo activo en
              estado <strong>Borrador</strong>. Podrás revisarlo, editarlo y activarlo cuando
              desees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>Restaurar plato</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
