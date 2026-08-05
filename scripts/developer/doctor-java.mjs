/**
 * Developer Platform · Java doctor.
 * Evidence before Implementation.
 */
import {
  androidRequired,
  createDoctorResult,
  recordCheck,
  recordWarning,
  resolveBinary,
  resolveEnv,
  runCommand,
} from "./doctor-shared.mjs";

/**
 * @param {string} text
 */
function parseJavaVersion(text) {
  const m =
    text.match(/version\s+"([^"]+)"/i) ||
    text.match(/openjdk\s+(\d+(?:\.\d+)*)/i);
  return m ? m[1] : null;
}

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorJava(options = {}) {
  const result = createDoctorResult();
  const env = resolveEnv(options);
  const required = androidRequired(options);
  const soft = !required;

  const javaBin = resolveBinary("java", env);
  result.evidence.javaPath = javaBin;
  recordCheck(
    result,
    "java_on_path",
    Boolean(javaBin),
    javaBin ?? "java not found on PATH",
    { soft },
  );

  if (!javaBin) {
    if (soft) {
      recordWarning(
        result,
        "Java absent — Android toolchain checks are soft in CI/soft-android mode",
      );
    }
    return result;
  }

  const ver = runCommand(javaBin, ["-version"], { env });
  const blob = `${ver.stderr}\n${ver.stdout}`;
  const version = parseJavaVersion(blob);
  result.evidence.javaVersionRaw = blob.trim().split(/\r?\n/)[0] ?? null;
  result.evidence.javaVersion = version;
  recordCheck(
    result,
    "java_version_readable",
    Boolean(version),
    version ?? blob.slice(0, 200),
    { soft },
  );

  if (version) {
    const major = Number(String(version).split(".")[0] || 0);
    result.evidence.javaMajor = major;
    const okMajor = major >= 17;
    recordCheck(
      result,
      "java_major_supported",
      okMajor,
      `java major ${major} (min 17 for Android/Gradle)`,
      { soft },
    );
  }

  const javacBin = resolveBinary("javac", env);
  result.evidence.javacPath = javacBin;
  if (!javacBin) {
    recordWarning(result, "javac not on PATH (JDK vs JRE?)");
  }

  return result;
}
