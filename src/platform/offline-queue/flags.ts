/** Named feature flags for later remote config (values not wired in M-03). */
export const OFFLINE_FEATURE_FLAGS = {
  queueEnabled: "offline.queue.enabled",
  syncDrainEnabled: "offline.sync.drainEnabled",
} as const;

export type OfflineFeatureFlagKey =
  (typeof OFFLINE_FEATURE_FLAGS)[keyof typeof OFFLINE_FEATURE_FLAGS];
