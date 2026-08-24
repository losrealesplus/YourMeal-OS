/**
 * YOURMEAL OS — EATCLEAN INSTANCE CONFIGURATION
 *
 * Canonical instance metadata for EatClean Tenerife Catering.
 * Pinned strictly to Core Version 0.1.0.
 */

export const CORE_VERSION = "0.1.0" as const;

export interface InstanceMetadata {
  coreVersion: typeof CORE_VERSION;
  tenant: {
    slug: "eatclean";
    legalName: string;
    publicName: string;
    cif?: string;
    website: string;
  };
  domain: {
    production: string;
    staging: string;
    development: string;
  };
  localization: {
    locale: "es-ES";
    currency: "EUR";
    timezone: "Europe/Madrid";
    units: "metric";
  };
  directory: {
    isPublicDirectory: true;
    category: string;
    areaServed: string;
  };
}

export const eatCleanInstanceConfig: InstanceMetadata = {
  coreVersion: CORE_VERSION,
  tenant: {
    slug: "eatclean",
    legalName: "Eat Clean Tenerife Catering S.L.",
    publicName: "EatClean",
    website: "https://eatcleantenerifecatering.es/",
  },
  domain: {
    production: "eatclean.yourmealos.com",
    staging: "eatclean-staging.yourmealos.com",
    development: "localhost:3000",
  },
  localization: {
    locale: "es-ES",
    currency: "EUR",
    timezone: "Europe/Madrid",
    units: "metric",
  },
  directory: {
    isPublicDirectory: true,
    category: "Meal Prep & Catering Saludable",
    areaServed: "Tenerife, España",
  },
};
