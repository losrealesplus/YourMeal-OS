/**
 * Git Capability Driver.
 * HOUSEKEEPING-002
 */
import {
  createDriverResult,
  recommend,
  resolveBinary,
  resolveCwd,
  runCommand,
  setStatus,
} from "./shared.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runGitDriver(ctx = {}) {
  const result = createDriverResult("git", "Git");
  const cwd = resolveCwd(ctx);

  const gitBin = resolveBinary(ctx, "git");
  result.evidence.gitPath = gitBin;
  if (!gitBin) {
    setStatus(result, "ERROR", "git not found on PATH");
    recommend(result, "Install Git and ensure it is on PATH.");
    return result;
  }

  const branch = runCommand(ctx, gitBin, ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
  });
  result.evidence.branch = branch.ok ? branch.stdout.trim() : null;

  const status = runCommand(ctx, gitBin, ["status", "--porcelain"], { cwd });
  const dirty = status.ok ? status.stdout.trim().length > 0 : null;
  result.evidence.dirty = dirty;

  const tag = runCommand(
    ctx,
    gitBin,
    ["describe", "--tags", "--exact-match", "HEAD"],
    { cwd },
  );
  result.evidence.exactTag = tag.ok ? tag.stdout.trim() : null;

  if (!branch.ok) {
    setStatus(result, "WARNING", "Not a git repository or HEAD unavailable");
    return result;
  }

  setStatus(
    result,
    "PASS",
    `branch ${result.evidence.branch}${result.evidence.exactTag ? ` @ ${result.evidence.exactTag}` : ""}${dirty ? " (dirty)" : ""}`,
  );
  return result;
}
