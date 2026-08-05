/**
 * ADB Capability Driver — devices WARNING if none attached.
 * HOUSEKEEPING-002
 */
import {
  createDriverResult,
  hint,
  recommend,
  resolveBinary,
  resolveEnv,
  runCommand,
  setStatus,
} from "./shared.mjs";
import { runAndroidSdkDriver } from "./android-sdk-driver.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runAdbDriver(ctx = {}) {
  const result = createDriverResult("adb", "ADB");
  const env = resolveEnv(ctx);

  let adbBin = resolveBinary(ctx, "adb");
  if (!adbBin) {
    const sdk = runAndroidSdkDriver(ctx);
    if (typeof sdk.evidence.adbPath === "string" && sdk.evidence.adbPath) {
      adbBin = sdk.evidence.adbPath;
    }
  }
  result.evidence.adbPath = adbBin;

  if (!adbBin) {
    setStatus(result, "WARNING", "adb not found on PATH");
    recommend(result, "Add Android platform-tools to PATH.");
    hint(result, 'export PATH="$ANDROID_HOME/platform-tools:$PATH"');
    return result;
  }

  const devices = runCommand(ctx, adbBin, ["devices"], {
    env,
    timeoutMs: 10_000,
  });
  const lines = String(devices.stdout || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("List of devices"));
  const attached = lines.filter((l) => /\tdevice$/.test(l));
  result.evidence.deviceLines = lines;
  result.evidence.attachedCount = attached.length;

  if (!devices.ok) {
    setStatus(result, "WARNING", "adb devices failed");
    recommend(result, "Ensure adb server can start (USB debugging / udev).");
    return result;
  }

  if (attached.length === 0) {
    setStatus(result, "WARNING", "No adb device attached");
    recommend(result, "Connect a device/emulator with USB debugging enabled.");
    hint(result, "adb devices");
    return result;
  }

  setStatus(result, "PASS", `${attached.length} device(s) attached`);
  return result;
}
