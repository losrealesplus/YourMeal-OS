import type { BootstrapStageHandler } from "./BootstrapStage";
import { isLocalStaging } from "@/lib/local-staging-runtime";
import {
  CANONICAL_INSTANCE_BINDINGS,
  resolveInstanceRuntimeConfig,
  validateInstanceRuntimeConfig,
} from "@/lib/instance-runtime-boundary";

function isPlaceholder(value: unknown): boolean {
  return (
    typeof value !== "string" ||
    !value.trim() ||
    /REPLACE_ME|your-project|changeme|todo/i.test(value)
  );
}

/** Validate the same instance configuration used by the runtime/auth client. */
export const EnvironmentStage: BootstrapStageHandler = {
  id: "environment",
  blocking: true,
  async run() {
    const invalid: string[] = [];
    try {
      const config = resolveInstanceRuntimeConfig(
        typeof window !== "undefined" ? window.location.hostname : undefined,
      );
      validateInstanceRuntimeConfig(config);
      if (!isLocalStaging(config)) {
        const canonical = CANONICAL_INSTANCE_BINDINGS[config.tenantSlug];
        if (
          !canonical ||
          config.instanceType !== canonical.instanceType ||
          config.supabaseProjectRef !== canonical.supabaseProjectRef
        ) {
          invalid.push("instance.binding");
        }
        if (isPlaceholder(config.supabaseUrl)) {
          invalid.push("instance.supabaseUrl");
        } else {
          try {
            const url = new URL(config.supabaseUrl);
            if (
              url.origin !== `https://${config.supabaseProjectRef}.supabase.co` ||
              url.pathname !== "/" ||
              url.search ||
              url.hash ||
              url.username ||
              url.password
            ) {
              invalid.push("instance.supabaseUrl");
            }
          } catch {
            invalid.push("instance.supabaseUrl");
          }
        }
        if (
          isPlaceholder(config.supabasePublishableKey) ||
          !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.supabasePublishableKey ?? "")
        ) {
          invalid.push("instance.supabasePublishableKey");
        }
      }
    } catch {
      // Resolver/validation exceptions must not expose configuration or keys.
      invalid.push("instance.binding");
    }

    if (invalid.length > 0) {
      return {
        status: "failed",
        error: {
          code: "ENV_INVALID",
          stage: "environment",
          message: `Invalid instance configuration: ${invalid.join(", ")}`,
          recoverable: true,
          evidence: { invalid },
        },
        evidence: { invalid },
      };
    }

    return {
      status: "ok",
      notes: ["environment:instance_binding_valid"],
      evidence: { hasSupabaseUrl: true, hasSupabaseKey: true },
    };
  },
};
