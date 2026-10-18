import { useState, useEffect } from "react";
import {
  Sparkles,
  MapPin,
  User as UserIcon,
  Phone,
  Check,
  ChevronRight,
  Shield,
  Clock,
  Heart,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerSelfProfile } from "@/hooks/use-customer-self-profile";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";
import { customerOnboardingPrefill } from "@/modules/customer-directory/application/customer-onboarding-service";
import { supabase } from "@/integrations/supabase/client";
import { EU_ALLERGENS } from "@/types/dietary";
import { cn } from "@/lib/utils";

export type OnboardingStep = "welcome" | "identity" | "address" | "dietary";

export interface CustomerWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
  forcedStep?: OnboardingStep;
}

export function CustomerWelcomeModal({
  open,
  onOpenChange,
  onCompleted,
  forcedStep,
}: CustomerWelcomeModalProps) {
  const { user, tenantId } = useAuth();
  const customerQuery = useCurrentCustomerId();
  const state = useCustomerSelfProfile();
  const profile = state.profile.data;

  const prefill = customerOnboardingPrefill(user?.user_metadata);
  const [step, setStep] = useState<OnboardingStep>(forcedStep ?? "welcome");

  // Step 2: Identity state
  const [displayName, setDisplayName] = useState(prefill.displayName || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Step 3: Address state
  const [label, setLabel] = useState("Casa");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  // Step 4: Dietary state
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [noKnownAllergens, setNoKnownAllergens] = useState(false);
  const [savingDietary, setSavingDietary] = useState(false);

  useEffect(() => {
    if (forcedStep) {
      setStep(forcedStep);
    }
  }, [forcedStep]);

  useEffect(() => {
    if (prefill.displayName && !displayName) {
      setDisplayName(prefill.displayName);
    }
  }, [prefill.displayName, displayName]);

  const hasCustomerRow = Boolean(customerQuery.data);
  const activeAddresses = profile?.addresses?.filter((a) => !a.archived) ?? [];
  const hasAddress = activeAddresses.length > 0;

  async function handleOnboardSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Por favor indica tu nombre completo.");
      return;
    }
    try {
      await state.execute({
        operation: "onboard",
        declaration: "new",
        displayName: displayName.trim(),
        phone: phone.trim() || null,
      });
      toast.success("¡Ficha de cliente creada!");
      setStep("address");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar tus datos.");
    }
  }

  async function handleRequestLink() {
    try {
      await state.execute({ operation: "request_link" });
      toast.info(
        "Solicitud enviada a EatClean. Verificaremos tu ficha para vincularla con tu cuenta.",
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo solicitar la vinculación.");
    }
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!street.trim()) {
      toast.error("Por favor introduce tu calle, número y piso.");
      return;
    }
    if (!profile) {
      toast.error("Esperando confirmación de ficha de cliente...");
      return;
    }
    try {
      await state.execute({
        operation: "address_create",
        customerId: profile.customerId,
        expectedRevision: profile.revision,
        patch: {
          label: label.trim() || "Dirección principal",
          street: street.trim(),
          city: city.trim() || undefined,
          zip: zip.trim() || undefined,
        },
      });
      toast.success("¡Dirección de entrega guardada!");
      setStep("dietary");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar la dirección.");
    }
  }

  async function handleSaveDietary() {
    const effectiveCustomerId = customerQuery.data ?? profile?.customerId;
    if (!effectiveCustomerId || !tenantId) {
      handleFinish();
      return;
    }
    setSavingDietary(true);
    try {
      const payload = {
        tenant_id: tenantId,
        customer_id: effectiveCustomerId,
        allergens: selectedAllergens,
        custom_allergens: [],
        restrictions: [],
        preferences: [],
        dietary_notes: noKnownAllergens ? "Sin alérgenos conocidos" : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("customer_dietary_profiles")
        .upsert(payload, { onConflict: "tenant_id,customer_id" });

      if (error) {
        console.warn("Could not save dietary profile during onboarding:", error);
      } else {
        toast.success("¡Preferencias de alérgenos guardadas!");
      }
    } catch (e) {
      console.warn("Dietary save error:", e);
    } finally {
      setSavingDietary(false);
      handleFinish();
    }
  }

  function handleFinish() {
    toast.success("¡Todo listo para programar tus pedidos semanales!");
    onOpenChange(false);
    onCompleted?.();
  }

  const stepsList: Array<{ id: OnboardingStep; label: string }> = [
    { id: "welcome", label: "Bienvenida" },
    { id: "identity", label: "Tus datos" },
    { id: "address", label: "Dirección" },
    { id: "dietary", label: "Alérgenos" },
  ];

  const currentStepIdx = stepsList.findIndex((s) => s.id === step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          {/* Progress Indicators */}
          <div className="flex gap-1.5 pb-2">
            {stepsList.map((s, idx) => (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  idx <= currentStepIdx ? "bg-primary" : "bg-secondary",
                )}
              />
            ))}
          </div>

          <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
            {step === "welcome" && "¡Bienvenido a EatClean!"}
            {step === "identity" && "Configura tu ficha de cliente"}
            {step === "address" && "¿Dónde te entregamos tus platos?"}
            {step === "dietary" && "¡Tu cuenta está lista!"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {step === "welcome" &&
              "Comida saludable y fresca preparada por chefs en Canarias, programada a tu medida para toda la semana."}
            {step === "identity" &&
              "Necesitamos tus datos de contacto básicos para gestionar tus pedidos y avisarte de la entrega."}
            {step === "address" &&
              "Indica la dirección principal donde recibirás tus pedidos de Lunes a Viernes."}
            {step === "dietary" &&
              "Ya tienes todo lo necesario para seleccionar tus platos y recibirlos en casa u oficina."}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          {/* STEP 1: WELCOME */}
          {step === "welcome" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <Sparkles className="size-4 shrink-0" />
                  <span>¿Cómo funciona EatClean?</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="size-5 rounded-full bg-primary/10 text-primary font-bold grid place-items-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong>Elige tus platos:</strong> Puedes seleccionar varios días de la semana y ajustar tus raciones libremente.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-5 rounded-full bg-primary/10 text-primary font-bold grid place-items-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>Cocina fresca:</strong> Elaboramos cada plato con producto local y equilibrado nutricionalmente.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-5 rounded-full bg-primary/10 text-primary font-bold grid place-items-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      <strong>Entrega semanal:</strong> Reparto puntual en la franja acordada, sin complicaciones.
                    </span>
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                onClick={() => setStep(hasCustomerRow ? "address" : "identity")}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Empezar configuración</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: IDENTITY */}
          {step === "identity" && (
            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="space-y-3.5">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-foreground">Nombre completo *</span>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="pl-10 h-11 rounded-xl bg-background"
                      disabled={state.busy}
                    />
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-foreground">Teléfono de contacto *</span>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="pl-10 h-11 rounded-xl bg-background"
                      disabled={state.busy}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Imprescindible para avisarte de la llegada del repartidor.
                  </span>
                </label>
              </div>

              <div className="pt-2 space-y-2.5">
                <Button
                  type="submit"
                  disabled={state.busy || !displayName.trim() || !phone.trim()}
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm cursor-pointer"
                >
                  {state.busy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Creando tu ficha...</span>
                    </span>
                  ) : (
                    <span>Guardar y continuar</span>
                  )}
                </Button>

                <button
                  type="button"
                  disabled={state.busy}
                  onClick={handleRequestLink}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline py-1 cursor-pointer transition-colors"
                >
                  ¿Ya eras cliente offline? Solicitar vinculación de ficha histórica
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ADDRESS */}
          {step === "address" && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="space-y-3.5">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-foreground">Etiqueta de dirección</span>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Casa, Oficina, etc."
                    className="h-11 rounded-xl bg-background"
                    disabled={state.busy}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-foreground">Calle, número y piso *</span>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Calle Mayor 10, 2º B"
                      className="pl-10 h-11 rounded-xl bg-background"
                      disabled={state.busy}
                    />
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Ciudad / Municipio</span>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Santa Cruz de Tenerife, La Laguna..."
                      className="h-11 rounded-xl bg-background"
                      disabled={state.busy}
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Código postal</span>
                    <Input
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="38001"
                      className="h-11 rounded-xl bg-background"
                      disabled={state.busy}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={state.busy || !street.trim()}
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm cursor-pointer"
                >
                  {state.busy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Guardando dirección...</span>
                    </span>
                  ) : (
                    <span>Guardar dirección y continuar</span>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 4: DIETARY & ALLERGENS */}
          {step === "dietary" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Heart className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Alergias y Preferencias</h4>
                    <p className="text-xs text-muted-foreground">
                      Indícanos si tienes alguna alergia alimentaria para adaptar tus platos con seguridad.
                    </p>
                  </div>
                </div>
              </div>

              {/* No known allergens toggle */}
              <button
                type="button"
                onClick={() => {
                  setNoKnownAllergens((prev) => {
                    const next = !prev;
                    if (next) setSelectedAllergens([]);
                    return next;
                  });
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-left",
                  noKnownAllergens
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/80 bg-background text-foreground hover:bg-muted/50",
                )}
              >
                <span>Sin alérgenos conocidos</span>
                {noKnownAllergens && <Check className="size-4 text-primary" />}
              </button>

              {/* EU 14 Allergens Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Alérgenos oficiales (UE 14)
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {EU_ALLERGENS.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen.id);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        disabled={noKnownAllergens}
                        onClick={() => {
                          setNoKnownAllergens(false);
                          setSelectedAllergens((prev) =>
                            isSelected ? prev.filter((a) => a !== allergen.id) : [...prev, allergen.id],
                          );
                        }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer text-left",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border/80 bg-background text-foreground hover:bg-muted/50",
                          noKnownAllergens && "opacity-40 cursor-not-allowed",
                        )}
                      >
                        <span className="truncate">{allergen.label}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 text-primary ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={savingDietary}
                  onClick={() => void handleSaveDietary()}
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm cursor-pointer"
                >
                  {savingDietary ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Guardando preferencias...</span>
                    </span>
                  ) : (
                    <span>Guardar y empezar a programar</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleFinish}
                  className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Saltar por ahora (lo configuraré luego en mi perfil)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
