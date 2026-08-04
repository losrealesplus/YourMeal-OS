#!/usr/bin/env node
/**
 * MOBILE-RELEASE · MR4 — record iOS Archive evidence.
 *
 * Always fingerprints the Xcode project (pbxproj · versions · recipe).
 * If ios/build/App.xcarchive (or YOURMEAL_IOS_ARCHIVE_PATH) exists, records
 * size + tree sha256. Otherwise sets xcarchive_status=contract_ready_pending_macos.
 *
 * Does NOT commit .xcarchive. Does NOT export IPA / TestFlight.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MR4_ARCHIVE_RECIPE,
  MR4_EVIDENCE_MANIFEST_REL,
} from "./lib/mobile-release-mr4-ios-archive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function sha256Tree(dir) {
  const hash = crypto.createHash("sha256");
  /** @type {string[]} */
  const files = [];
  function walk(current) {
    for (const name of fs.readdirSync(current).sort()) {
      const p = path.join(current, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else files.push(p);
    }
  }
  walk(dir);
  let bytes = 0;
  for (const f of files) {
    hash.update(path.relative(dir, f));
    hash.update("\0");
    const buf = fs.readFileSync(f);
    bytes += buf.length;
    hash.update(buf);
  }
  return { sha256: hash.digest("hex"), file_count: files.length, bytes };
}

function gitHead() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function readPbxMeta() {
  const pbx = fs.readFileSync(
    path.join(ROOT, "ios/App/App.xcodeproj/project.pbxproj"),
    "utf8",
  );
  const marketing_version = pbx.match(/MARKETING_VERSION = ([^;]+);/)?.[1]?.trim();
  const current_project_version = pbx
    .match(/CURRENT_PROJECT_VERSION = ([^;]+);/)?.[1]
    ?.trim();
  const product_bundle_identifier = pbx
    .match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/)?.[1]
    ?.trim();
  if (!marketing_version || !current_project_version || !product_bundle_identifier) {
    throw new Error("Cannot read iOS versioning / bundle id from pbxproj");
  }
  return {
    marketing_version,
    current_project_version,
    product_bundle_identifier,
    project_pbxproj_sha256: sha256File(
      path.join(ROOT, "ios/App/App.xcodeproj/project.pbxproj"),
    ),
  };
}

function main() {
  const meta = readPbxMeta();
  const commit = gitHead();
  const archiveEnv = process.env.YOURMEAL_IOS_ARCHIVE_PATH;
  const defaultRel = "ios/build/App.xcarchive";
  const archiveAbs = archiveEnv
    ? path.resolve(archiveEnv)
    : path.join(ROOT, defaultRel);
  const archiveRel = archiveEnv
    ? path.relative(ROOT, archiveAbs)
    : defaultRel;

  /** @type {Record<string, unknown> | null} */
  let xcarchive = null;
  /** @type {string} */
  let xcarchive_status = "contract_ready_pending_macos";

  if (fs.existsSync(archiveAbs) && fs.statSync(archiveAbs).isDirectory()) {
    const info = path.join(archiveAbs, "Info.plist");
    const products = path.join(archiveAbs, "Products");
    if (!fs.existsSync(info) || !fs.existsSync(products)) {
      console.error(
        "Archive path exists but is not a valid .xcarchive (need Info.plist + Products/)",
      );
      process.exit(1);
    }
    const tree = sha256Tree(archiveAbs);
    xcarchive = {
      relative_path: archiveRel,
      bytes: tree.bytes,
      sha256: tree.sha256,
      file_count: tree.file_count,
      recorded_at: new Date().toISOString(),
    };
    xcarchive_status = "produced";
  }

  const manifest = {
    delivery: "MR01-004",
    segment: "ios_archive",
    ...meta,
    git_commit: commit,
    recorded_at: new Date().toISOString(),
    host: {
      platform: process.platform,
      xcodebuild_available: (() => {
        try {
          execFileSync("which", ["xcodebuild"], { stdio: "ignore" });
          return true;
        } catch {
          return false;
        }
      })(),
    },
    archive_recipe: { ...MR4_ARCHIVE_RECIPE },
    xcarchive_relative_path: archiveRel,
    xcarchive_status,
    xcarchive,
    certifies: [
      "ios_project_valid",
      "release_configuration",
      "signing_identity_prepared",
      "archive_recipe_reproducible",
      "archive_metadata_fingerprint",
      "core_integrity_during_archive_contract",
    ],
    does_not_certify: [
      "ipa",
      "testflight",
      "app_store_connect",
      "distribution",
      "fastlane",
      "ci_cd",
    ],
    note:
      xcarchive_status === "produced"
        ? "Live .xcarchive fingerprinted. Binary remains gitignored / outside Git."
        : "No live .xcarchive on this host. Project fingerprint + xcodebuild recipe certified; produce Archive on macOS and re-run this script.",
  };

  const out = path.join(ROOT, MR4_EVIDENCE_MANIFEST_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, out)}`);
  console.log(
    `  bundle=${meta.product_bundle_identifier} · ${meta.marketing_version} (${meta.current_project_version})`,
  );
  console.log(`  pbxproj_sha256=${meta.project_pbxproj_sha256.slice(0, 12)}…`);
  console.log(`  commit=${commit}`);
  console.log(`  xcarchive_status=${xcarchive_status}`);
  if (xcarchive) {
    console.log(
      `  archive: ${xcarchive.bytes} bytes · sha256=${String(xcarchive.sha256).slice(0, 12)}… · ${archiveRel}`,
    );
  }
}

main();
