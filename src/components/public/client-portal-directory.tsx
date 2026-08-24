import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Info,
} from "lucide-react";
import { YourMealLogo } from "@/components/brand/yourmeal-os-logo";
import { getPublicClientsDirectory } from "@/lib/public-clients-registry";

export function ClientPortalDirectory() {
  const publicClients = getPublicClientsDirectory();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Header Institucional */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <YourMealLogo size={34} />
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="https://www.yourmealos.com"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition px-3 py-2 min-h-[44px] inline-flex items-center"
            >
              Volver a la web
            </a>
            <Link
              to="/auth/admin"
              className="text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground px-3.5 sm:px-4 py-2 rounded-xl transition min-h-[44px] inline-flex items-center gap-1.5 border border-border"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Acceso Administrador</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header de Sección */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              <span>Directorio Oficial de Marcas & Demostración</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Directorio de clientes
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explora la demostración interactiva oficial de la plataforma y las marcas de catering
              que gestionan su operativa diaria con YourMeal OS.
            </p>
          </div>

          {/* Grid de Clientes Públicos procedentes del Registry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {publicClients.map((client) => {
              const isDemo = client.type === "platform_demo";

              return (
                <div
                  key={client.slug}
                  className={`rounded-3xl border ${
                    isDemo
                      ? "border-primary/40 bg-gradient-to-b from-primary/5 to-card ring-1 ring-primary/20"
                      : "border-border/80 bg-card"
                  } p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="size-14 rounded-2xl bg-card border border-border/80 p-2 flex items-center justify-center shadow-xs overflow-hidden">
                        {client.logoUrl ? (
                          <img
                            src={client.logoUrl}
                            alt={client.publicName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-primary font-display font-black text-xl">
                            {client.publicName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isDemo ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                            <Star className="size-3 fill-current" aria-hidden="true" />
                            <span>{client.label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            <Utensils className="size-3" aria-hidden="true" />
                            <span>{client.label}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
                        {client.publicName}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        <span>{client.areaServed}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {client.description}
                    </p>

                    {isDemo && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Info className="size-3.5 text-primary" aria-hidden="true" />
                          <span>Información sobre la demostración</span>
                        </div>
                        <ul className="space-y-1 text-[11px] list-disc list-inside">
                          <li>Esta es una demostración de YourMeal OS.</li>
                          <li>Las funcionalidades se adaptan a cada cliente.</li>
                          <li>
                            Las capacidades visibles pueden variar según la configuración
                            contratada.
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/60">
                    <a
                      href={client.appUrl}
                      className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ${
                        isDemo
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-secondary text-foreground hover:bg-secondary/80 font-semibold"
                      } text-sm shadow-sm transition min-h-[44px]`}
                    >
                      <span>{isDemo ? "Explorar demostración" : "Acceder a la plataforma"}</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner de Solicitud de Demostración */}
          <div className="rounded-3xl border border-border/80 bg-secondary/50 p-8 text-center space-y-4">
            <div className="size-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-foreground font-display">
              ¿Gestionas un negocio de catering o meal prep?
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Optimiza tu producción, cocina y reparto con YourMeal OS. Solicita una demostración
              guiada adaptada a tu modelo de negocio.
            </p>
            <div className="pt-2">
              <a
                href="mailto:hola@yourmealos.com?subject=Solicitud%20de%20Demostraci%C3%B3n%20YourMeal%20OS"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition min-h-[40px]"
              >
                <span>Solicitar demo para mi negocio</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} YourMeal OS. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.yourmealos.com" className="hover:text-foreground transition">
              Web principal
            </a>
            <span className="text-border">·</span>
            <a
              href="https://www.yourmealos.com/privacidad"
              className="hover:text-foreground transition"
            >
              Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
