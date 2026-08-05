/**
 * Java Capability Driver — expects JDK 21. ERROR on 22+.
 * HOUSEKEEPING-002
 */
import {
  EXPECTED_JDK_MAJOR,
  createDriverResult,
  hint,
  javaMajor,
  parseJavaVersion,
  pathExists,
  recommend,
  resolveBinary,
  resolveEnv,
  runCommand,
  setStatus,
  suggestJavaHomeHints,
} from "./shared.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 * @returns {import('./shared.mjs').DriverResult}
 */
export function runJavaDriver(ctx = {}) {
  const result = createDriverResult("java", "Java");
  const env = resolveEnv(ctx);

  result.evidence.JAVA_HOME = env.JAVA_HOME ?? null;

  if (env.JAVA_HOME) {
    const homeOk = pathExists(ctx, env.JAVA_HOME);
    result.evidence.javaHomeExists = homeOk;
    if (!homeOk) {
      setStatus(result, "ERROR", `JAVA_HOME points to missing path: ${env.JAVA_HOME}`);
      recommend(result, "Configure JAVA_HOME apuntando a JBR / JDK 21.");
      for (const h of suggestJavaHomeHints(env)) hint(result, h);
    }
  } else {
    setStatus(result, "WARNING", "JAVA_HOME is unset");
    recommend(result, "Set JAVA_HOME to JDK 21 before Android builds.");
    for (const h of suggestJavaHomeHints(env)) hint(result, h);
  }

  const javaBin = resolveBinary(ctx, "java");
  result.evidence.javaPath = javaBin;
  if (!javaBin) {
    setStatus(result, "ERROR", "java not found on PATH");
    recommend(result, "Configure JAVA_HOME apuntando a JBR 21.");
    for (const h of suggestJavaHomeHints(env)) hint(result, h);
    return result;
  }

  const ver = runCommand(ctx, javaBin, ["-version"]);
  const blob = `${ver.stderr}\n${ver.stdout}`;
  const version = parseJavaVersion(blob);
  result.evidence.javaVersionRaw = blob.trim().split(/\r?\n/)[0] ?? null;
  result.evidence.javaVersion = version;

  if (!version) {
    setStatus(result, "ERROR", "Unable to parse java -version");
    recommend(result, "Configure JAVA_HOME apuntando a JBR 21.");
    return result;
  }

  const major = javaMajor(version);
  result.evidence.javaMajor = major;

  if (major === EXPECTED_JDK_MAJOR) {
    if (result.status === "PASS") {
      setStatus(result, "PASS", `JDK ${major} (expected ${EXPECTED_JDK_MAJOR})`);
    } else if (result.status === "WARNING") {
      result.message = `JDK ${major} found but JAVA_HOME unset or incomplete`;
    }
  } else if (major > EXPECTED_JDK_MAJOR) {
    setStatus(
      result,
      "ERROR",
      `JDK ${major} detected — YourMeal OS requires JDK ${EXPECTED_JDK_MAJOR} (not ${major})`,
    );
    recommend(result, "Configure JAVA_HOME apuntando a JBR 21.");
    for (const h of suggestJavaHomeHints(env)) hint(result, h);
  } else {
    setStatus(
      result,
      "ERROR",
      `JDK ${major} detected — expected JDK ${EXPECTED_JDK_MAJOR}`,
    );
    recommend(result, "Configure JAVA_HOME apuntando a JBR 21.");
    for (const h of suggestJavaHomeHints(env)) hint(result, h);
  }

  const javacBin = resolveBinary(ctx, "javac");
  result.evidence.javacPath = javacBin;
  if (!javacBin) {
    setStatus(result, "ERROR", "javac not found (JRE without JDK?)");
    recommend(result, "Install a full JDK 21 (not JRE-only).");
  }

  const jlinkBin = resolveBinary(ctx, "jlink");
  result.evidence.jlinkPath = jlinkBin;
  if (!jlinkBin) {
    setStatus(result, "WARNING", "jlink not found on PATH");
    recommend(result, "Ensure JDK bin is on PATH (jlink used by some Android tooling).");
  }

  return result;
}
