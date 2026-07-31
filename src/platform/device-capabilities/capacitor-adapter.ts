import type { DeviceCapabilities } from "./contract";
import type {
  BiometricsCapability,
  CameraCapability,
  DeepLinksCapability,
  FileSystemCapability,
  LocationCapability,
  NetworkCapability,
  NetworkStatus,
  NotificationsCapability,
} from "./types";

/**
 * Capacitor shell adapter (M-02).
 *
 * Uses only `@capacitor/core` for platform identity — **no feature plugins**.
 * Capability methods negotiate "unavailable" until later modules (camera, push, …)
 * install plugins behind this same contract.
 */
function readNetworkStatus(): NetworkStatus {
  if (typeof navigator === "undefined") return "unknown";
  if (typeof navigator.onLine === "boolean") {
    return navigator.onLine ? "online" : "offline";
  }
  return "unknown";
}

const network: NetworkCapability = {
  status: () => readNetworkStatus(),
  isOnline: () => readNetworkStatus() === "online",
};

const camera: CameraCapability = {
  status: () => "unavailable",
  canCaptureImages: () => false,
};

const location: LocationCapability = {
  status: () => "unavailable",
  canReadPosition: () => false,
};

const notifications: NotificationsCapability = {
  status: () => "unavailable",
  canReceivePush: () => false,
};

const biometrics: BiometricsCapability = {
  kind: () => "unsupported",
  isAvailable: () => false,
};

const fileSystem: FileSystemCapability = {
  status: () => "unavailable",
  canReadWriteFiles: () => false,
};

const deepLinks: DeepLinksCapability = {
  status: () => "unavailable",
  canHandleAppLinks: () => false,
};

export function createCapacitorDeviceCapabilities(): DeviceCapabilities {
  return {
    runtime: "capacitor",
    network,
    camera,
    location,
    notifications,
    biometrics,
    fileSystem,
    deepLinks,
  };
}
