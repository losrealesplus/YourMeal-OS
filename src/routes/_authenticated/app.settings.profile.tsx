import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Edit3, User, Mail, Phone, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerProfile, useUpdateCustomerProfile } from "@/hooks/use-customer-profile";
import { customerProfileSchema } from "@/modules/customer-profile";
import { ScreenHeader, PrimaryCTA } from "@/components/consumer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Screen: Customer · Personal Info
 * - Operational goal: Maintain customer personal profile synchronized with relational DB.
 * - Capability: profile.manage
 * - Core Object(s): CustomerProfile (public.customers + public.customer_phones)
 */
export const Route = createFileRoute("/_authenticated/app/settings/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const { data: profile, isLoading } = useCustomerProfile();
  const updateProfileMutation = useUpdateCustomerProfile();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    phone?: string;
  }>({});

  const currentDisplayName =
    profile?.displayName || (user?.user_metadata?.full_name as string) || "—";

  const currentEmail = profile?.email || user?.email || "—";

  const currentPhone = profile?.phone || (user?.user_metadata?.phone as string) || "—";

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || (user?.user_metadata?.full_name as string) || "");
      setPhone(profile.phone || (user?.user_metadata?.phone as string) || "");
    } else if (user) {
      setDisplayName((user.user_metadata?.full_name as string) || "");
      setPhone((user.user_metadata?.phone as string) || "");
    }
  }, [profile, user]);

  const handleOpenEdit = () => {
    setValidationErrors({});
    if (profile) {
      setDisplayName(profile.displayName || (user?.user_metadata?.full_name as string) || "");
      setPhone(profile.phone || (user?.user_metadata?.phone as string) || "");
    } else if (user) {
      setDisplayName((user.user_metadata?.full_name as string) || "");
      setPhone((user.user_metadata?.phone as string) || "");
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = customerProfileSchema.safeParse({
      displayName,
      phone,
    });

    if (!result.success) {
      const fieldErrors: { displayName?: string; phone?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "displayName") {
          fieldErrors.displayName = issue.message;
        } else if (issue.path[0] === "phone") {
          fieldErrors.phone = issue.message;
        }
      }
      setValidationErrors(fieldErrors);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: result.data.displayName,
        phone: result.data.phone || null,
      });
      setIsEditDialogOpen(false);
    } catch {
      // Handled by mutation onError toast
    }
  };

  const fields: Array<{ label: string; value: string; icon: React.ReactNode; badge?: string }> = [
    {
      label: t("customer:fullName", "Nombre completo"),
      value: currentDisplayName,
      icon: <User className="w-4 h-4 text-muted-foreground" />,
    },
    {
      label: t("common:email", "Correo electrónico"),
      value: currentEmail,
      icon: <Mail className="w-4 h-4 text-muted-foreground" />,
      badge: "Cuenta de acceso",
    },
    {
      label: t("common:phone", "Teléfono de contacto"),
      value: currentPhone,
      icon: <Phone className="w-4 h-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/settings"
        overline={t("customer:settings", "Cuenta")}
        title={t("customer:personalInfo", "Datos personales")}
      />
      <div className="px-6">
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando perfil...</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl divide-y divide-border shadow-sm">
            {fields.map((field) => (
              <div key={field.label} className="px-4 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    {field.icon}
                    <p className="meta-label">{field.label}</p>
                    {field.badge && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal">
                        {field.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <PrimaryCTA onClick={handleOpenEdit} disabled={isLoading}>
            <span className="flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" />
              {t("customer:editProfile", "Editar datos personales")}
            </span>
          </PrimaryCTA>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("customer:editProfile", "Editar datos personales")}</DialogTitle>
            <DialogDescription>
              Mantén tu nombre y teléfono actualizados para las notificaciones y entregas de tus
              pedidos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">{t("customer:fullName", "Nombre completo")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Isabella Hernández"
                className={validationErrors.displayName ? "border-destructive" : ""}
                disabled={updateProfileMutation.isPending}
              />
              {validationErrors.displayName && (
                <p className="text-xs text-destructive">{validationErrors.displayName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("common:phone", "Teléfono de contacto")}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. +34 600 000 000"
                className={validationErrors.phone ? "border-destructive" : ""}
                disabled={updateProfileMutation.isPending}
              />
              {validationErrors.phone && (
                <p className="text-xs text-destructive">{validationErrors.phone}</p>
              )}
            </div>

            <div className="space-y-1.5 opacity-80">
              <Label htmlFor="email">{t("common:email", "Correo electrónico")}</Label>
              <Input
                id="email"
                value={currentEmail}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  El correo está vinculado a tu cuenta de acceso y no puede modificarse aquí.
                </span>
              </div>
            </div>

            <DialogFooter className="pt-4 flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateProfileMutation.isPending}
              >
                {t("common:cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("common:save", "Guardar cambios")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
