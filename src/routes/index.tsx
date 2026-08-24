import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useEffect } from "react";
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
import { resolveHostTopology, type HostType, type HostTopologyContext } from "@/lib/host-topology";

/**
 * Server Function: Extract request Host header during SSR
 * Evaluated on the server by Nitro/TanStack Start on every initial page request.
 */
export const getHostTopologyServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<HostTopologyContext> => {
    try {
      const request = getRequest();
      const hostHeader =
        request?.headers.get("x-forwarded-host") || request?.headers.get("host") || "";
      return resolveHostTopology(hostHeader);
    } catch {
      return resolveHostTopology("");
    }
  },
);

export const Route = createFileRoute("/")({
  loader: async () => {
    return await getHostTopologyServer();
  },
  head: ({ loaderData }) => {
    if (loaderData?.hostType === "client_portal") {
      return {
        meta: [
          { title: "Nuestros Clientes — YourMeal OS" },
          {
            name: "description",
            content: "Directorio público de marcas operadas en la plataforma YourMeal OS.",
          },
        ],
      };
    }
    if (loaderData?.hostType === "tenant" && loaderData.tenantSlug === "eatclean") {
      return {
        meta: [
          { title: "EatClean Tenerife — Comida Saludable Preparada" },
          {
            name: "description",
            content: "Menús semanales saludables a domicilio y empresas en Tenerife.",
          },
        ],
      };
    }
    return {
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
    };
  },
  component: RootIndexDispatcher,
});

function RootIndexDispatcher() {
  const loaderData = Route.useLoaderData();

  // Primary: SSR deterministic host resolution from request headers
  let hostType: HostType = loaderData?.hostType || "public_marketing";

  // Local DX override via query parameters (e.g. ?portal=1 or ?tenant=eatclean)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const queryPortal = urlParams.get("portal");
    const queryTenant = urlParams.get("tenant");

    if (queryPortal === "1" || queryPortal === "true") {
      hostType = "client_portal";
    } else if (queryTenant) {
      hostType = "tenant";
    }
  }

  if (hostType === "client_portal") {
    return <ClientPortalDirectory />;
  }

  if (hostType === "public_marketing") {
    return <SaasCommercialLanding />;
  }

  return <TenantLanding />;
}

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
