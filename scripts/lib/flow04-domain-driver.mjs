/**
 * FLOW-04 · Domain driver for `test:flow04-canonical --live`
 *
 * Runs the Vitest live driver (progressive T1–T3) and extracts
 * `[FLOW-04] FLOW04_T*` tokens from process output.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { extractFlow04Steps } from "./flow04-canonical-pipeline.mjs";

const DRIVER_SPEC =
  "src/modules/inventory/application/flow04-live.driver.spec.ts";

/**
 * @param {{ root: string, through?: 1|2|3 | null }} opts
 * @returns {{ ok: boolean, steps: string[], status: number, output: string }}
 */
export function runFlow04DomainDriver({ root, through = null }) {
  const vitestBin = path.join(root, "node_modules", "vitest", "vitest.mjs");
  const r = spawnSync(
    process.execPath,
    [vitestBin, "run", DRIVER_SPEC, "--reporter=verbose"],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        FLOW04_LIVE_DRIVER: "1",
        FORCE_COLOR: "0",
        // Unscoped --live defaults to max certified transition in the driver (T3).
        ...(through ? { FLOW04_LIVE_THROUGH: String(through) } : {}),
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  const output = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  const steps = extractFlow04Steps(output.split("\n"));

  return {
    ok: r.status === 0,
    steps,
    status: r.status ?? 1,
    output,
  };
}
