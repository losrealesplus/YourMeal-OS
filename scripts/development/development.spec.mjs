/**
 * Development Environment driver unit tests (mocked contexts).
 * HOUSEKEEPING-002
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runJavaDriver } from "./java-driver.mjs";
import { runAdbDriver } from "./adb-driver.mjs";
import { runAndroidSdkDriver } from "./android-sdk-driver.mjs";
import { runGradleDriver } from "./gradle-driver.mjs";
import { runNodeDriver } from "./node-driver.mjs";
import { runNpmDriver } from "./npm-driver.mjs";
import { runEnvironmentDriver } from "./environment-driver.mjs";
import { runDevelopmentEnvironment } from "./index.mjs";

describe("java-driver", () => {
  it("ERROR on mock JDK 26", () => {
    const r = runJavaDriver({
      env: { ...process.env, JAVA_HOME: "/opt/jdk-26", PATH: "/opt/jdk-26/bin" },
      pathExists: (p) => p === "/opt/jdk-26" || p.endsWith("/java") || p.endsWith("/javac") || p.endsWith("/jlink"),
      resolveBinary: (bin) => `/opt/jdk-26/bin/${bin}`,
      runCommand: () => ({
        ok: true,
        stdout: "",
        stderr: 'openjdk version "26" 2026-03-17',
        code: 0,
      }),
    });
    assert.equal(r.status, "ERROR");
    assert.equal(r.evidence.javaMajor, 26);
    assert.ok(r.recommendations.some((x) => /JBR 21|JDK 21/i.test(x)));
    assert.ok(r.recoveryHints.some((x) => x.includes("JAVA_HOME")));
  });

  it("PASS on mock JDK 21", () => {
    const r = runJavaDriver({
      env: {
        ...process.env,
        JAVA_HOME: "/opt/jdk-21",
        PATH: "/opt/jdk-21/bin:/usr/bin",
      },
      pathExists: (p) =>
        p === "/opt/jdk-21" ||
        p.includes("/jdk-21/bin/"),
      resolveBinary: (bin) => `/opt/jdk-21/bin/${bin}`,
      runCommand: () => ({
        ok: true,
        stdout: "",
        stderr: 'openjdk version "21.0.2" 2024-01-16',
        code: 0,
      }),
    });
    assert.equal(r.status, "PASS");
    assert.equal(r.evidence.javaMajor, 21);
  });
});

describe("adb-driver", () => {
  it("WARNING when no devices", () => {
    const r = runAdbDriver({
      resolveBinary: () => "/sdk/platform-tools/adb",
      runCommand: () => ({
        ok: true,
        stdout: "List of devices attached\n\n",
        stderr: "",
        code: 0,
      }),
    });
    assert.equal(r.status, "WARNING");
    assert.equal(r.evidence.attachedCount, 0);
  });
});

describe("android-sdk-driver", () => {
  it("ERROR when SDK missing (non-CI)", () => {
    const r = runAndroidSdkDriver({
      ci: false,
      env: { PATH: "/usr/bin" },
      pathExists: () => false,
    });
    assert.equal(r.status, "ERROR");
  });

  it("WARNING when SDK missing in CI", () => {
    const r = runAndroidSdkDriver({
      ci: true,
      env: { PATH: "/usr/bin" },
      pathExists: () => false,
    });
    assert.equal(r.status, "WARNING");
  });
});

describe("gradle-driver", () => {
  it("ERROR when wrapper missing", () => {
    const r = runGradleDriver({
      ci: false,
      cwd: "/tmp/empty-repo-gradle-test",
      pathExists: () => false,
    });
    assert.equal(r.status, "ERROR");
  });

  it("ERROR when Gradle reports JDK 26 launcher", () => {
    const r = runGradleDriver({
      ci: false,
      probeGradle: true,
      pathExists: () => true,
      runCommand: () => ({
        ok: true,
        stdout:
          "Gradle 8.7\n\nLauncher JVM: 26 (Oracle Corporation 26)\nDaemon JVM: 26\n",
        stderr: "",
        code: 0,
      }),
    });
    assert.equal(r.status, "ERROR");
  });
});

describe("node-driver", () => {
  it("ERROR when node forced missing", () => {
    const r = runNodeDriver({ forceNoNode: true });
    assert.equal(r.status, "ERROR");
  });

  it("PASS for current node when major >= 20", () => {
    const r = runNodeDriver({ nodeVersion: "20.11.0" });
    assert.equal(r.status, "PASS");
  });
});

describe("npm-driver", () => {
  it("ERROR when npm missing", () => {
    const r = runNpmDriver({ forceNoNpm: true });
    assert.equal(r.status, "ERROR");
  });
});

describe("environment-driver", () => {
  it("WARNING when JAVA_HOME unset", () => {
    const env = { ...process.env };
    delete env.JAVA_HOME;
    const r = runEnvironmentDriver({ env, ci: true });
    assert.ok(r.status === "WARNING" || r.status === "PASS");
    assert.ok(r.evidence.missing.includes("JAVA_HOME"));
  });
});

describe("runDevelopmentEnvironment", () => {
  it("aggregates drivers and reports not ready on JDK26", () => {
    const report = runDevelopmentEnvironment({
      ci: true,
      skipCapDoctor: true,
      env: { ...process.env, JAVA_HOME: "/opt/jdk-26", PATH: "/opt/jdk-26/bin" },
      pathExists: (p) => p === "/opt/jdk-26" || String(p).includes("jdk-26"),
      resolveBinary: (bin) => {
        if (bin === "java" || bin === "javac" || bin === "jlink") {
          return `/opt/jdk-26/bin/${bin}`;
        }
        if (bin === "npm") return "/usr/bin/npm";
        if (bin === "git") return "/usr/bin/git";
        if (bin === "npx") return "/usr/bin/npx";
        return null;
      },
      runCommand: (cmd, args) => {
        if (String(cmd).includes("java") && args?.[0] === "-version") {
          return {
            ok: true,
            stdout: "",
            stderr: 'openjdk version "26"',
            code: 0,
          };
        }
        if (args?.[0] === "--version") {
          return { ok: true, stdout: "10.0.0\n", stderr: "", code: 0 };
        }
        if (args?.[0] === "rev-parse") {
          return { ok: true, stdout: "main\n", stderr: "", code: 0 };
        }
        if (args?.[0] === "status") {
          return { ok: true, stdout: "", stderr: "", code: 0 };
        }
        if (args?.[0] === "describe") {
          return { ok: false, stdout: "", stderr: "", code: 1 };
        }
        return { ok: true, stdout: "", stderr: "", code: 0 };
      },
    });
    assert.equal(report.ready, false);
    assert.ok(report.drivers.some((d) => d.id === "java" && d.status === "ERROR"));
  });
});
