/**
 * FLOW-02 · Domain driver for `test:flow02-canonical --live`
 *
 * Runs the Vitest live driver (progressive T1–T3) and extracts
 * `[FLOW-02] FLOW02_T*` tokens from process output.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { extractFlow02Steps } from "./flow02-canonical-pipeline.mjs";

const DRIVER_SPEC =
  "src/modules/operations/application/flow02-live.driver.spec.ts";

/**
 * @param {{ root: string, through?: 1|2|3 | null }} opts
 * @returns {{ ok: boolean, steps: string[], status: number, output: string }}
 */
export function runFlow02DomainDriver({ root, through = null }) {
  const vitestBin = path.join(root, "node_modules", "vitest", "vitest.mjs");
  const r = spawnSync(
    process.execPath,
    [vitestBin, "run", DRIVER_SPEC, "--reporter=verbose"],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        FLOW02_LIVE_DRIVER: "1",
        FORCE_COLOR: "0",
        // Default through=1 preserves FLOW02-001 when --live has no --through
        FLOW02_LIVE_THROUGH: String(through ?? 1),
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  const output = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  const steps = extractFlow02Steps(output.split("\n"));

  return {
    ok: r.status === 0,
    steps,
    status: r.status ?? 1,
    output,
  };
}
