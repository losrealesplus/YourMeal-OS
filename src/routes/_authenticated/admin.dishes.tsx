/**
 * ADMIN · Dish Library — real CRUD via DishService (OP-001 bootstrap).
 * Capability: dishes.read / dishes.create / dishes.update
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { DishService } from "@/services/dish-service";
import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";
import {
  AdminHeader,
  DataTable,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        content: "Catálogo de platos del tenant — alta y activación operativa.",
      },
    ],
  }),
});

type FormState = {
  name: string;
  description: string;
  price: string;
  kcal: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  kcal: "",
};

function AdminDishesPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [rows, setRows] = useState<DishRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
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
      setRows(await DishService.list(ctx));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  async function submit(e: React.FormEvent) {
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
      await DishService.create(ctx, {
        name: form.name,
        description: form.description || null,
        price: form.price ? Number(form.price) : 0,
        kcal: form.kcal ? Number(form.kcal) : null,
        status: "active",
      });
      setForm(emptyForm);
      setShowForm(false);
      await reload();
      toast.success("Plato creado y activo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: string) {
    if (!user || !tenantId) return;
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
    }
  }

  const columns: Column<DishRow>[] = [
    {
      key: "name",
      header: "Plato",
      render: (r) => (
        <div>
          <p className="font-semibold">{r.name}</p>
          {r.description ? (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {r.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => (
        <StatusChip
          tone={r.status === "active" ? "positive" : "neutral"}
          label={r.status}
        />
      ),
    },
    {
      key: "price",
      header: "Precio",
      render: (r) => (
        <span className="tabular-nums text-sm">
          {Number(r.price ?? 0).toFixed(2)} €
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status !== "active" && can("dishes.update") ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => activate(r.id)}
          >
            Activar
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <SectionTitle
        overline="Operaciones"
        title="Biblioteca de platos"
        subtitle="Alta de platos activos para el menú semanal. Sin catálogo no hay pedidos."
      />
      <AdminHeader
        goal="Publicar platos operativos"
        capability="dishes.create"
        object="Dish"
      />

      <div className="flex justify-end">
        {can("dishes.create") ? (
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4 mr-1" />
            Nuevo plato
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <PanelCard>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dish-name">Nombre</Label>
              <Input
                id="dish-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dish-desc">Descripción</Label>
              <Input
                id="dish-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dish-price">Precio (€)</Label>
              <Input
                id="dish-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dish-kcal">Kcal</Label>
              <Input
                id="dish-kcal"
                type="number"
                min="0"
                value={form.kcal}
                onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <Button type="submit" disabled={busy}>
                Crear activo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </PanelCard>
      ) : null}

      <PanelCard>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Cargando…
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty="No hay platos activos. Crea el primero para poder armar el menú semanal."
          />
        )}
      </PanelCard>
    </div>
  );
}
