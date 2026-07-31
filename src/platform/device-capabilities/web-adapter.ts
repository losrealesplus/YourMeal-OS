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

function readBrowserNetworkStatus(): NetworkStatus {
  if (typeof navigator === "undefined") return "unknown";
  if (typeof navigator.onLine === "boolean") {
    return navigator.onLine ? "online" : "offline";
  }
  return "unknown";
}

const network: NetworkCapability = {
  status: () => readBrowserNetworkStatus(),
  isOnline: () => readBrowserNetworkStatus() === "online",
};

/** Browser has media APIs in theory; M-02 does not wire getUserMedia — report unavailable. */
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

/**
 * Web / SSR adapter — zero native plugins.
 * Network is the only capability with a real browser probe in M-02.
 */
export function createWebDeviceCapabilities(
  runtime: "web" | "ssr" = typeof window === "undefined" ? "ssr" : "web",
): DeviceCapabilities {
  return {
    runtime,
    network,
    camera,
    location,
    notifications,
    biometrics,
    fileSystem,
    deepLinks,
  };
}
