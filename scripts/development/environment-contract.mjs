/**
 * Official Development Environment Contract (HOUSEKEEPING-003).
 * Machine-readable source of truth for doctor:env / contract-driver.
 *
 * Keep in sync with `.env.development.example`.
 */

/** @typedef {'error' | 'warning' | 'info'} ContractSeverity */
/** @typedef {'shell' | 'dotenv'} ContractVarKind */

/**
 * @typedef {{
 *   key: string,
 *   kind: ContractVarKind,
 *   required: boolean,
 *   severity: ContractSeverity,
 *   category: string,
 *   description: string,
 *   altKeys?: string[],
 *   placeholderForbidden?: string[],
 * }} ContractVariable
 */

/** @type {{ version: string, id: string, variables: ContractVariable[] }} */
export const ENVIRONMENT_CONTRACT = {
  version: "1.0.0",
  id: "yourmeal-os-development-environment",
  variables: [
    // —— Shell / toolchain ——
    {
      key: "JAVA_HOME",
      kind: "shell",
      required: true,
      severity: "error",
      category: "java",
      description: "JDK 21 home (JBR / Temurin). Required for Android builds.",
    },
    {
      key: "ANDROID_HOME",
      kind: "shell",
      required: true,
      severity: "error",
      category: "android",
      description: "Android SDK root",
      altKeys: ["ANDROID_SDK_ROOT"],
    },
    {
      key: "PATH",
      kind: "shell",
      required: true,
      severity: "error",
      category: "shell",
      description: "Process PATH must include java / adb / npm binaries",
    },

    // —— Supabase (required for auth / data) ——
    {
      key: "VITE_SUPABASE_URL",
      kind: "dotenv",
      required: true,
      severity: "error",
      category: "supabase",
      description: "Supabase project URL for Vite SPA",
    },
    {
      key: "VITE_SUPABASE_PUBLISHABLE_KEY",
      kind: "dotenv",
      required: true,
      severity: "error",
      category: "supabase",
      description: "Browser publishable key (must not stay REPLACE_ME)",
      placeholderForbidden: ["REPLACE_ME", "YOUR_", "changeme"],
    },
    {
      key: "VITE_SUPABASE_PROJECT_ID",
      kind: "dotenv",
      required: true,
      severity: "error",
      category: "supabase",
      description: "Supabase project ref",
    },
    {
      key: "SUPABASE_URL",
      kind: "dotenv",
      required: false,
      severity: "warning",
      category: "supabase",
      description: "Node/scripts fallback URL (keep in sync with VITE_)",
    },
    {
      key: "SUPABASE_PUBLISHABLE_KEY",
      kind: "dotenv",
      required: false,
      severity: "warning",
      category: "supabase",
      description: "Node/scripts fallback publishable key",
      placeholderForbidden: ["REPLACE_ME"],
    },

    // —— Feature flags (documented defaults) ——
    {
      key: "VITE_AUTH_OAUTH_SOCIAL_ENABLED",
      kind: "dotenv",
      required: false,
      severity: "info",
      category: "auth",
      description: "Show Google/Apple OAuth buttons (default false)",
    },
    {
      key: "VITE_AUTH_PHONE_ENABLED",
      kind: "dotenv",
      required: false,
      severity: "info",
      category: "auth",
      description: "Show Phone OTP tab (default false)",
    },
    {
      key: "VITE_BOOTSTRAP_MODE",
      kind: "dotenv",
      required: false,
      severity: "info",
      category: "bootstrap",
      description: "Synthetic identity for Day-0 UI — never production",
    },
    {
      key: "VITE_YMOS_RUNTIME_OVERLAY",
      kind: "dotenv",
      required: false,
      severity: "info",
      category: "developer-platform",
      description: "Runtime Inspector overlay gate",
    },

    // —— Optional analytics / identity (forward-looking) ——
    {
      key: "VITE_POSTHOG_KEY",
      kind: "dotenv",
      required: false,
      severity: "warning",
      category: "analytics",
      description: "PostHog project key (optional until Product Core analytics)",
    },
    {
      key: "VITE_APP_NAME",
      kind: "dotenv",
      required: false,
      severity: "info",
      category: "app",
      description: "Display name override (optional)",
    },
  ],
};

export const ENVIRONMENT_CONTRACT_FILE = ".env.development.example";
