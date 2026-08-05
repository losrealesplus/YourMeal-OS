/**
 * Gradle Capability Driver — wrapper + optional -version probe.
 * HOUSEKEEPING-002
 */
import {
  createDriverResult,
  hint,
  pathExists,
  recommend,
  repoPath,
  resolveCwd,
  resolveEnv,
  runCommand,
  setStatus,
} from "./shared.mjs";
import fs from "node:fs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runGradleDriver(ctx = {}) {
  const result = createDriverResult("gradle", "Gradle");
  const cwd = resolveCwd(ctx);
  const env = resolveEnv(ctx);
  const soft = Boolean(ctx.ci);

  const gradlew = repoPath(
    cwd,
    "android",
    process.platform === "win32" ? "gradlew.bat" : "gradlew",
  );
  result.evidence.gradlew = gradlew;

  if (!pathExists(ctx, gradlew)) {
    setStatus(result, soft ? "WARNING" : "ERROR", "android/gradlew missing");
    recommend(result, "Restore Android Gradle Wrapper under android/.");
    return result;
  }

  const propsPath = repoPath(
    cwd,
    "android",
    "gradle",
    "wrapper",
    "gradle-wrapper.properties",
  );
  if (!pathExists(ctx, propsPath)) {
    setStatus(result, soft ? "WARNING" : "ERROR", "gradle-wrapper.properties missing");
    return result;
  }

  try {
    const body = fs.readFileSync(propsPath, "utf8");
    const m = body.match(/distributionUrl=(.+)/);
    result.evidence.distributionUrl = m ? m[1].trim().replace(/\\/g, "") : null;
  } catch {
    result.evidence.distributionUrl = null;
  }

  // Optional live probe — skipped in CI by default for speed/flakes unless forced
  if (ctx.ci && ctx.probeGradle !== true) {
    setStatus(result, "PASS", "Gradle wrapper present (live -version skipped in CI)");
    return result;
  }

  const ver = runCommand(ctx, gradlew, ["-version"], {
    cwd: repoPath(cwd, "android"),
    env,
    timeoutMs: 60_000,
  });
  result.evidence.gradleVersionOk = ver.ok;
  result.evidence.gradleVersionOut = `${ver.stdout}\n${ver.stderr}`.trim().slice(0, 2000);

  if (!ver.ok) {
    setStatus(result, soft ? "WARNING" : "ERROR", "gradlew -version failed");
    recommend(result, "Ensure JAVA_HOME is JDK 21 before running Gradle.");
    hint(result, "cd android && ./gradlew -version");
    return result;
  }

  const out = result.evidence.gradleVersionOut;
  const launcher = String(out).match(/Launcher JVM:\s*(.+)/i);
  const daemon = String(out).match(/Daemon JVM:\s*(.+)/i);
  const gradleLine = String(out).match(/Gradle\s+([\d.]+)/i);
  result.evidence.launcherJvm = launcher ? launcher[1].trim() : null;
  result.evidence.daemonJvm = daemon ? daemon[1].trim() : null;
  result.evidence.gradleVersion = gradleLine ? gradleLine[1] : null;

  const badJvm = [result.evidence.launcherJvm, result.evidence.daemonJvm]
    .filter(Boolean)
    .some((j) => /\b(2[2-9]|[3-9]\d)\b/.test(String(j)));
  if (badJvm) {
    setStatus(result, "ERROR", "Gradle is using JDK 22+ — require JDK 21");
    recommend(result, "Configure JAVA_HOME apuntando a JBR 21 before Gradle.");
    hint(result, 'export JAVA_HOME="…/jbr-21…/Contents/Home"');
    hint(result, 'export PATH="$JAVA_HOME/bin:$PATH"');
    return result;
  }

  setStatus(result, "PASS", `Gradle ${result.evidence.gradleVersion ?? "wrapper OK"}`);
  return result;
}
