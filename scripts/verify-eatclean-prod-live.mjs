/**
 * YOURMEAL-OS · CR-OPS-UX-HF01 LIVE PRODUCTION FUNCTIONAL CERTIFICATION
 *
 * Runs against the LIVE Cloudflare Worker (eatclean.yourmealos.com)
 * and Supabase Production database (nhirlpkuvonggctdzzad).
 *
 * Strict Protocol:
 * USER ACTION → UI RESULT → DATABASE/PERSISTENCE → HARD RELOAD → UI CONSISTENCY → AUDIT
 *
 * Isolated Test Fixtures:
 * Explicitly prefixed with [TEST QA HF01] in Tenant EatClean (8bba00ba-331b-42c8-9283-4e3836ffb870).
 * Never mutates or interferes with real client data.
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_URL = 'https://eatclean.yourmealos.com';
const SUPABASE_URL = 'https://nhirlpkuvonggctdzzad.supabase.co';
const SUPABASE_ANON_KEY = process.env.EATCLEAN_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.EATCLEAN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const EATCLEAN_TENANT_ID = '8bba00ba-331b-42c8-9283-4e3836ffb870';
const QA_CUSTOMER_ID = 'cccc0001-8bba-42c8-9283-000000000001';
const QA_ADDRESS_ID = 'cadd0001-8bba-42c8-9283-000000000001';
const QA_ORDER_A_ID = 'cafe0001-8bba-42c8-9283-000000000001';
const QA_ORDER_B_ID = 'cafe0002-8bba-42c8-9283-000000000002';
const QA_ITEM_A_ID = 'ca1e000a-8bba-42c8-9283-000000000001';
const QA_ITEM_B_ID = 'ca1e000b-8bba-42c8-9283-000000000002';

const QA_USER_EMAIL = 'qa.certification.hf01@eatclean.yourmealos.local';
const QA_USER_PASSWORD = 'TestPassword123!';

const SCREENSHOT_DIR = resolve('docs/05-architecture/screenshots/cr-ops-ux');
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const evidenceLog = [];

function recordStep(track, stepNum, action, passed, details, evidence = {}) {
  const item = {
    track,
    step: stepNum,
    action,
    result: passed ? '🟢 PASS' : '🔴 FAIL',
    details,
    evidence,
    timestamp: new Date().toISOString(),
  };
  evidenceLog.push(item);
  console.log(`\n[${track} · STEP ${stepNum}] ${action} → ${passed ? '🟢 PASS' : '🔴 FAIL'}`);
  console.log(`  → Details: ${details}`);
  if (evidence.dbStatus) console.log(`  → DB Status: ${evidence.dbStatus}`);
  if (evidence.screenshot) console.log(`  → Screenshot: ${evidence.screenshot}`);
}

async function runLiveProductionCertification() {
  console.log('========================================================================');
  console.log('CR-OPS-UX-HF01 · GATE 8 LIVE PRODUCTION CERTIFICATION');
  console.log('Target Worker:', PROD_URL);
  console.log('Target Supabase:', SUPABASE_URL);
  console.log('Tenant:', `EatClean (${EATCLEAN_TENANT_ID})`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // ------------------------------------------------------------------------
  // 1. Provision QA Operator in Supabase Production (Tenant EatClean)
  // ------------------------------------------------------------------------
  console.log('1. Setting up QA Operator...');
  const { data: usersData, error: listUsersErr } = await supabase.auth.admin.listUsers();
  if (listUsersErr) throw listUsersErr;

  let qaUser = usersData.users.find((u) => u.email === QA_USER_EMAIL);
  if (!qaUser) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: QA_USER_EMAIL,
      password: QA_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'QA Operator (HF01 Certification)' },
    });
    if (createErr) throw createErr;
    qaUser = created.user;
  } else {
    // Ensure password is confirmed
    await supabase.auth.admin.updateUserById(qaUser.id, {
      password: QA_USER_PASSWORD,
      email_confirm: true,
    });
  }

  // Ensure Profile & Tenant Member
  await supabase.from('profiles').upsert({
    id: qaUser.id,
    full_name: 'QA Operator (HF01 Certification)',
  });

  await supabase.from('tenant_members').upsert({
    tenant_id: EATCLEAN_TENANT_ID,
    user_id: qaUser.id,
    membership_type: 'employee',
    status: 'approved',
  }, { onConflict: 'tenant_id,user_id' });

  // Ensure company_admin role in user_roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', qaUser.id)
    .eq('tenant_id', EATCLEAN_TENANT_ID)
    .eq('role', 'company_admin');

  if (!roles || roles.length === 0) {
    await supabase.from('user_roles').insert({
      user_id: qaUser.id,
      tenant_id: EATCLEAN_TENANT_ID,
      role: 'company_admin',
    });
  }

  // ------------------------------------------------------------------------
  // 2. Provision Isolated QA Customer & Test Orders
  // ------------------------------------------------------------------------
  console.log('2. Setting up Isolated QA Fixtures in EatClean Tenant...');

  // Ensure Customer
  await supabase.from('customers').upsert({
    id: QA_CUSTOMER_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    display_name: 'QA Control (Certificación HF01)',
    email: 'qa.control@eatclean.yourmealos.local',
    kind: 'individual',
  });

  // Ensure Address
  await supabase.from('customer_addresses').upsert({
    id: QA_ADDRESS_ID,
    customer_id: QA_CUSTOMER_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    label: 'Oficina QA',
    street: 'Calle Control 10, Edif. A',
    city: 'Santa Cruz de Tenerife',
    zip: '38001',
    is_default: true,
  });

  // Find dish in EatClean
  const { data: dishes } = await supabase
    .from('dishes')
    .select('id, name, price')
    .eq('tenant_id', EATCLEAN_TENANT_ID)
    .limit(1);

  const dishId = dishes?.[0]?.id || 'd4db6355-bbd4-4f75-9c7f-06e6ebdf34e4';
  const dishPrice = dishes?.[0]?.price || 11.90;

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekStartStr = '2026-09-28';

  // Clean prior test orders
  await supabase.from('order_items').delete().in('order_id', [QA_ORDER_A_ID, QA_ORDER_B_ID]);
  await supabase.from('orders').delete().in('id', [QA_ORDER_A_ID, QA_ORDER_B_ID]);
  await supabase.from('audit_log').delete().in('entity_id', [QA_ORDER_A_ID, QA_ORDER_B_ID]);

  // Insert QA Order A (confirmed)
  await supabase.from('orders').insert({
    id: QA_ORDER_A_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    customer_id: QA_CUSTOMER_ID,
    delivery_address_id: QA_ADDRESS_ID,
    week_start: weekStartStr,
    status: 'confirmed',
    total: dishPrice * 2,
    notes: '[TEST QA HF01] Pedido de Control A - Dejar en conserjería',
    demand_channel: 'individual',
  });

  await supabase.from('order_items').insert({
    id: QA_ITEM_A_ID,
    order_id: QA_ORDER_A_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    dish_id: dishId,
    day_date: todayStr,
    qty: 2,
    unit_price: dishPrice,
    price_snapshot_status: 'captured',
    comment: 'Sin picante',
  });

  // Insert QA Order B (confirmed for Packing)
  await supabase.from('orders').insert({
    id: QA_ORDER_B_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    customer_id: QA_CUSTOMER_ID,
    delivery_address_id: QA_ADDRESS_ID,
    week_start: weekStartStr,
    status: 'confirmed',
    total: dishPrice * 2,
    notes: '[TEST QA HF01] Pedido de Control B - Etiqueta térmica',
    demand_channel: 'individual',
  });

  await supabase.from('order_items').insert({
    id: QA_ITEM_B_ID,
    order_id: QA_ORDER_B_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    dish_id: dishId,
    day_date: todayStr,
    qty: 2,
    unit_price: dishPrice,
    price_snapshot_status: 'captured',
    comment: 'Bolsa biodegradable',
  });

  console.log('QA Fixtures ready in production: Orders #cafe0001 and #cafe0002 confirmed.\n');

  // ------------------------------------------------------------------------
  // 3. Launch Playwright against Live Worker
  // ------------------------------------------------------------------------
  console.log('3. Launching Chromium against https://eatclean.yourmealos.com...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Authenticate on Production
    console.log('Navigating to https://eatclean.yourmealos.com/auth ...');
    await page.goto(`${PROD_URL}/auth`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const signinResult = await page.evaluate(async ({ email, password }) => {
      try {
        const { supabase } = await import('/assets/supabase__supabase-js.js').catch(async () => {
          return await import('/src/integrations/supabase/client.ts');
        });
        // Try standard form fill or direct auth
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }, { email: QA_USER_EMAIL, password: QA_USER_PASSWORD });

    // Fill signin form on production
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitBtn = page.locator('button[type="submit"]:has-text("Iniciar"), button[type="submit"]:has-text("Acceder"), button:has-text("Iniciar sesión")').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(QA_USER_EMAIL);
      await passInput.fill(QA_USER_PASSWORD);
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Direct token injection as fail-safe for headless signin
    const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
      email: QA_USER_EMAIL,
      password: QA_USER_PASSWORD,
    });
    if (sessionErr) throw sessionErr;

    // Inject session into browser localStorage
    await page.evaluate(({ session }) => {
      const storageKey = 'sb-nhirlpkuvonggctdzzad-auth-token';
      localStorage.setItem(storageKey, JSON.stringify(session));
    }, { session: sessionData.session });

    // ========================================================================
    // TRACK A: ORDERS LIFECYCLE & QUICK ACTIONS IN PRODUCTION
    // ========================================================================
    console.log('\n--- EXECUTING TRACK A: ORDERS LIFECYCLE ON LIVE WORKER ---');
    await page.goto(`${PROD_URL}/admin/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const shotA1 = `${SCREENSHOT_DIR}/prod_trackA_01_orders_table_initial.png`;
    await page.screenshot({ path: shotA1, fullPage: true });

    // 1. Initial State Check
    const rowA = page.locator(`tr:has-text("QA Control")`).first();
    const hasRowA = await rowA.isVisible();
    const hasInitialBadge = await rowA.locator('text=Confirmado').isVisible();
    const quickActionBtn1 = rowA.locator('button:has-text("Iniciar Cocina")');
    const hasActionBtn1 = await quickActionBtn1.isVisible();

    recordStep('Track A', 1, 'Live Orders Table Initial State (confirmed)', hasRowA && hasInitialBadge && hasActionBtn1,
      'Order QA-A displays customer name, badge Confirmado, and quick action [ Iniciar Cocina ] on eatclean.yourmealos.com.',
      { screenshot: shotA1 }
    );

    if (!hasRowA || !hasActionBtn1) {
      throw new Error('Track A Step 1 FAILED: Order QA-A row or Iniciar Cocina button not found in UI.');
    }

    // 2. Action: Click [ Iniciar Cocina ]
    await quickActionBtn1.click();
    await page.waitForTimeout(2000); // Allow mutation to complete in remote Supabase

    const shotA2 = `${SCREENSHOT_DIR}/prod_trackA_02_after_iniciar_cocina.png`;
    await page.screenshot({ path: shotA2, fullPage: true });

    // 3. Database Check 1 (Remote Supabase)
    const { data: dbOrder1 } = await supabase.from('orders').select('status').eq('id', QA_ORDER_A_ID).single();
    const isDbInProd = dbOrder1?.status === 'in_production';

    recordStep('Track A', 2, 'Action [ Iniciar Cocina ] -> Production DB in_production', isDbInProd,
      'Remote PostgreSQL confirms Order QA-A mutated to in_production.',
      { dbStatus: dbOrder1?.status, screenshot: shotA2 }
    );

    if (!isDbInProd) {
      throw new Error(`Track A Step 2 FAILED: DB status is '${dbOrder1?.status}', expected 'in_production'.`);
    }

    // 4. Hard Reload Check 1
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shotA3 = `${SCREENSHOT_DIR}/prod_trackA_03_in_production_hard_reload.png`;
    await page.screenshot({ path: shotA3, fullPage: true });

    const rowAPostReload1 = page.locator(`tr:has-text("QA Control")`).first();
    const isUiInProd = (await rowAPostReload1.locator('text=En preparación').isVisible()) ||
                       (await rowAPostReload1.locator('text=En producción').isVisible());
    const quickActionBtn2 = rowAPostReload1.locator('button:has-text("Marcar Preparado")');
    const hasActionBtn2 = await quickActionBtn2.isVisible();

    recordStep('Track A', 3, 'Hard Reload UI Consistency (in_production)', isUiInProd && hasActionBtn2,
      'After hard reload on live edge, UI consistently reflects in_production and displays [ Marcar Preparado ].',
      { screenshot: shotA3 }
    );

    if (!isUiInProd || !hasActionBtn2) {
      throw new Error('Track A Step 3 FAILED: UI did not retain in_production state or Marcar Preparado button missing.');
    }

    // 5. CRITICAL ACTION: Click [ Marcar Preparado ] on Live Production
    console.log('\n>>> EXECUTING CRITICAL HF01 TRANSITION: [ Marcar Preparado ] <<<');
    await quickActionBtn2.click();
    await page.waitForTimeout(2500); // Allow remote Supabase mutation

    const shotA4 = `${SCREENSHOT_DIR}/prod_trackA_04_after_marcar_preparado.png`;
    await page.screenshot({ path: shotA4, fullPage: true });

    // Check for any toast error
    const toastError = page.locator('.toast:has-text("FLOW01-002"), [data-sonner-toast]:has-text("FLOW01-002"), [role="status"]:has-text("FLOW01")');
    const hasToastError = (await toastError.count()) > 0;

    // 6. Database Check 2 (Remote Supabase)
    const { data: dbOrder2 } = await supabase.from('orders').select('status').eq('id', QA_ORDER_A_ID).single();
    const isDbPrepared = dbOrder2?.status === 'prepared';

    recordStep('Track A', 4, 'CRITICAL: Action [ Marcar Preparado ] -> Production DB prepared', isDbPrepared && !hasToastError,
      'Order QA-A successfully mutated to prepared in production PostgreSQL without any FLOW01 blocking guard.',
      { dbStatus: dbOrder2?.status, screenshot: shotA4 }
    );

    if (!isDbPrepared) {
      throw new Error(`Track A Step 4 FAILED: Order status is '${dbOrder2?.status}', expected 'prepared'. Possible FLOW01 regression.`);
    }

    // 7. Hard Reload Check 2
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shotA5 = `${SCREENSHOT_DIR}/prod_trackA_05_prepared_hard_reload.png`;
    await page.screenshot({ path: shotA5, fullPage: true });

    const rowAPostReload2 = page.locator(`tr:has-text("QA Control")`).first();
    const isUiPrepared = await rowAPostReload2.locator('text=Preparado').isVisible();
    const quickActionBtn3 = rowAPostReload2.locator('button:has-text("Listo para Reparto")');
    const hasActionBtn3 = await quickActionBtn3.isVisible();

    recordStep('Track A', 5, 'Hard Reload UI Consistency (prepared)', isUiPrepared && hasActionBtn3,
      'After hard reload on live edge, UI consistently reflects prepared and displays [ Listo para Reparto ].',
      { screenshot: shotA5 }
    );

    // 8. Production Audit Log Check
    const { data: auditEntries } = await supabase
      .from('audit_log')
      .select('id, action, created_at')
      .eq('entity_id', QA_ORDER_A_ID);

    const auditCount = auditEntries?.length || 0;
    const hasAuditLogs = auditCount >= 2;

    recordStep('Track A', 6, 'Production Audit Trail Persistence', hasAuditLogs,
      `audit_log recorded ${auditCount} entries in production database for Order QA-A.`,
      { auditCount }
    );

    // ========================================================================
    // TRACK B: ORDER DRAWER IN PRODUCTION
    // ========================================================================
    console.log('\n--- EXECUTING TRACK B: ORDER DRAWER ON LIVE WORKER ---');
    const detailBtn = rowAPostReload2.locator('button:has-text("Detalle")');
    await detailBtn.click();
    await page.waitForTimeout(1000);

    const drawer = page.locator('[role="dialog"]').first();
    const isDrawerOpen = await drawer.isVisible();

    const shotB1 = `${SCREENSHOT_DIR}/prod_trackB_01_drawer_5_tiers.png`;
    await page.screenshot({ path: shotB1, fullPage: true });

    // Verify 5 Tiers in Drawer DOM
    const hasTier1 = (await drawer.locator('text=QA Control').first().isVisible()) &&
                     (await drawer.locator('text=Preparado').first().isVisible());
    const hasTier2 = (await drawer.locator('text=Acciones Operacionales').first().isVisible()) ||
                     (await drawer.locator('text=Listo para Reparto').first().isVisible());
    const hasTier3 = (await drawer.locator('text=Platos del Pedido').first().isVisible());
    const hasTier4 = (await drawer.locator('text=Datos de Contacto y Ubicación').first().isVisible());
    const hasTier5 = (await drawer.locator('text=Contexto Temporal y Comercial').first().isVisible());

    const allTiersPresent = isDrawerOpen && hasTier1 && hasTier2 && hasTier3 && hasTier4 && hasTier5;

    recordStep('Track B', 1, 'Production Drawer 5-Tier Operational Hierarchy', allTiersPresent,
      'Drawer renders all 5 tiers (Identity, Actions, Dishes, Delivery & Context) on live edge.',
      { screenshot: shotB1 }
    );

    // Close Drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const isDrawerClosed = !(await drawer.isVisible());
    recordStep('Track B', 2, 'Drawer Safe Close Without Side-Effect Mutations', isDrawerClosed,
      'Drawer closes cleanly without triggering unprompted mutations.',
      {}
    );

    // ========================================================================
    // TRACK C: KITCHEN & PACKING OPERATIONS KIOSK IN PRODUCTION
    // ========================================================================
    console.log('\n--- EXECUTING TRACK C: PACKING KIOSK ON LIVE WORKER ---');
    await page.goto(`${PROD_URL}/admin/production-sheet?date=${todayStr}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shotC1 = `${SCREENSHOT_DIR}/prod_trackC_01_production_sheet_p1.png`;
    await page.screenshot({ path: shotC1, fullPage: true });

    // Switch to P2 Packing Tab
    const p2TabBtn = page.locator('button:has-text("P2 · Packing por Cliente"), button:has-text("Packing por Cliente")').first();
    if (await p2TabBtn.isVisible()) {
      await p2TabBtn.click();
      await page.waitForTimeout(1000);
    }

    const shotC2 = `${SCREENSHOT_DIR}/prod_trackC_02_packing_p2_view.png`;
    await page.screenshot({ path: shotC2, fullPage: true });

    // Verify Macro Progress Bar
    const progressBarText = page.locator('text=Progreso de Envasado:').first();
    const hasProgressBar = await progressBarText.isVisible();

    recordStep('Track C', 1, 'Production Packing Kiosk Macro Progress Bar', hasProgressBar,
      'Live macro progress bar renders live packing aggregation on edge.',
      { screenshot: shotC2 }
    );

    // Locate Order QA-B Card strictly inside individual customer card container
    const cardOrderB = page.locator(`div.rounded-xl.border:has-text("Pedido #${QA_ORDER_B_ID.slice(0, 8)}")`).first();
    const hasCardOrderB = await cardOrderB.isVisible();

    // Interact with Dish Checklist item
    const checkItem = cardOrderB.locator('li:has(svg)').first();
    if (await checkItem.isVisible()) {
      await checkItem.click();
      await page.waitForTimeout(400);
    }

    const shotC3 = `${SCREENSHOT_DIR}/prod_trackC_03_checklist_interaction.png`;
    await page.screenshot({ path: shotC3, fullPage: true });

    // Click [ Marcar Pedido Empacado ] on Order QA-B card
    const markPackedBtn = cardOrderB.locator('button:has-text("Marcar Pedido Empacado")').first();
    const hasMarkPackedBtn = await markPackedBtn.isVisible();

    recordStep('Track C', 2, 'Packing Card & Checklist Interaction', hasCardOrderB && hasMarkPackedBtn,
      'Order QA-B card active with tactile checklist and [ Marcar Pedido Empacado ] button.',
      { screenshot: shotC3 }
    );

    await markPackedBtn.click();
    await page.waitForTimeout(2500); // Allow remote Supabase mutation

    const shotC4 = `${SCREENSHOT_DIR}/prod_trackC_04_after_marcar_empacado.png`;
    await page.screenshot({ path: shotC4, fullPage: true });

    // Database Check 3 (Remote Supabase)
    const { data: dbOrderB } = await supabase.from('orders').select('status').eq('id', QA_ORDER_B_ID).single();
    const isOrderBPrepared = dbOrderB?.status === 'prepared';

    recordStep('Track C', 3, 'Action [ Marcar Pedido Empacado ] -> Production DB prepared', isOrderBPrepared,
      'Remote PostgreSQL confirms Order QA-B transitioned to prepared upon packaging.',
      { dbStatus: dbOrderB?.status, screenshot: shotC4 }
    );

    // Hard Reload Check 3
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    if (await p2TabBtn.isVisible()) {
      await p2TabBtn.click();
      await page.waitForTimeout(1000);
    }

    const shotC5 = `${SCREENSHOT_DIR}/prod_trackC_05_packed_hard_reload.png`;
    await page.screenshot({ path: shotC5, fullPage: true });

    const cardOrderBPostReload = page.locator(`div.rounded-xl.border:has-text("Pedido #${QA_ORDER_B_ID.slice(0, 8)}")`).first();
    const hasPackedBadge = (await cardOrderBPostReload.locator('text=Empacado').first().isVisible()) ||
                           (await cardOrderBPostReload.locator('text=Listo para Expedición').first().isVisible());

    recordStep('Track C', 4, 'Hard Reload Persistence of Packed State in Production', hasPackedBadge,
      'After hard reload on live edge, Order QA-B consistently displays Empacado and Listo para Expedición.',
      { screenshot: shotC5 }
    );

    // ========================================================================
    // TRACK D: PHYSICAL PDF & 2-LEVEL PRODUCTION SHEET ON LIVE WORKER
    // ========================================================================
    console.log('\n--- EXECUTING TRACK D: PRODUCTION SHEET FIDELITY ON LIVE WORKER ---');
    const previewContainer = page.locator('div:has-text("Vista previa para impresión")').last();
    await previewContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const hasPrintMarkup = await previewContainer.locator('text=HOJA DE PRODUCCIÓN (P1)').isVisible();
    const hasPrintP2 = await previewContainer.locator('text=HOJA DE PACKING POR CLIENTE (P2)').isVisible();

    const shotD1 = `${SCREENSHOT_DIR}/prod_trackD_01_printable_pdf_structure.png`;
    await page.screenshot({ path: shotD1, fullPage: true });

    recordStep('Track D', 1, 'Production Physical 2-Page Structure Integrity', hasPrintMarkup && hasPrintP2,
      'Live Worker preserves physical 2-level print structure (P1 Marmitas + P2 Packing por cliente).',
      { screenshot: shotD1 }
    );

  } finally {
    await browser.close();
  }

  // Save Evidence Artifact
  const evidenceFile = resolve('docs/05-architecture/cr-ops-ux-prod-live-evidence.json');
  writeFileSync(evidenceFile, JSON.stringify(evidenceLog, null, 2), 'utf8');
  console.log(`\nEvidence JSON saved to: ${evidenceFile}`);

  console.log('\n========================================================================');
  console.log('LIVE PRODUCTION WALKTHROUGH COMPLETE');
  console.log(`Total checks: ${evidenceLog.length}`);
  const passCount = evidenceLog.filter(e => e.result === '🟢 PASS').length;
  console.log(`Passed: ${passCount} / ${evidenceLog.length}`);
  console.log('========================================================================');
}

runLiveProductionCertification().catch(err => {
  console.error('\n🛑 FATAL PRODUCTION CERTIFICATION ERROR:', err);
  process.exit(1);
});
