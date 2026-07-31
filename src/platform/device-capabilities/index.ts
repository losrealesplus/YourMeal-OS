export type { DeviceCapabilities } from "./contract";
export type {
  BiometricKind,
  BiometricsCapability,
  CameraCapability,
  CameraStatus,
  DeepLinkStatus,
  DeepLinksCapability,
  DeviceRuntime,
  FileSystemCapability,
  FileSystemStatus,
  LocationCapability,
  LocationStatus,
  NetworkCapability,
  NetworkStatus,
  NotificationStatus,
  NotificationsCapability,
} from "./types";

export { getDeviceCapabilities, setDeviceCapabilitiesForTests } from "./resolve";
export { createWebDeviceCapabilities } from "./web-adapter";
export { createCapacitorDeviceCapabilities } from "./capacitor-adapter";
