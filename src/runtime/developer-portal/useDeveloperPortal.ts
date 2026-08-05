/**
 * Developer Portal — React state hook (RAM only · no storage).
 */
import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { dispatchRuntimeToggle } from "../runtime-secret-gateway";
import { ymosTrace } from "../ymos-trace";
import {
  emitDeveloperPortalOpened,
  resolveBuildLabel,
  YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT,
} from "./developer-portal-events";
import { matchPassphrase } from "./passphrase";

export type DeveloperPortalState = {
  open: boolean;
  passphrase: string;
  error: string | null;
  shaking: boolean;
  setPassphrase: (value: string) => void;
  openPortal: () => void;
  closePortal: () => void;
  submit: () => boolean;
};

export function useDeveloperPortal(): DeveloperPortalState {
  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const openPortal = useCallback(() => {
    setPassphrase("");
    setError(null);
    setShaking(false);
    setOpen(true);
  }, []);

  const closePortal = useCallback(() => {
    setOpen(false);
    setPassphrase("");
    setError(null);
    setShaking(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onDiscover = () => openPortal();
    window.addEventListener(YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT, onDiscover);
    return () => {
      window.removeEventListener(
        YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT,
        onDiscover,
      );
    };
  }, [openPortal]);

  const submit = useCallback((): boolean => {
    const entry = matchPassphrase(passphrase);
    if (!entry || entry.action !== "runtime-toggle") {
      setError("Invalid passphrase");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return false;
    }

    let platform = "web";
    try {
      platform = Capacitor.getPlatform?.() ?? Capacitor.getPlatform();
    } catch {
      platform = "web";
    }

    emitDeveloperPortalOpened({
      timestamp: new Date().toISOString(),
      platform,
      build: resolveBuildLabel(),
      passphraseId: entry.id,
    });
    ymosTrace("developer-portal-opened", entry.id, platform);

    closePortal();
    // Runtime Suite does not know how it was opened — only receives toggle.
    dispatchRuntimeToggle();
    return true;
  }, [passphrase, closePortal]);

  return {
    open,
    passphrase,
    error,
    shaking,
    setPassphrase,
    openPortal,
    closePortal,
    submit,
  };
}
