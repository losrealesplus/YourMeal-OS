#!/usr/bin/env node
/**
 * FOPEBA · MF-001 / M-01 — verify Capacitor Hybrid Shell artifacts.
 * Expects `npm run build:mobile` (or sync:mobile) to have run already.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, ".output", "public");
const indexHtml = path.join(publicDir, "index.html");
const assetsDir = path.join(publicDir, "assets");

function fail(msg) {
  console.error(`FAIL · mobile shell: ${msg}`);
  process.exit(1);
}

if (!existsSync(indexHtml)) {
  fail(`missing ${path.relative(root, indexHtml)}`);
}
if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) {
  fail(`missing ${path.relative(root, assetsDir)}/`);
}
const assetCount = readdirSync(assetsDir).length;
if (assetCount < 1) {
  fail("assets/ is empty");
}

console.log("PASS · mobile shell");
console.log(`  .output/public/index.html`);
console.log(`  .output/public/assets/ (${assetCount} files)`);
