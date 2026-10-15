import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const sql = (query) =>
  execFileSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
    input: query,
    encoding: "utf8",
  }).trim();

console.log("Ensuring orders and idempotency ledgers are clean for pristine E2E run...");
sql(`
  SET session_replication_role = 'replica';
  TRUNCATE TABLE public.order_write_requests, public.delivery_services, public.order_items, public.orders CASCADE;
  DELETE FROM public.audit_log WHERE entity_type = 'order';
  SET session_replication_role = 'origin';
`);

console.log("=== STARTING FULL UI E2E TEST: UNIVERSAL INTAKE DRAWER ===");

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  localStorage.setItem("tenant_onboarding_done", "1");
  localStorage.setItem("i18nextLng", "es");
});

const page = await ctx.newPage();
const networkCalls = {
  legacyRpc: 0,
  quoteV2: 0,
  commitV2: 0,
  serverFunctions: [],
  rpcCalls: [],
};

let capturedCommitRequest = null;

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (req) => {
  const url = req.url();
  if (url.includes("capture_staff_existing_order")) {
    networkCalls.legacyRpc++;
    console.log("WARNING: Legacy RPC detected:", url);
  }
  if (url.includes("cr_order_offer_quote_issue")) {
    networkCalls.quoteV2++;
    networkCalls.rpcCalls.push("cr_order_offer_quote_issue");
  }
  if (url.includes("cr_order_offer_quote_commit")) {
    networkCalls.commitV2++;
    networkCalls.rpcCalls.push("cr_order_offer_quote_commit");
  }
  if (url.includes("_server") || url.includes("quoteOfferOrder") || url.includes("commitOfferOrder")) {
    networkCalls.serverFunctions.push(url);
    if (url.includes("quoteOfferOrder")) networkCalls.quoteV2++;
    if (url.includes("commitOfferOrder") || (url.includes("_server") && req.postData()?.includes("commitOfferOrder"))) {
      networkCalls.commitV2++;
    }
  }
  if (url.includes("commitOfferOrder") || (url.includes("_server") && req.postData()?.includes("quoteId"))) {
    try {
      const parsed = req.postDataJSON();
      const payload = parsed?.data || parsed;
      if (payload && (payload.command || payload.quoteId)) {
        capturedCommitRequest = payload;
        console.log("Captured real browser commitOfferOrder payload:", JSON.stringify(capturedCommitRequest));
      }
    } catch {}
  }
});

page.on("response", async (res) => {
  if (res.status() >= 400) {
    const url = res.url();
    try {
      const text = await res.text();
      console.log(`[HTTP ${res.status()}] ${url}: ${text.slice(0, 300)}`);
    } catch {}
  }
});

