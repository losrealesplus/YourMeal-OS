import type {
  BiometricsCapability,
  CameraCapability,
  DeepLinksCapability,
  DeviceRuntime,
  FileSystemCapability,
  LocationCapability,
  NetworkCapability,
  NotificationsCapability,
} from "./types";

/**
 * Unique entry contract for native/web device features (M-02).
 * Business/UI code depends on this interface only — never on Capacitor plugins.
 */
export interface DeviceCapabilities {
  readonly runtime: DeviceRuntime;
  readonly network: NetworkCapability;
  readonly camera: CameraCapability;
  readonly location: LocationCapability;
  readonly notifications: NotificationsCapability;
  readonly biometrics: BiometricsCapability;
  readonly fileSystem: FileSystemCapability;
  readonly deepLinks: DeepLinksCapability;
}
