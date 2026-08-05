/**
 * Developer Portal — triple-tap detector (RAM only).
 * Window ≈ 500ms · three consecutive taps · no preventDefault.
 */

export const TRIPLE_TAP_WINDOW_MS = 500;
export const TRIPLE_TAP_COUNT = 3;

export type TripleTapOptions = {
  windowMs?: number;
  requiredTaps?: number;
  now?: () => number;
};

/**
 * Creates a tap recorder. Call `tap()` on each pointer/click.
 * Returns true when a triple-tap gesture completes (then resets).
 */
export function createTripleTapDetector(options: TripleTapOptions = {}) {
  const windowMs = options.windowMs ?? TRIPLE_TAP_WINDOW_MS;
  const required = options.requiredTaps ?? TRIPLE_TAP_COUNT;
  const nowFn = options.now ?? (() => Date.now());

  let stamps: number[] = [];

  return {
    tap(): boolean {
      const t = nowFn();
      stamps = stamps.filter((s) => t - s <= windowMs);
      stamps.push(t);
      if (stamps.length >= required) {
        stamps = [];
        return true;
      }
      return false;
    },
    reset(): void {
      stamps = [];
    },
    /** Test helper */
    count(): number {
      return stamps.length;
    },
  };
}