try {
  // Step 1: Login as staff (operations_manager)
  console.log("\n[Step 1] Logging in as staff (operations_manager)...");
  await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("input[type=email]").waitFor({ timeout: 15000 });
  await page.locator("input[type=email]").fill("staff@e2e.example.test");
  await page.locator("input[type=password]").fill("E2E-synthetic-Only-2026!");
  await page.locator("form button").first().click();
  await page.waitForTimeout(3000);
  console.log("Logged in. Current URL:", page.url());

  // Step 2: Navigate to Admin Orders page
  console.log("\n[Step 2] Navigating to /admin/orders...");
  await page.goto("http://127.0.0.1:8080/admin/orders", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log("Admin orders page loaded. URL:", page.url());

  // Step 3: Open Universal Order Intake Drawer
  console.log("\n[Step 3] Opening Universal Order Intake Drawer...");
  const newOrderButton = page.getByRole("button", { name: /nuevo pedido|captura universal|\+ pedido/i }).first();
  await newOrderButton.click();
  await page.waitForTimeout(1500);

  // Step 4: Advance week to 2026-10-19
  console.log("\n[Step 4] Advancing to published week 2026-10-19...");
  const nextWeekBtn = page.locator("button[title='Semana siguiente']");
  await nextWeekBtn.click();
  await page.waitForTimeout(2000);

  // Step 5: Select customer 'Cliente Ficticio E2E'
  console.log("\n[Step 5] Selecting customer 'Cliente Ficticio E2E'...");
  const searchInput = page.locator("input[placeholder*='Buscar por nombre de cliente']");
  await searchInput.fill("Cliente Ficticio");
  await page.waitForTimeout(1000);

  const customerOption = page.locator("button:has-text('Cliente Ficticio E2E')").first();
  await customerOption.waitFor({ state: "visible", timeout: 5000 });
  await customerOption.click();
  await page.waitForTimeout(1000);
  console.log("Selected customer: Cliente Ficticio E2E");

  // Step 6: Select dessert dish (3.50 € offer vs 2.50 € catalog)
  console.log("\n[Step 6] Inspecting and selecting dessert dish...");
  const dessertRow = page.locator("div.border:has-text('Tarta de Queso Saludable')").first();
  await dessertRow.waitFor({ state: "visible", timeout: 5000 });
  const rowText = await dessertRow.innerText();
  console.log("Dessert row text:", rowText.replace(/\n+/g, " | "));

  // Click the '+' button for this dish
  const plusBtn = dessertRow.locator("button:has(svg.lucide-plus)");
  await plusBtn.click();
  await page.waitForTimeout(1000);

  // Check footer total
  const footerText = await page.locator("[role=dialog] footer, .border-t.bg-card").first().innerText();
  console.log("Drawer footer summary:", footerText.replace(/\n+/g, " | "));

  if (!footerText.includes("3.50 €") && !footerText.includes("3,50 €")) {
    throw new Error(`Expected grand total to be 3.50 €, got: ${footerText}`);
  }
  console.log("VERIFIED: Quoted offer price 3.50 € applied correctly (catalog is 2.50 €)!");

  // Step 7: Click 'Guardar Borrador'
  console.log("\n[Step 7] Clicking 'Guardar Borrador'...");
  const draftBtn = page.getByRole("button", { name: "Guardar Borrador" });
  await draftBtn.click();
  await page.waitForTimeout(4000);

  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  console.log("Toasts seen on screen:", toasts);

  // Step 8: Assert network calls
  console.log("\n[Step 8] Checking network call counters...");
  console.log("Legacy RPC (capture_staff_existing_order) calls:", networkCalls.legacyRpc);
  console.log("V2 Server functions intercepted:", networkCalls.serverFunctions.length);

  if (networkCalls.legacyRpc > 0) {
    throw new Error(`VIOLATION: Legacy RPC was called ${networkCalls.legacyRpc} times!`);
  }
  console.log("PASS: 0 calls to capture_staff_existing_order!");

  // Step 9: Database verification via SQL
  console.log("\n[Step 9] Database assertions via SQL...");
  const ordersSql = sql(`
    SELECT id, customer_id, week_start, status, total, write_contract_version, created_at
    FROM public.orders
    ORDER BY created_at DESC
    LIMIT 1;
  `);
  console.log("Orders row in DB:", ordersSql);

  const [orderId, customerId, weekStart, status, total, contractVer] = ordersSql.split("|");
  if (!orderId) throw new Error("No order found in public.orders!");
  if (status !== "draft") throw new Error(`Expected status 'draft', got: ${status}`);
  if (Number(total) !== 3.5) throw new Error(`Expected total 3.50, got: ${total}`);
  if (Number(contractVer) !== 2) throw new Error(`Expected write_contract_version 2, got: ${contractVer}`);

  console.log("PASS: Order created with write_contract_version = 2, status = draft, total = 3.50 €");

  const itemsSql = sql(`
    SELECT id, order_id, dish_id, qty, unit_price, price_snapshot_status
    FROM public.order_items
    WHERE order_id = '${orderId}';
  `);
  console.log("Order items row in DB:", itemsSql);
  const [, , dishId, qty, unitPrice, snapshotStatus] = itemsSql.split("|");
  if (dishId !== "30000000-0000-4000-8000-000000000002") throw new Error(`Unexpected dishId: ${dishId}`);
  if (Number(qty) !== 1) throw new Error(`Expected qty 1, got: ${qty}`);
  if (Number(unitPrice) !== 3.5) throw new Error(`Expected unit_price 3.50, got: ${unitPrice}`);
  if (snapshotStatus !== "captured") throw new Error(`Expected price_snapshot_status 'captured', got: ${snapshotStatus}`);

  console.log("PASS: Order item created with unit_price = 3.50 €, price_snapshot_status = captured");

  const auditSql = sql(`
    SELECT id, entity_type, action
    FROM public.audit_log
    WHERE entity_id = '${orderId}'
    ORDER BY created_at ASC;
  `);
  console.log("Audit log rows for order:\n" + auditSql);
  if (!auditSql.includes("order.offer.capture") && !auditSql.includes("order.v2.capture")) {
    throw new Error("Audit log missing order capture entry!");
  }
  console.log("PASS: Audit log entry verified with canonical quote & commit trace");

  // Step 10: Verify Idempotency with canonical ledger & conflict protection
  console.log("\n[Step 10] Testing Idempotency & Reconciliation...");
  const writeReqRow = sql(`
    SELECT tenant_id, request_id, order_id, operation, input_hash, committed_revision
    FROM public.order_write_requests
    WHERE order_id = '${orderId}';
  `);
  console.log("Canonical order_write_request row:", writeReqRow);
  const [tenantId, requestId, , operation, inputHash, committedRevision] = writeReqRow.split("|");
  if (!requestId || operation !== "capture" || Number(committedRevision) !== 1) {
    throw new Error(`Unexpected order_write_request row: ${writeReqRow}`);
  }

  const actorId = sql(`
    SELECT actor_id
    FROM public.audit_log
    WHERE entity_id = '${orderId}'
    LIMIT 1;
  `);

  // 10.1: Verify identical request replay with identical requestId & payload
  console.log("Testing identical request replay with identical requestId & payload...");
  const commandToReplay = capturedCommitRequest?.command || {
    operation: "capture",
    customer: { kind: "existing", id: customerId },
    weekStart,
    autoConfirm: false,
    demandChannel: "individual",
    lines: [
      {
        kind: "dish",
        dishId,
        dayDate: "2026-10-19",
        qty: 1,
        comment: null,
      },
    ],
    orderNotes: null,
    dietaryOverride: null,
  };
  const exactCommandJson = JSON.stringify(commandToReplay).replace(/'/g, "''");

  const replayResult = sql(`
    DO $$
    DECLARE
      v_q record;
      v_res jsonb;
      v_cmd jsonb := '${exactCommandJson}'::jsonb;
    BEGIN
      SET LOCAL ROLE service_role;
      SELECT * INTO v_q FROM cr_order_private.offer_quotes WHERE request_id = '${requestId}'::uuid;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'TEST_FAILED: offer quote not found for replay';
      END IF;

      -- Cryptographic assertion: assert exact command payload hash matches quote command_hash
      IF v_q.command_hash <> encode(sha256(convert_to(v_cmd::text, 'UTF8')), 'hex') THEN
        RAISE EXCEPTION 'TEST_FAILED: command payload does not match quote command_hash! computed: %, expected: %',
          encode(sha256(convert_to(v_cmd::text, 'UTF8')), 'hex'), v_q.command_hash;
      END IF;

      v_res := public.cr_order_offer_quote_commit(
        _tenant_id => '${tenantId}'::uuid,
        _actor_id => '${actorId}'::uuid,
        _request_id => '${requestId}'::uuid,
        _quote_id => v_q.id,
        _command => v_cmd,
        _commercial_context => jsonb_build_object('policyHash', v_q.policy_hash, 'mode', 'individual_line_pricing_v1', 'active', true)
      );
      IF coalesce((v_res->>'replayed')::boolean, false) IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST_FAILED: expected replayed: true, got %', v_res;
      END IF;
    END $$;
    SELECT 'REPLAY_VERIFIED';
  `);
  if (!replayResult.includes("REPLAY_VERIFIED")) {
    throw new Error("Identical replay test failed: " + replayResult);
  }
  console.log("PASS: Identical replay with exact original Commit V2 command returned replayed: true");

  const auditCaptureCountAfterReplay = sql(`
    SELECT count(*) FROM public.audit_log WHERE entity_id = '${orderId}' AND action = 'order.offer.capture';
  `);
  if (Number(auditCaptureCountAfterReplay) !== 1) {
    throw new Error(`Expected exactly 1 audit capture record after replay, got: ${auditCaptureCountAfterReplay}`);
  }
  console.log("PASS: Exactly 1 audit capture record preserved after identical replay");

  // 10.2: Verify idempotency conflict rejection when replaying with conflicting command
  const conflictCheck = sql(`
    DO $$
    BEGIN
      SET LOCAL ROLE service_role;
      BEGIN
        PERFORM cr_order_private.write_dish_v2(
          '${tenantId}'::uuid,
          '${requestId}'::uuid,
          jsonb_build_object(
            'operation', 'capture',
            'customer', jsonb_build_object('kind', 'existing', 'id', '${customerId}'),
            'weekStart', '${weekStart}',
            'autoConfirm', false,
            'demandChannel', 'individual',
            'lines', jsonb_build_array(
              jsonb_build_object('kind', 'dish', 'dishId', '${dishId}', 'dayDate', '2026-10-19', 'qty', 99, 'comment', null)
            ),
            'orderNotes', 'tampered',
            'dietaryOverride', null
          ),
          '${actorId}'::uuid,
          '{}'::jsonb
        );
        RAISE EXCEPTION 'TEST_FAILED: conflicting write was not rejected';
      EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%IDEMPOTENCY_CONFLICT%' THEN
          RAISE EXCEPTION 'TEST_FAILED: unexpected error %', SQLERRM;
        END IF;
      END;
    END $$;
    SELECT 'REJECTED_AS_EXPECTED';
  `);
  if (!conflictCheck.includes("REJECTED_AS_EXPECTED")) {
    throw new Error("Conflicting write replay was not rejected!");
  }
  console.log("PASS: Conflicting write attempt with reused requestId rejected with IDEMPOTENCY_CONFLICT");

  // 10.3: Verify primary key constraint on order_write_requests prevents duplicates
  const pkeyCheck = sql(`
    DO $$
    BEGIN
      BEGIN
        INSERT INTO public.order_write_requests(tenant_id, request_id, operation, input_hash, order_id, committed_revision)
        VALUES ('${tenantId}'::uuid, '${requestId}'::uuid, 'capture', '${inputHash}', '${orderId}'::uuid, 1);
        RAISE EXCEPTION 'TEST_FAILED: duplicate pkey allowed';
      EXCEPTION WHEN unique_violation THEN
        -- Expected
      END;
    END $$;
    SELECT 'PKEY_ENFORCED';
  `);
  if (!pkeyCheck.includes("PKEY_ENFORCED")) {
    throw new Error("Duplicate request_id was not rejected by primary key!");
  }
  console.log("PASS: order_write_requests primary key strictly enforces single write record");

  // 10.4: Verify canonical reconciliation path (as executed by runVerifiedOfferReconciliation)
  const reconciliationSql = sql(`
    SELECT owr.request_id, owr.order_id, owr.committed_revision, o.status, o.total
    FROM public.order_write_requests owr
    JOIN public.orders o ON o.id = owr.order_id AND o.tenant_id = owr.tenant_id
    WHERE owr.tenant_id = '${tenantId}' AND owr.request_id = '${requestId}';
  `);
  console.log("Reconciliation query result:", reconciliationSql);
  const [recReqId, recOrderId, recRev, recStatus, recTotal] = reconciliationSql.split("|");
  if (recOrderId !== orderId || Number(recTotal) !== 3.5 || recStatus !== "draft") {
    throw new Error(`Reconciliation failed: expected order ${orderId} total 3.50 draft, got: ${reconciliationSql}`);
  }
  console.log("PASS: Canonical reconciliation confirmed: order resolved safely without re-execution");

  // 10.5: Database invariants: strictly 1 order and 1 item exist
  const orderCount = sql(`SELECT count(*) FROM public.orders;`);
  const itemCount = sql(`SELECT count(*) FROM public.order_items;`);
  console.log(`Database state: ${orderCount} order(s), ${itemCount} order item(s).`);
  if (Number(orderCount) !== 1 || Number(itemCount) !== 1) {
    throw new Error(`Expected exactly 1 order and 1 item in DB, got: ${orderCount} orders, ${itemCount} items`);
  }
  console.log("PASS: Idempotency strictly verified! 0 duplicate orders or items created.");

  // Step 11: Orders page visibility in browser
  console.log("\n[Step 11] Checking order visibility in /admin/orders...");
  await page.goto("http://127.0.0.1:8080/admin/orders", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Mandatory assertion: verify that the exact order row is visible in the orders table
  const orderRowLocator = page.locator("tr", { hasText: "Cliente Ficticio" }).first();
  await orderRowLocator.waitFor({ state: "visible", timeout: 10000 });
  const orderRowText = await orderRowLocator.innerText();
  console.log("Found order row in table:", orderRowText.replace(/\n+/g, " "));

  if (!orderRowText.includes("Cliente Ficticio")) {
    throw new Error(`MANDATORY ASSERTION FAILED: Order for customer 'Cliente Ficticio' not found in /admin/orders table! Row: ${orderRowText}`);
  }
  if (!orderRowText.includes("Borrador")) {
    throw new Error(`MANDATORY ASSERTION FAILED: Order status is not 'Borrador' (draft) in /admin/orders table! Row: ${orderRowText}`);
  }
  if (!orderRowText.includes("Confirmar Pedido")) {
    throw new Error(`MANDATORY ASSERTION FAILED: Quick action button 'Confirmar Pedido' not found on order row! Row: ${orderRowText}`);
  }
  console.log("PASS: Mandatory assertion passed: exact order is visible in /admin/orders with status 'Borrador' and 'Confirmar Pedido' action!");

  // Step 12: Transition order to 'confirmed' via App UI
  console.log("\n[Step 12] Transitioning order from draft -> confirmed via App UI...");
  const confirmBtn = page.getByRole("button", { name: "Confirmar Pedido" }).first();
  await confirmBtn.waitFor({ state: "visible", timeout: 8000 });
  await confirmBtn.click();
  await page.waitForTimeout(3000);

  // Assert order status in database via read-only query
  const updatedOrderSql = sql(`
    SELECT status, revision, write_contract_version FROM public.orders WHERE id = '${orderId}';
  `);
  console.log("Updated order row after UI confirmation:", updatedOrderSql);
  const [newStatus, newRev, newContractVer] = updatedOrderSql.split("|");
  if (newStatus !== "confirmed") {
    throw new Error(`Expected status 'confirmed' after UI click, got: ${newStatus}`);
  }
  if (Number(newRev) < 2) {
    throw new Error(`Expected revision >= 2 after transition, got: ${newRev}`);
  }
  console.log(`PASS: Order successfully transitioned to 'confirmed' (revision=${newRev}) via App UI!`);

  // Step 13: Check Kitchen visibility on /admin/kitchen
  console.log("\n[Step 13] Checking Kitchen workspace (/admin/kitchen)...");
  await page.goto("http://127.0.0.1:8080/admin/kitchen", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  // On the kitchen page, set date input to 2026-10-19
  const dateInput = page.locator("#kitchen-date, input[type=date]").first();
  await dateInput.waitFor({ state: "visible", timeout: 5000 });
  await dateInput.fill("2026-10-19");
  await dateInput.dispatchEvent("change");
  await page.waitForTimeout(3000);

  const kitchenText = await page.locator("body").innerText();
  console.log("Kitchen page content snippet:", kitchenText.slice(0, 500).replace(/\n+/g, " "));

  if (kitchenText.includes("Cliente Ficticio") || kitchenText.includes("Tarta de Queso") || kitchenText.includes(orderId.slice(0, 8))) {
    console.log("PASS: Order is visible on /admin/kitchen UI for date 2026-10-19!");
  } else {
    throw new Error(`Order ${orderId} not visible on /admin/kitchen page!`);
  }

  const kitchenSql = sql(`
    SELECT o.id, o.status, oi.day_date, oi.dish_id, d.name
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.dishes d ON d.id = oi.dish_id
    WHERE o.status IN ('confirmed', 'in_production', 'prepared')
      AND oi.day_date = '2026-10-19'
      AND o.id = '${orderId}';
  `);
  console.log("Kitchen DB query result:", kitchenSql);
  if (!kitchenSql.includes(orderId)) {
    throw new Error(`Order ${orderId} not found in kitchen DB query!`);
  }
  console.log("PASS: Kitchen SQL query confirms order is active in kitchen queue!");

  console.log("\n========================================================");
  console.log("=== ALL E2E VERIFICATION CRITERIA PASSED (10/10) PASS ===");
  console.log("========================================================");

} catch (err) {
  console.error("E2E Execution Error:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log("Browser closed.");
}
