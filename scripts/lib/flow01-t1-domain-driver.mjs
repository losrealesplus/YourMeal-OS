/**
 * FLOW01-001 · Domain driver for `test:flow01-canonical --live`
 *
 * Runs the Vitest live driver (mocked repo + real OperationsService.startProduction)
 * and extracts `[FLOW-01] FLOW01_T*` tokens from process output.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { extractFlow01Steps } from "./flow01-canonical-pipeline.mjs";

const DRIVER_SPEC =
  "src/modules/operations/application/flow01-t1-live.driver.spec.ts";

/**
 * @param {{ root: string }} opts
 * @returns {{ ok: boolean, steps: string[], status: number, output: string }}
 */
export function runFlow01T1DomainDriver({ root }) {
  const vitestBin = path.join(root, "node_modules", "vitest", "vitest.mjs");
  const r = spawnSync(
    process.execPath,
    [vitestBin, "run", DRIVER_SPEC, "--reporter=verbose"],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        FLOW01_LIVE_DRIVER: "1",
        FORCE_COLOR: "0",
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  const output = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  const steps = extractFlow01Steps(output.split("\n"));

  return {
    ok: r.status === 0,
    steps,
    status: r.status ?? 1,
    output,
  };
}
