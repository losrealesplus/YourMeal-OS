import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";
import { ScreenHeader, PrimaryCTA, EmptyState } from "@/components/consumer";

/**
 * Screen: Customer · Delivery Addresses
 * - Objetivo operacional: mantener direcciones de entrega al día.
 * - Capability: profile.manage
 * - Core Object(s): CustomerAddress
 */
export const Route = createFileRoute("/_authenticated/app/addresses")({
  component: AddressesPage,
});

type AddressRow = {
  id: string;
  label: string | null;
  street: string;
  city: string | null;
  zip: string | null;
  is_default: boolean;
};

function AddressesPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { tenantId } = useAuth();
  const customerQuery = useCurrentCustomerId();
  const customerId = customerQuery.data ?? null;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "",
    street: "",
    city: "",
    zip: "",
    is_default: false,
  });

  const listKey = ["customer-addresses", tenantId, customerId] as const;
  const list = useQuery({
    queryKey: listKey,
    enabled: Boolean(tenantId && customerId),
    queryFn: async (): Promise<AddressRow[]> => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("id, label, street, city, zip, is_default")
        .eq("tenant_id", tenantId!)
        .eq("customer_id", customerId!)
        .order("is_default", { ascending: false })
        .order("label", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as AddressRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.street.trim()) throw new Error(t("common:required"));
      if (form.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("tenant_id", tenantId!)
          .eq("customer_id", customerId!);
      }
      const { error } = await supabase.from("customer_addresses").insert({
        tenant_id: tenantId!,
        customer_id: customerId!,
        label: form.label.trim() || null,
        street: form.street.trim(),
        city: form.city.trim() || null,
        zip: form.zip.trim() || null,
        is_default: form.is_default,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setOpen(false);
      setForm({ label: "", street: "", city: "", zip: "", is_default: false });
      await qc.invalidateQueries({ queryKey: listKey });
      toast.success(t("common:saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("tenant_id", tenantId!)
        .eq("customer_id", customerId!);
      const { error } = await supabase
        .from("customer_addresses")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/settings"
        overline={t("customer:settings")}
        title={t("customer:addresses")}
      />

      <div className="px-6">
        {list.isLoading || customerQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common:loading")}</p>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState
            icon={<MapPin className="size-6" />}
            title={t("customer:addressesEmptyTitle")}
            hint={t("customer:addressesEmptyHint")}
          />
        ) : (
          <div className="surface-raised border border-border/60 rounded-3xl overflow-hidden divide-y divide-border/60">
            {(list.data ?? []).map((a) => (
              <div key={a.id} className="p-4 flex items-start gap-3">
                <span className="grid place-items-center size-9 rounded-xl bg-secondary text-muted-foreground shrink-0">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {a.label || t("customer:addressHomeDefault")}
                    </p>
                    {a.is_default && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded px-1.5 py-0.5">
                        {t("common:default")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {a.street}
                    {a.city ? `, ${a.city}` : ""}
                    {a.zip ? ` · ${a.zip}` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {!a.is_default && (
                      <button
                        type="button"
                        onClick={() => setDefault.mutate(a.id)}
                        className="text-xs font-semibold text-primary inline-flex items-center gap-1"
                      >
                        <Star className="size-3" />
                        {t("common:setDefault")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove.mutate(a.id)}
                      className="text-xs font-semibold text-destructive inline-flex items-center gap-1"
                    >
                      <Trash2 className="size-3" />
                      {t("common:delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          {open ? (
            <div className="surface-raised border border-border/60 rounded-3xl p-4 space-y-3">
              <input
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
                placeholder={t("customer:addressLabelPh")}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
              <input
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
                placeholder={t("customer:addressStreetPh")}
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  placeholder={t("customer:addressCityPh")}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  placeholder={t("customer:addressZipPh")}
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) =>
                    setForm({ ...form, is_default: e.target.checked })
                  }
                />
                {t("common:setDefault")}
              </label>
              <div className="flex gap-2">
                <PrimaryCTA
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                >
                  {t("common:save")}
                </PrimaryCTA>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-14 px-5 rounded-2xl border border-border text-sm font-semibold"
                >
                  {t("common:cancel")}
                </button>
              </div>
            </div>
          ) : (
            <PrimaryCTA onClick={() => setOpen(true)}>
              <Plus className="size-4 mr-2" />
              {t("customer:addAddress")}
            </PrimaryCTA>
          )}
        </div>
      </div>
    </div>
  );
}
