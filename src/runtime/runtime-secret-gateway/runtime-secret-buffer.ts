/**
 * Runtime Secret Gateway — keystroke buffer (RAM only).
 * Never persist. Never log the phrase.
 */

const DEFAULT_CAPACITY = 32;

export class RuntimeSecretBuffer {
  #chars: string[] = [];
  readonly capacity: number;

  constructor(capacity = DEFAULT_CAPACITY) {
    this.capacity = capacity;
  }

  push(char: string): void {
    if (!char) return;
    for (const c of char) {
      this.#chars.push(c);
      while (this.#chars.length > this.capacity) this.#chars.shift();
    }
  }

  backspace(): void {
    this.#chars.pop();
  }

  clear(): void {
    this.#chars.length = 0;
  }

  /** Raw recent keystrokes (may include leading noise within capacity). */
  raw(): string {
    return this.#chars.join("");
  }

  /** Lowercase + trim for command matching. */
  normalized(): string {
    return this.raw().toLowerCase().trim();
  }
}
