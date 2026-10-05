import { describe, expect, it } from "vitest";
import { assertLegacyOrderWriteCompatible } from "./legacy-order-write-guard";

describe("legacy write boundary", () => {
  it("preserves pre-expand and v1 dish orders", () => {
    expect(() => assertLegacyOrderWriteCompatible({}, [{ dish_id: "dish" }])).not.toThrow();
    expect(() =>
      assertLegacyOrderWriteCompatible({ write_contract_version: 1 }, [
        { dish_id: "dish", item_kind: "dish" },
      ]),
    ).not.toThrow();
  });
  it.each([null, "", "null", "undefined"])("rejects invalid legacy identity %s", (dish_id) => {
    expect(() => assertLegacyOrderWriteCompatible({}, [{ dish_id }])).toThrow("Legacy order write");
  });
  it.each([0, 2, 3])("rejects unsupported write version %s", (version) => {
    expect(() =>
      assertLegacyOrderWriteCompatible({ write_contract_version: version }, [{ dish_id: "dish" }]),
    ).toThrow("Legacy order write");
  });
});
