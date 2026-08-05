/**
 * Developer Platform freeze markers.
 * DEVELOPER-PLATFORM-011 · ADR-0047
 */

/** Product version — architecture / contracts frozen at v1.0. */
export const DEVELOPER_PLATFORM_VERSION = "1.0.0";

/**
 * When true, engines are stable; next PRs add Capability modules / Product Core,
 * not engine redesigns (except major version ADRs).
 */
export const DEVELOPER_PLATFORM_FREEZE = true as const;
