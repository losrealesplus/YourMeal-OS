#!/usr/bin/env node
/**
 * MOBILE-RELEASE · MR2 — record Android artifact evidence (hashes / sizes).
 *
 * Prerequisites: Android SDK + local.properties · prior Gradle build:
 *   ./gradlew :app:assembleDebug :app:assembleRelease :app:bundleRelease
 *
 * Writes docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json
 * Does NOT commit APK/AAB binaries (gitignored). Does NOT configure signing.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MR2_ARTIFACT_PATHS,
  MR2_EVIDENCE_MANIFEST_REL,
} from "./lib/mobile-release-mr2-android-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function readVersioning() {
  const gradle = fs.readFileSync(
    path.join(ROOT, "android/app/build.gradle"),
    "utf8",
  );
  const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
  const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
  const applicationId = gradle.match(/applicationId\s+"([^"]+)"/)?.[1];
  if (!versionCode || !versionName || !applicationId) {
    throw new Error("Cannot read versionCode / versionName / applicationId");
  }
  return { versionCode, versionName, applicationId };
}

function main() {
  const { versionCode, versionName, applicationId } = readVersioning();
  /** @type {Record<string, unknown>} */
  const artifacts = {};

  for (const [key, rel] of Object.entries(MR2_ARTIFACT_PATHS)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.error(`Missing artifact: ${rel}`);
      console.error(
        "Run: cd android && ./gradlew :app:assembleDebug :app:assembleRelease :app:bundleRelease",
      );
      process.exit(1);
    }
    const st = fs.statSync(abs);
    artifacts[key] = {
      relative_path: rel,
      bytes: st.size,
      sha256: sha256File(abs),
      variant: key.startsWith("debug") ? "debug" : "release",
      kind: key.includes("aab") ? "aab" : "apk",
      unsigned: key.includes("release_apk") ? true : undefined,
    };
  }

  const manifest = {
    delivery: "MR01-002",
    segment: "android_build",
    applicationId,
    versionCode,
    versionName,
    signing: "unsigned",
    certifies: [
      "android_debug_apk",
      "android_release_apk_unsigned",
      "android_release_aab",
      "reproducible_gradle_build",
    ],
    does_not_certify: [
      "signing",
      "keystore",
      "google_play",
      "play_console",
      "internal_testing",
      "ios",
      "ci_cd",
    ],
    gradle_tasks: [
      ":app:assembleDebug",
      ":app:assembleRelease",
      ":app:bundleRelease",
    ],
    output_layout: {
      apk: "android/app/build/outputs/apk/",
      bundle: "android/app/build/outputs/bundle/",
    },
    note:
      "Binaries are gitignored under android/**/build/. Evidence JSON is the certified fingerprint. Operational copies may live outside the repo (e.g. artifacts store).",
    recorded_at: new Date().toISOString(),
    artifacts,
  };

  const out = path.join(ROOT, MR2_EVIDENCE_MANIFEST_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, out)}`);
  for (const [key, meta] of Object.entries(artifacts)) {
    const m = /** @type {{ relative_path: string, bytes: number, sha256: string }} */ (
      meta
    );
    console.log(
      `  ${key}: ${m.bytes} bytes · sha256=${m.sha256.slice(0, 12)}… · ${m.relative_path}`,
    );
  }
}

main();
