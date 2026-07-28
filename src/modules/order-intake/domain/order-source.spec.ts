import { describe, expect, it } from "vitest";
import {
  isOrderSourceChannel,
  ORDER_SOURCE_CHANNELS,
  CUSTOMER_SELF_CHANNELS,
} from "./order-source";

describe("Order Source (DICT-076)", () => {
  it("accepts known channels", () => {
    for (const c of ORDER_SOURCE_CHANNELS) {
      expect(isOrderSourceChannel(c)).toBe(true);
    }
  });

  it("rejects unknown channels", () => {
    expect(isOrderSourceChannel("telegram")).toBe(false);
    expect(isOrderSourceChannel("")).toBe(false);
  });

  it("customer self is app-only", () => {
    expect(CUSTOMER_SELF_CHANNELS).toEqual(["app"]);
  });
});
