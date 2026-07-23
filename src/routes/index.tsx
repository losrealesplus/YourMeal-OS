import { createFileRoute, Link } from "@tanstack/react-router";
import { LanguageSelector } from "@/components/language-selector";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";
import { PrimaryCTA } from "@/components/consumer";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import heroImage from "@/assets/eatclean-hero.jpg";

/**
 * Public entry — Tenant-branded (ADR 0014).
 * SCR (pre-auth) · CJ-001 door
 * BackOffice is invisible here by design; only /auth links out.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `${brandConfig.name} — ${brandConfig.storeAssets.shortDescription}`,
      },
      {
        name: "description",
        content: brandConfig.storeAssets.shortDescription,
      },
      { property: "og:title", content: brandConfig.name },
      {
        property: "og:description",
        content: brandConfig.storeAssets.shortDescription,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const copy = tenantCopyEs;
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
              className="w-full h-[380px] object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(26,46,36,0.55) 100%)",
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
            {copy.claims.nutrition} {copy.claims.ingredients}{" "}
            {copy.claims.delivery}
          </p>

          <ul className="mt-6 space-y-3">
            {[copy.claims.method, copy.claims.service, copy.claims.everyday].map(
              (line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-foreground/90 leading-relaxed">
                    {line}
                  </span>
                </li>
              ),
            )}
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
