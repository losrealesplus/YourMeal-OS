/**
 * Shared loader/validator for config/bootstrap/platform-owners.json
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_PLATFORM_OWNERS_CONFIG_PATH = resolve(
  __dirname,
  "../../config/bootstrap/platform-owners.json",
);

export function loadPlatformOwnersConfig(path = DEFAULT_PLATFORM_OWNERS_CONFIG_PATH) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  if (raw.version !== 1) {
    throw new Error(`Unsupported platform-owners config version: ${raw.version}`);
  }
  if (!raw.defaultTenantSlug || typeof raw.defaultTenantSlug !== "string") {
    throw new Error("platform-owners config missing defaultTenantSlug");
  }
  if (!Array.isArray(raw.owners) || raw.owners.length < 1) {
    throw new Error("platform-owners config must list at least one owner");
  }

  const seen = new Set();
  const owners = raw.owners.map((o, i) => {
    const email = String(o.email ?? "")
      .trim()
      .toLowerCase();
    if (!email || !email.includes("@")) {
      throw new Error(`Invalid owner email at owners[${i}]`);
    }
    if (seen.has(email)) {
      throw new Error(`Duplicate owner email in config: ${email}`);
    }
    seen.add(email);
    return {
      email,
      fullName:
        typeof o.fullName === "string" && o.fullName.trim()
          ? o.fullName.trim()
          : "Platform Owner",
      tenantSlug:
        typeof o.tenantSlug === "string" && o.tenantSlug.trim()
          ? o.tenantSlug.trim().toLowerCase()
          : String(raw.defaultTenantSlug).trim().toLowerCase(),
    };
  });

  return {
    version: raw.version,
    defaultTenantSlug: String(raw.defaultTenantSlug).trim().toLowerCase(),
    owners,
  };
}
