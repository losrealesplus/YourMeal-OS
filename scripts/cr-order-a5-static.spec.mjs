import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const original = read("supabase/migrations/20261006072046_cr_order_a4a_custom_writer.sql");
const pricing = read(
  "supabase/migrations/20261006110000_cr_menu_offer_pricing_m3_individual_line.sql",
);
const compatibility = read(
  "supabase/migrations/20261007020849_cr_order_a5_audit_uuid_compatibility.sql",
);
const writer = read("supabase/migrations/20261007020245_cr_order_a5_lifecycle_writer.sql");
const functionBody = (source, name) => {
  const start = source.indexOf(`FUNCTION ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf("END $$;", start);
  assert.ok(end > start, name);
  return source.slice(start, end + "END $$;".length);
};

test("UUID compatibility preserves every writer, batch and pricing business rule", () => {
  assert.equal(
    functionBody(compatibility, "cr_order_private.write_dish_v2"),
    functionBody(original, "cr_order_private.write_dish_v2").replace(
      "VALUES(_tenant_id,actor,'order',oid::text,",
      "VALUES(_tenant_id,actor,'order',oid,",
    ),
  );
  assert.equal(
    functionBody(compatibility, "cr_order_private.custom_batch_transition"),
    functionBody(original, "cr_order_private.custom_batch_transition").replace(
      "'kitchen_batch',batch.id::text,",
      "'kitchen_batch',batch.id,",
    ),
  );
  assert.equal(
    functionBody(compatibility, "public.cr_order_offer_quote_commit"),
    functionBody(pricing, "public.cr_order_offer_quote_commit").replace(
      "result->'order'->>'id', 'order.offer.capture'",
      "(result->'order'->>'id')::uuid, 'order.offer.capture'",
    ),
  );
});

test("A5 preserves pricing/snapshots and never grants API callers the writer role", () => {
  assert.doesNotMatch(writer, /SET\s+(?:total|unit_price|price_snapshot|name_snapshot)\s*=/i);
  assert.doesNotMatch(
    writer,
    /GRANT\s+cr_order_writer\s+TO\s+(?:authenticated|anon|service_role)/i,
  );
  assert.doesNotMatch(writer, /custom_activation|feature_flags|cr_menu\.remediation_active/);
  assert.doesNotMatch(writer, /'packed'/);
  assert.match(writer, /current_setting\('role', true\) IS DISTINCT FROM 'authenticated'/);
  assert.match(writer, /RETURN req\.lifecycle_result/);
});
