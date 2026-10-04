// Callers supply fixed semantic labels; raw values and parser messages never escape.
export const jsonObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export function parseReleaseJson(raw, code, source, expected, accepts) {
  const fail = () => new Error(`${code}: source=${source} expected=${expected} result=FAIL_CLOSED`);
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw fail();
  }
  if (!accepts(value)) throw fail();
  return value;
}
export function githubResponseShape(endpoint) {
  // Never echo an endpoint: it can contain account identifiers or query values.
  if (endpoint.startsWith("deployments/") && endpoint.includes("/statuses"))
    return { source: "deployment_statuses", array: true };
  if (endpoint.startsWith("deployments?")) return { source: "deployments", array: true };
  if (endpoint.startsWith("commits/")) return { source: "commit_pull_requests", array: true };
  if (endpoint.endsWith("/approvals")) return { source: "production_approvals", array: true };
  if (endpoint.includes("/artifacts")) return { source: "run_artifacts", array: false };
  if (endpoint.startsWith("actions/runs/")) return { source: "workflow_run", array: false };
  if (endpoint.startsWith("environments/"))
    return { source: "production_environment", array: false };
  if (endpoint.startsWith("git/ref/")) return { source: "main_reference", array: false };
  if (endpoint.startsWith("pulls/")) return { source: "pull_request", array: false };
  return { source: "github_response", array: false };
}
