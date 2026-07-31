/**
 * M-02 · DeviceCapabilities — capability negotiation types.
 * Domain code consumes these statuses; it never asks for iOS/Android/Web.
 */

export type DeviceRuntime = "ssr" | "web" | "capacitor";

export type NetworkStatus = "online" | "offline" | "constrained" | "unknown";

export type CameraStatus = "supported" | "unavailable" | "permissionDenied";

export type LocationStatus = "supported" | "disabled" | "denied" | "unavailable";

export type NotificationStatus = "supported" | "unavailable" | "permissionDenied";

export type BiometricKind = "faceID" | "touchID" | "fingerprint" | "unsupported";

export type FileSystemStatus = "supported" | "unavailable";

export type DeepLinkStatus = "supported" | "unavailable";

export interface NetworkCapability {
  /** Negotiated network status (no OS branching in callers). */
  status(): NetworkStatus;
  isOnline(): boolean;
}

export interface CameraCapability {
  status(): CameraStatus;
  /** True only when capture is actually usable — false until a later module wires plugins. */
  canCaptureImages(): boolean;
}

export interface LocationCapability {
  status(): LocationStatus;
  canReadPosition(): boolean;
}

export interface NotificationsCapability {
  status(): NotificationStatus;
  canReceivePush(): boolean;
}

export interface BiometricsCapability {
  kind(): BiometricKind;
  isAvailable(): boolean;
}

export interface FileSystemCapability {
  status(): FileSystemStatus;
  canReadWriteFiles(): boolean;
}

export interface DeepLinksCapability {
  status(): DeepLinkStatus;
  canHandleAppLinks(): boolean;
}
