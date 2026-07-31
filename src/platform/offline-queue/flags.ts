/** Named feature flags for M-03 (values wired by config later; names are SoT). */
export const OFFLINE_FEATURE_FLAGS = {
  /** Master switch — Sync Engine / UI should respect before draining. */
  queueEnabled: "offline.queue.enabled",
  /** Max attempts before `dead` (overrides default when set in remote config). */
  maxAttempts: "offline.queue.maxAttempts",
  /** Allow Sync Engine drain loop (M-06). */
  syncDrainEnabled: "offline.sync.drainEnabled",
} as const;

export type OfflineFeatureFlagKey =
  (typeof OFFLINE_FEATURE_FLAGS)[keyof typeof OFFLINE_FEATURE_FLAGS];
