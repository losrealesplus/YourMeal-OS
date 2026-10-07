import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { productionExecution } from "./contract.mjs";
if (process.argv.length !== 2) throw new Error("PRODUCTION_HARD_DISABLED");
const started = Date.now();
const child = spawn(
  process.execPath,
  ["--test", "--test-reporter=tap", fileURLToPath(new URL("./lab.spec.mjs", import.meta.url))],
  {
    env: { PATH: "/usr/bin:/bin" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let out = "",
  err = "";
child.stdout.on("data", (x) => (out += x));
child.stderr.on("data", (x) => (err += x));
child.on("error", (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
child.on("close", (code) => {
  const summary = {
    schema: "TEST_A5_ROOT_QUALIFICATION_V1",
    productionExecution,
    productionAuthority: false,
    hardwareEnrolled: false,
    cloudResources: false,
    providerConnected: false,
    worker: "SIMULATED_NO_SQL",
    store: "LOCAL_SQLITE_TEST",
    runtime: process.version,
    platform: process.platform,
    architecture: process.arch,
    tests: Number(/# tests (\d+)/.exec(out)?.[1] ?? 0),
    pass: Number(/# pass (\d+)/.exec(out)?.[1] ?? 0),
    fail: Number(/# fail (\d+)/.exec(out)?.[1] ?? 1),
    durationMs: Date.now() - started,
    result: code === 0 ? "ISOLATED_TEST_PASS" : "ISOLATED_TEST_FAIL",
    linuxContainer:
      process.platform === "linux" ? "TEST_PROCESS_ON_LINUX" : "NOT_QUALIFIED_ON_THIS_RUNTIME",
  };
  console.log(JSON.stringify(summary, null, 2));
  if (code !== 0) {
    console.error(out + err);
    process.exitCode = 1;
  }
});
