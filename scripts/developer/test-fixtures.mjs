/**
 * Shared fixtures for Developer Platform doctor specs.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * @param {string} [prefix]
 */
export function makeTempRepo(prefix = "ymos-doctor-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * @param {string} cwd
 * @param {Record<string, string>} files
 */
export function writeFiles(cwd, files) {
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
}

/**
 * Minimal YourMeal-like fixture for multi-module tests.
 * @param {string} cwd
 * @param {{ softAndroid?: boolean }} [opts]
 */
export function writeMinimalPlatformFixture(cwd, opts = {}) {
  writeFiles(cwd, {
    "package.json": JSON.stringify(
      {
        name: "tanstack_start_ts",
        type: "module",
        scripts: {
          dev: "vite dev",
          build: "vite build",
          "build:web": "vite build",
          "build:mobile": "CAPACITOR_BUILD=1 vite build",
        },
        dependencies: {
          "@capacitor/core": "^8.0.0",
          "@capacitor/cli": "^8.0.0",
          "@capacitor/android": "^8.0.0",
          vite: "^8.0.0",
        },
      },
      null,
      2,
    ),
    "capacitor.config.ts":
      'export default {\n  appId: "com.yourmealos.app",\n  appName: "YourMealOS",\n  webDir: ".output/public",\n};\n',
    "vite.config.ts": "export default {};\n",
    ".env.example":
      'VITE_SUPABASE_PROJECT_ID="demo"\nVITE_SUPABASE_URL="https://example.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"\n',
    "src/integrations/supabase/client.ts":
      "export const supabase = {};\n",
    "src/tenant/resources/logo.png": "fake-png",
    "src/components/tenant/tenant-logo.tsx":
      'import fallbackLogoUrl from "@/tenant/resources/logo.png";\nexport function TenantLogo(){ return <img src={fallbackLogoUrl} />; }\n',
    "src/runtime/ymos-runtime-assets/store.ts": "export {};\n",
    "src/runtime/ymos-runtime-consistency/engine.ts": "export {};\n",
    "src/runtime/ymos-runtime-consistency/index.ts": "export {};\n",
    "src/runtime/ymos-runtime-consistency/annotate.ts": "export {};\n",
    "android/gradlew": "#!/bin/sh\necho gradle\n",
    "android/gradle/wrapper/gradle-wrapper.properties":
      "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-all.zip\n",
    "android/gradle/wrapper/gradle-wrapper.jar": "jar",
  });
  fs.mkdirSync(path.join(cwd, "scripts", "developer"), { recursive: true });
  if (!opts.softAndroid) {
    const sdk = path.join(cwd, ".android-sdk");
    fs.mkdirSync(path.join(sdk, "platform-tools"), { recursive: true });
    fs.mkdirSync(path.join(sdk, "platforms", "android-35"), { recursive: true });
    fs.writeFileSync(path.join(sdk, "platform-tools", "adb"), "#!/bin/sh\necho adb\n");
    fs.chmodSync(path.join(sdk, "platform-tools", "adb"), 0o755);
  }
}
