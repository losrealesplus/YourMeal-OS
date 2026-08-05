/**
 * Developer Platform · Gradle doctor.
 * Evidence before Implementation.
 */
import {
  androidRequired,
  createDoctorResult,
  pathExists,
  readText,
  recordCheck,
  repoPath,
  resolveCwd,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorGradle(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);
  const soft = !androidRequired(options);

  const gradlew = repoPath(
    cwd,
    "android",
    process.platform === "win32" ? "gradlew.bat" : "gradlew",
  );
  const hasWrapper = pathExists(gradlew);
  result.evidence.gradlew = gradlew;
  recordCheck(
    result,
    "android_gradlew_present",
    hasWrapper,
    hasWrapper ? gradlew : "android/gradlew missing",
    { soft },
  );

  const propsPath = repoPath(
    cwd,
    "android",
    "gradle",
    "wrapper",
    "gradle-wrapper.properties",
  );
  const hasProps = pathExists(propsPath);
  recordCheck(
    result,
    "gradle_wrapper_properties",
    hasProps,
    hasProps ? propsPath : "gradle-wrapper.properties missing",
    { soft },
  );

  if (hasProps) {
    const body = readText(propsPath);
    const m = body.match(/distributionUrl=(.+)/);
    const url = m ? m[1].trim().replace(/\\/g, "") : null;
    result.evidence.distributionUrl = url;
    recordCheck(
      result,
      "gradle_distribution_url",
      Boolean(url && /gradle/i.test(url)),
      url ?? "distributionUrl missing",
      { soft },
    );
  }

  const jar = repoPath(
    cwd,
    "android",
    "gradle",
    "wrapper",
    "gradle-wrapper.jar",
  );
  recordCheck(
    result,
    "gradle_wrapper_jar",
    pathExists(jar),
    pathExists(jar) ? jar : "gradle-wrapper.jar missing",
    { soft },
  );

  return result;
}
