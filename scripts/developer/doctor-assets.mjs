/**
 * Developer Platform · Assets doctor.
 * Evidence before Implementation.
 */
import {
  createDoctorResult,
  pathExists,
  readText,
  recordCheck,
  recordWarning,
  repoPath,
  resolveCwd,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorAssets(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);

  const logoPng = repoPath(cwd, "src", "tenant", "resources", "logo.png");
  const logoSvg = repoPath(cwd, "src", "tenant", "resources", "logo.svg");
  const hasLogo = pathExists(logoPng) || pathExists(logoSvg);
  result.evidence.logoPng = pathExists(logoPng) ? logoPng : null;
  result.evidence.logoSvg = pathExists(logoSvg) ? logoSvg : null;
  recordCheck(
    result,
    "tenant_logo_resource",
    hasLogo,
    hasLogo
      ? "src/tenant/resources/logo.(png|svg)"
      : "tenant logo resource missing",
  );

  const lovableAssetJson = repoPath(
    cwd,
    "src",
    "assets",
    "eatclean-logo.png.asset.json",
  );
  const staleAsset = pathExists(lovableAssetJson);
  result.evidence.lovableAssetJson = staleAsset ? lovableAssetJson : null;
  recordCheck(
    result,
    "no_lovable_logo_asset_json",
    !staleAsset,
    staleAsset
      ? "eatclean-logo.png.asset.json still present (ASSET-003 regression)"
      : "no Lovable logo .asset.json",
  );

  const logoComponentCandidates = [
    repoPath(cwd, "src", "components", "tenant", "tenant-logo.tsx"),
    repoPath(cwd, "src", "components", "tenant-logo.tsx"),
    repoPath(cwd, "src", "components", "TenantLogo.tsx"),
  ];
  const logoComponent = logoComponentCandidates.find(pathExists) ?? null;
  result.evidence.tenantLogoComponent = logoComponent;
  if (logoComponent) {
    const body = readText(logoComponent);
    const importsLocal =
      /tenant\/resources\/logo/.test(body) ||
      /from\s+['"][^'"]*logo\.(png|svg)['"]/.test(body);
    const hasConflict =
      body.includes("<<<<<<<") ||
      body.includes(">>>>>>>") ||
      body.includes("=======");
    recordCheck(
      result,
      "tenant_logo_imports_local_asset",
      importsLocal,
      importsLocal
        ? "TenantLogo imports local logo resource"
        : "TenantLogo does not import src/tenant/resources/logo",
    );
    recordCheck(
      result,
      "tenant_logo_no_conflict_markers",
      !hasConflict,
      hasConflict
        ? "git conflict markers in TenantLogo"
        : "no conflict markers",
    );
    if (/__l5e/.test(body)) {
      recordWarning(result, "TenantLogo source mentions __l5e");
    }
  } else {
    recordWarning(result, "TenantLogo component path not found (optional check)");
  }

  const assetsRuntime = repoPath(
    cwd,
    "src",
    "runtime",
    "ymos-runtime-assets",
  );
  recordCheck(
    result,
    "ymos_runtime_assets_present",
    pathExists(assetsRuntime),
    "src/runtime/ymos-runtime-assets/",
  );

  return result;
}
