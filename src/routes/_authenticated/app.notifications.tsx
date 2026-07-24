import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";
import { ScreenHeader } from "@/components/consumer";

/**
 * Screen: Customer · Notification Preferences
 * - Objetivo operacional: elegir por qué canal recibir avisos operativos
 *   (recordatorio de programación, corte semanal, estado de entrega).
 * - Capability: profile.manage
 * - Core Object(s): CustomerPreference
 *
 * Reuse: persists in `customer_preferences` (key = `notifications.<channel>`),
 * scoped by RLS `is_customer_owner`. No new tables, no duplicated store.
 */
export const Route = createFileRoute("/_authenticated/app/notifications")({
  component: NotificationsPage,
});

type Channel = "email" | "push" | "sms" | "whatsapp";
const CHANNELS: Channel[] = ["email", "push", "sms", "whatsapp"];
const KEY_PREFIX = "notifications.";

type PrefRow = { id: string; key: string; value: string | null };

function NotificationsPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { tenantId } = useAuth();
  const customerQuery = useCurrentCustomerId();
  const customerId = customerQuery.data ?? null;
  const qc = useQueryClient();

  const listKey = ["customer-notification-prefs", tenantId, customerId] as const;

  const prefs = useQuery({
    queryKey: listKey,
    enabled: Boolean(tenantId && customerId),
    queryFn: async (): Promise<Record<Channel, boolean>> => {
      const { data, error } = await supabase
        .from("customer_preferences")
        .select("id, key, value")
        .eq("tenant_id", tenantId!)
        .eq("customer_id", customerId!)
        .like("key", `${KEY_PREFIX}%`);
      if (error) throw new Error(error.message);
      const map: Record<Channel, boolean> = {
        email: true,
        push: true,
        sms: false,
        whatsapp: false,
      };
      for (const row of (data ?? []) as PrefRow[]) {
        const ch = row.key.slice(KEY_PREFIX.length) as Channel;
        if (CHANNELS.includes(ch)) map[ch] = row.value === "true";
      }
      return map;
    },
  });

  const toggle = useMutation({
    mutationFn: async (input: { channel: Channel; enabled: boolean }) => {
      const key = `${KEY_PREFIX}${input.channel}`;
      const { data: existing, error: fetchErr } = await supabase
        .from("customer_preferences")
        .select("id")
        .eq("tenant_id", tenantId!)
        .eq("customer_id", customerId!)
        .eq("key", key)
        .maybeSingle();
      if (fetchErr) throw new Error(fetchErr.message);
      if (existing?.id) {
        const { error } = await supabase
          .from("customer_preferences")
          .update({ value: String(input.enabled) })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("customer_preferences").insert({
          tenant_id: tenantId!,
          customer_id: customerId!,
          key,
          value: String(input.enabled),
        });
        if (error) throw new Error(error.message);
      }
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData<Record<Channel, boolean>>(listKey);
      if (prev) {
        qc.setQueryData(listKey, { ...prev, [input.channel]: input.enabled });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev);
      toast.error(e instanceof Error ? e.message : String(e));
    },
    onSuccess: () => {
      toast.success(t("common:saved"));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  const values = prefs.data;

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/settings"
        overline={t("customer:settings")}
        title={t("customer:notifications")}
      />

      <div className="px-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("customer:notificationsIntro")}
        </p>

        {prefs.isLoading || customerQuery.isLoading || !values ? (
          <p className="text-sm text-muted-foreground">{t("common:loading")}</p>
        ) : (
          <div className="surface-raised border border-border/60 rounded-3xl overflow-hidden divide-y divide-border/60">
            {CHANNELS.map((ch) => (
              <label
                key={ch}
                className="flex items-center gap-3 p-4 cursor-pointer"
              >
                <span className="grid place-items-center size-9 rounded-xl bg-secondary text-muted-foreground shrink-0">
                  <Bell className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {t(`customer:channel_${ch}`)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(`customer:channelHint_${ch}`)}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={values[ch]}
                  disabled={toggle.isPending}
                  onChange={(e) =>
                    toggle.mutate({ channel: ch, enabled: e.target.checked })
                  }
                  className="size-5 accent-primary"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
