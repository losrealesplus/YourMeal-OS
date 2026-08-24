import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, MapPin, ShieldCheck, Sparkles, Utensils } from "lucide-react";
import { YourMealLogo } from "@/components/brand/yourmeal-os-logo";
import { getPublicClientsDirectory } from "@/lib/public-clients-registry";
import { getTenantAppUrl } from "@/lib/host-topology";

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
              <span>Portal de Clientes & Marcas Operadas</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Nuestros clientes
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Descubre las marcas gastronómicas y servicios de catering que gestionan su operativa,
              menús y entregas con la plataforma YourMeal OS.
            </p>
          </div>

          {/* Grid de Clientes Públicos procedentes del Registry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {publicClients.map((client) => {
              const directUrl = getTenantAppUrl(client.slug);
              return (
                <div
                  key={client.slug}
                  className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/40 transition duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-black text-xl">
                        {client.publicName.charAt(0)}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        <Utensils className="size-3" aria-hidden="true" />
                        <span>{client.category}</span>
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold font-display text-foreground">
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
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/60">
                    <a
                      href={directUrl}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition min-h-[44px]"
                    >
                      <span>Acceder a la plataforma</span>
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
              guiada sin compromiso.
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
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} YourMeal OS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
