/**
 * Developer Platform · Git doctor.
 * Evidence before Implementation.
 */
import {
  createDoctorResult,
  pathExists,
  recordCheck,
  recordWarning,
  repoPath,
  resolveBinary,
  resolveCwd,
  resolveEnv,
  runCommand,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorGit(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);
  const env = resolveEnv(options);

  const gitBin = resolveBinary("git", env);
  result.evidence.gitPath = gitBin;
  recordCheck(
    result,
    "git_on_path",
    Boolean(gitBin),
    gitBin ?? "git not found on PATH",
  );
  if (!gitBin) return result;

  const gitDir = repoPath(cwd, ".git");
  recordCheck(
    result,
    "git_repository",
    pathExists(gitDir),
    pathExists(gitDir) ? ".git present" : "not a git repository",
  );
  if (!pathExists(gitDir)) return result;

  const branch = runCommand(gitBin, ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
    env,
  });
  const branchName = (branch.stdout || "").trim();
  result.evidence.branch = branchName || null;
  recordCheck(
    result,
    "git_branch_readable",
    branch.ok && Boolean(branchName),
    branchName || branch.stderr || "rev-parse failed",
  );

  const head = runCommand(gitBin, ["rev-parse", "--short", "HEAD"], {
    cwd,
    env,
  });
  result.evidence.head = (head.stdout || "").trim() || null;

  const status = runCommand(
    gitBin,
    ["status", "--porcelain"],
    { cwd, env },
  );
  if (status.ok) {
    const dirty = (status.stdout || "").trim().length > 0;
    result.evidence.dirty = dirty;
    if (dirty) {
      recordWarning(
        result,
        "working tree dirty (ok for local doctor; commit before PR)",
      );
    }
    recordCheck(
      result,
      "git_status_readable",
      true,
      dirty ? "dirty" : "clean",
    );
  } else {
    recordCheck(
      result,
      "git_status_readable",
      false,
      status.stderr || "git status failed",
    );
  }

  return result;
}
