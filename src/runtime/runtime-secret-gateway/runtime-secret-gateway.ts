/**
 * Runtime Secret Gateway — hidden command palette (keystroke-only).
 *
 * FOPEBA · Evidence before Implementation.
 * No UI · No buttons · No persistence · RAM buffer only.
 */

import { RuntimeSecretBuffer } from "./runtime-secret-buffer";
import {
  dispatchRuntimeToggle,
  dispatchSecretGatewayTriggered,
} from "./runtime-secret-events";
import { ymosTrace } from "../ymos-trace";

export type SecretCommandId = "ymos horus";

type SecretCommandHandler = () => void;

/**
 * Extensible command table. Only "ymos horus" is wired in v1.
 * Future: "ymos doctor" | "ymos assets" | "ymos consistency" | …
 */
export const SECRET_COMMANDS: Record<string, SecretCommandHandler> = {
  "ymos horus": () => {
    // RUNTIME-SUITE-001 — Horus toggles Suite open/closed.
    dispatchRuntimeToggle();
  },
  // "ymos doctor": () => { … },
  // "ymos assets": () => { … },
  // "ymos consistency": () => { … },
  // "ymos architect": () => { … },
  // "ymos engineer": () => { … },
};

function isDev(): boolean {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

function logArmed(): void {
  if (!isDev()) return;
  console.log("[YMOS]\nSecret Gateway Armed");
}

function logTriggered(): void {
  if (!isDev()) return;
  console.log("[YMOS]\nSecret Gateway Triggered");
}

/**
 * Exact command match (case-insensitive via normalization).
 * Accepts trailing/leading noise inside the rolling buffer via endsWith,
 * but rejects partial phrases ("ymos", "horus", "ymos hor").
 */
export function matchSecretCommand(
  normalizedBuffer: string,
  commands: Record<string, SecretCommandHandler> = SECRET_COMMANDS,
): string | null {
  const haystack = normalizedBuffer.toLowerCase().trim();
  if (!haystack) return null;

  // Longest-first so future multi-word commands don't false-collide.
  const keys = Object.keys(commands).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (haystack === key || haystack.endsWith(key)) {
      // Reject if the character before the match is a letter/digit
      // (prevents "xymos horus" from matching via endsWith alone — wait,
      // endsWith("ymos horus") on "xymos horus" is true. That's OK for
      // rolling buffers after arbitrary keys. Partial "ymos" is rejected
      // because it is not a registered key.)
      return key;
    }
  }
  return null;
}

function shouldIgnoreKeydown(e: KeyboardEvent): boolean {
  if (e.isComposing) return true;
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  return false;
}

function charFromKeydown(e: KeyboardEvent): string | null {
  if (e.key === "Backspace") return null;
  if (e.key === "Enter" || e.key === "Tab" || e.key === "Escape") return null;
  if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") {
    return null;
  }
  if (e.key.length === 1) return e.key;
  return null;
}

let installed = false;
let buffer: RuntimeSecretBuffer | null = null;
let onKeyDown: ((e: KeyboardEvent) => void) | null = null;

/**
 * Arm the hidden gateway on `window`. Idempotent.
 * Does not preventDefault — forms / login keep working.
 */
export function installRuntimeSecretGateway(): () => void {
  if (typeof window === "undefined") return () => {};
  if (installed) return disposeRuntimeSecretGateway;

  buffer = new RuntimeSecretBuffer(32);
  onKeyDown = (e: KeyboardEvent) => {
    if (!buffer || shouldIgnoreKeydown(e)) return;

    if (e.key === "Backspace") {
      buffer.backspace();
      return;
    }

    const ch = charFromKeydown(e);
    if (ch === null) return;

    buffer.push(ch);
    const matched = matchSecretCommand(buffer.normalized(), SECRET_COMMANDS);
    if (!matched) return;

    buffer.clear();
    logTriggered();
    ymosTrace("secret-gateway-triggered", matched);
    dispatchSecretGatewayTriggered(matched);
    SECRET_COMMANDS[matched]?.();
  };

  window.addEventListener("keydown", onKeyDown);
  installed = true;
  logArmed();
  return disposeRuntimeSecretGateway;
}

/** Remove listeners and wipe the RAM buffer. */
export function disposeRuntimeSecretGateway(): void {
  if (typeof window === "undefined") return;
  if (onKeyDown) {
    window.removeEventListener("keydown", onKeyDown);
    onKeyDown = null;
  }
  buffer?.clear();
  buffer = null;
  installed = false;
}

/** Test helper — not part of the public product API. */
export function __getSecretGatewayBufferForTests(): RuntimeSecretBuffer | null {
  return buffer;
}
