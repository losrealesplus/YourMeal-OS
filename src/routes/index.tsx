import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { PoweredByLine, TenantBrandScope } from "@/components/tenant/tenant-brand-scope";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";
import { PrimaryCTA } from "@/components/consumer";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { getSession } from "@/auth";
import { resolveHomePath } from "@/lib/resolve-home-path";
import heroImage from "@/assets/eatclean-hero.jpg";
import { SaasCommercialLanding } from "@/components/public/saas-commercial-landing";
import { ClientPortalDirectory } from "@/components/public/client-portal-directory";
import { resolveHostTopology, type HostType } from "@/lib/host-topology";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YourMeal OS — El Sistema Operativo para Negocios de Alimentación" },
      {
        name: "description",
        content:
          "Plataforma unificada para conectar pedidos, producción, cocina, logística y administración en meal prep, cocinas centrales y catering.",
      },
      { property: "og:title", content: "YourMeal OS — Software de Operaciones Gastronómicas" },
      {
        property: "og:description",
        content: "Plataforma integral para negocios de alimentación y catering organizado.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.yourmealos.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.yourmealos.com/" }],
  }),
  component: RootIndexDispatcher,
});

function RootIndexDispatcher() {
  const [hostType, setHostType] = useState<HostType>("public_marketing");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTenant = urlParams.get("tenant");
      const queryPortal = urlParams.get("portal");

      if (queryPortal === "1" || queryPortal === "true") {
        setHostType("client_portal");
        return;
      }

      if (queryTenant) {
        setHostType("tenant");
        return;
      }

      const topo = resolveHostTopology(window.location.hostname);
      setHostType(topo.hostType);
    }
  }, []);

  if (hostType === "client_portal") {
    return <ClientPortalDirectory />;
  }

  if (hostType === "tenant") {
    return <TenantLanding />;
  }

  return <SaasCommercialLanding />;
}

/**
 * Tenant-branded Customer Experience (e.g. eatclean.yourmealos.com)
 */
function TenantLanding() {
  const copy = tenantCopyEs;
  const navigate = useNavigate();

  // OP-001: OAuth / session return must not stall on public landing.
  useEffect(() => {
    let cancelled = false;
    getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId || cancelled) return;
      const path = await resolveHomePath(userId);
      if (!cancelled) navigate({ to: path as "/app", replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <TenantBrandScope className="min-h-screen bg-[var(--background)] text-foreground">
      <div className="mx-auto max-w-[430px] min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-6">
          <TenantLogo height={40} />
          <LanguageSelector />
        </header>

        <main className="flex-1 flex flex-col px-6 pt-8 pb-10">
          <div className="relative rounded-[2rem] overflow-hidden shadow-sm">
            <img
              src={heroImage}
              alt=""
              width={1600}
              height={1200}
              fetchPriority="high"
              className="w-full h-[380px] object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, transparent 40%, rgba(26,46,36,0.55) 100%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">
                {brandConfig.name}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight mt-2 leading-tight text-balance">
                {copy.claims.enjoy}
              </h1>
            </div>
          </div>

          <p className="text-base text-muted-foreground mt-6 leading-relaxed text-pretty">
            {copy.claims.nutrition} {copy.claims.ingredients} {copy.claims.delivery}
          </p>

          <ul className="mt-6 space-y-3">
            {[copy.claims.method, copy.claims.service, copy.claims.everyday].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-sm text-foreground/90 leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-10 space-y-3">
            <Link to="/auth" className="block">
              <PrimaryCTA>{copy.login.cta}</PrimaryCTA>
            </Link>
            <PoweredByLine className="pt-2" />
          </div>
        </main>
      </div>
    </TenantBrandScope>
  );
}
