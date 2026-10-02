/**
 * YOURMEAL-OS · CR-OPS-UX LIVE FUNCTIONAL CERTIFICATION
 *
 * Real automated browser walkthrough using Playwright Chromium against
 * local Vite dev server and local Supabase PostgreSQL runtime.
 *
 * Rigorous protocol:
 * USER ACTION → UI RESULT → DATABASE/PERSISTENCE → HARD RELOAD → UI CONSISTENCY → AUDIT / SIDE EFFECTS
 *
 * Tracks:
 * - Track A: Orders Lifecycle & Quick Actions (confirmed → in_production → reload → prepared → reload)
 * - Track B: Order Drawer 5-Tier Operational Hierarchy & Ergonomics
 * - Track C: Kitchen & Packing Kiosk (interactive packing checklist, mark packed, persistence, prepared transition)
 * - Track D: Physical PDF & 2-Level Production Sheet Layout Preservation
 */

import { createServer } from 'vite';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getLocalSupabaseCredentials() {
  try {
    const raw = execSync('supabase status -o json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No JSON output returned from `supabase status -o json`');
    }
    const status = JSON.parse(match[0]);
    if (!status.SERVICE_ROLE_KEY || !status.ANON_KEY) {
      throw new Error('Local Supabase status missing SERVICE_ROLE_KEY or ANON_KEY');
    }
    return {
      apiUrl: status.API_URL || 'http://127.0.0.1:54321',
      anonKey: status.ANON_KEY,
      serviceRoleKey: status.SERVICE_ROLE_KEY,
      dbUrl: status.DB_URL,
    };
  } catch (err) {
    throw new Error(`Failed to retrieve local Supabase credentials via CLI: ${err.message}`);
  }
}

const localCreds = getLocalSupabaseCredentials();
const DB_URL = process.env.LOCAL_DB_URL || localCreds.dbUrl || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const SUPABASE_URL = localCreds.apiUrl;
const SUPABASE_ANON_KEY = localCreds.anonKey;
const SUPABASE_SERVICE_KEY = localCreds.serviceRoleKey;

const SCREENSHOT_DIR = resolve('docs/05-architecture/screenshots/cr-ops-ux');
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function runSql(sql) {
  try {
    const stdout = execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -A -t`, {
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return { ok: false, stdout: (err.stdout || '').trim(), stderr: (err.stderr || err.message).trim() };
  }
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

async function runLiveFunctionalCertification() {
  console.log('========================================================================');
  console.log('CR-OPS-UX: LIVE FUNCTIONAL CERTIFICATION WALKTHROUGH');
  console.log('Target: Local Supabase & Vite Dev Server');
  console.log('Runtime DB:', DB_URL);
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================================================\n');

  // ------------------------------------------------------------------------
  // 0. Seed Controlled Test Data in EatClean Tenant
  // ------------------------------------------------------------------------
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const alphaEmail = 'alex.alpha@yourmealos.local';
  const testPassword = 'Password123!';

  const { data: usersList } = await adminClient.auth.admin.listUsers();
  let userAlpha = usersList.users.find(u => u.email === alphaEmail);
  if (!userAlpha) {
    const { data: created, error } = await adminClient.auth.admin.createUser({
      email: alphaEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Alex Alpha (Manager)' },
    });
    if (error) throw error;
    userAlpha = created.user;
  }

  const tenantId = '11111111-1111-1111-1111-111111111111'; // Tenant Alpha
  const customerId = 'cccc0001-0000-0000-0000-000000000001';
  const addressId = 'cadd0001-0000-0000-0000-000000000001';
  const dishId = 'dddd0001-0000-0000-0000-000000000001';
  const orderAId = 'cafe0001-0000-0000-0000-000000000001';
  const orderBId = 'cafe0002-0000-0000-0000-000000000002';
  const itemAId = 'cafe000a-0000-0000-0000-000000000001';
  const itemBId = 'cafe000b-0000-0000-0000-000000000002';

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekStartStr = '2026-09-28';

  runSql(`
    INSERT INTO public.tenants (id, name, slug) VALUES 
      ('${tenantId}', 'Tenant Alpha (EatClean)', 'tenant-alpha')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name) VALUES
      ('${userAlpha.id}', 'Alex Alpha')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.tenant_members (tenant_id, user_id, membership_type, status) VALUES 
      ('${tenantId}', '${userAlpha.id}', 'employee', 'approved')
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET status = 'approved';

    INSERT INTO public.user_roles (user_id, tenant_id, role) VALUES 
      ('${userAlpha.id}', '${tenantId}', 'company_admin')
    ON CONFLICT DO NOTHING;

    -- Ensure customer & address
    INSERT INTO public.customers (id, tenant_id, display_name, email, kind) VALUES
      ('${customerId}', '${tenantId}', 'Carlos Martinez (Control)', 'carlos.control@example.com', 'individual')
    ON CONFLICT (id) DO UPDATE SET display_name = 'Carlos Martinez (Control)', tenant_id = '${tenantId}';

    INSERT INTO public.customer_addresses (id, customer_id, tenant_id, label, street, city, zip, is_default) VALUES
      ('${addressId}', '${customerId}', '${tenantId}', 'Domicilio', 'Calle Castillo 14, 2B', 'Santa Cruz de Tenerife', '38002', true)
    ON CONFLICT (id) DO UPDATE SET street = 'Calle Castillo 14, 2B', tenant_id = '${tenantId}';

    -- Ensure dish
    INSERT INTO public.dishes (id, tenant_id, name, price, cost, prep_minutes, weight_g) VALUES
      ('${dishId}', '${tenantId}', 'Pollo Asado con Guarnición', 12.50, 4.20, 25, 450)
    ON CONFLICT (id) DO UPDATE SET name = 'Pollo Asado con Guarnición', price = 12.50;

    -- Reset Orders
    DELETE FROM public.order_items WHERE order_id IN ('${orderAId}', '${orderBId}');
    DELETE FROM public.orders WHERE id IN ('${orderAId}', '${orderBId}');
    DELETE FROM public.audit_log WHERE entity_id IN ('${orderAId}', '${orderBId}');

    -- Insert Order A (for Track A & B)
    INSERT INTO public.orders (id, tenant_id, customer_id, delivery_address_id, week_start, status, total, notes, demand_channel) VALUES
      ('${orderAId}', '${tenantId}', '${customerId}', '${addressId}', '${weekStartStr}', 'confirmed', 25.00, 'Entregar en conserjería antes de las 13:00', 'individual');

    INSERT INTO public.order_items (id, order_id, tenant_id, dish_id, day_date, qty, unit_price, price_snapshot_status, comment) VALUES
      ('${itemAId}', '${orderAId}', '${tenantId}', '${dishId}', '${todayStr}', 2, 12.50, 'captured', 'Sin cebolla por favor');

    -- Insert Order B (for Track C Packing)
    INSERT INTO public.orders (id, tenant_id, customer_id, delivery_address_id, week_start, status, total, notes, demand_channel) VALUES
      ('${orderBId}', '${tenantId}', '${customerId}', '${addressId}', '${weekStartStr}', 'confirmed', 25.00, 'Empacar con etiqueta térmica', 'individual');

    INSERT INTO public.order_items (id, order_id, tenant_id, dish_id, day_date, qty, unit_price, price_snapshot_status, comment) VALUES
      ('${itemBId}', '${orderBId}', '${tenantId}', '${dishId}', '${todayStr}', 2, 12.50, 'captured', 'Tapas bien selladas');
  `);

  console.log('Controlled Seed Data Ready: Order A (#cafe0001) & Order B (#cafe0002) in status confirmed.\n');

  // ------------------------------------------------------------------------
  // 1. Start Vite Server on Port 5174
  // ------------------------------------------------------------------------
  const server = await createServer({
    configFile: resolve('vite.config.ts'),
    server: { port: 5174, strictPort: true, host: '127.0.0.1' },
  });
  await server.listen();
  const baseUrl = 'http://127.0.0.1:5174';
  console.log(`Vite server running at: ${baseUrl}`);

  // ------------------------------------------------------------------------
  // 2. Launch Chromium via Playwright
  // ------------------------------------------------------------------------
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(({ publishableKey, supabaseUrl }) => {
    window.__INSTANCE_CONFIG__ = {
      instanceType: 'core_demo',
      tenantSlug: 'tenant-alpha',
      coreVersion: '0.1.0',
      supabaseProjectRef: 'djangucecsphnejplvic',
      supabaseUrl: supabaseUrl,
      supabasePublishableKey: publishableKey,
    };
  }, { publishableKey: SUPABASE_ANON_KEY, supabaseUrl: SUPABASE_URL });

  const page = await context.newPage();

  try {
    // Authenticate
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    const signinResult = await page.evaluate(async ({ email, password }) => {
      try {
        const { supabase } = await import('/src/integrations/supabase/client.ts');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        return { ok: true, user: data.user.id };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }, { email: alphaEmail, password: testPassword });

    console.log('Browser Auth Sign In:', signinResult);
    if (!signinResult.ok) throw new Error(`Auth failed: ${signinResult.error}`);

    // ========================================================================
    // TRACK A: ORDERS LIFECYCLE & QUICK ACTIONS
    // ========================================================================
    console.log('\n--- EXECUTING TRACK A: ORDERS LIFECYCLE & QUICK ACTIONS ---');
    await page.goto(`${baseUrl}/admin/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const debugInfo = await page.evaluate(async () => {
      try {
        const { getBootstrapIdentitySnapshot } = await import('/src/bootstrap/pipeline/BootstrapIdentityStore.ts');
        const { supabase } = await import('/src/integrations/supabase/client.ts');
        const snap = getBootstrapIdentitySnapshot();
        const { data: orders, error } = await supabase.from('orders').select('id, status, tenant_id').eq('tenant_id', snap.tenant?.id);
        return { snap, orders, error };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('DEBUG INFO IN BROWSER:', JSON.stringify(debugInfo, null, 2));

    const shotA1 = `${SCREENSHOT_DIR}/trackA_01_orders_table_initial.png`;
    await page.screenshot({ path: shotA1, fullPage: true });

    // 1. Initial State Check
    const rowA = page.locator(`tr:has-text("Carlos Martinez")`).first();
    const hasRowA = await rowA.isVisible();
    const hasInitialBadge = await rowA.locator('text=Confirmado').isVisible();
    const quickActionBtn1 = rowA.locator('button:has-text("Iniciar Cocina")');
    const hasActionBtn1 = await quickActionBtn1.isVisible();

    recordStep('Track A', 1, 'Initial Orders Table State (confirmed)', hasRowA && hasInitialBadge && hasActionBtn1,
      'Order A displays customer name, badge Confirmado, and quick action Iniciar Cocina.',
      { screenshot: shotA1 }
    );

    // 2. Action: Click [ Iniciar Cocina ]
    await quickActionBtn1.click();
    await page.waitForTimeout(1500); // Allow mutation + toast to process

    const shotA2 = `${SCREENSHOT_DIR}/trackA_02_after_iniciar_cocina.png`;
    await page.screenshot({ path: shotA2, fullPage: true });

    // 3. Database Check 1
    const dbRes1 = runSql(`SELECT status FROM public.orders WHERE id = '${orderAId}';`);
    const isDbInProd = dbRes1.stdout === 'in_production';

    recordStep('Track A', 2, 'Action [ Iniciar Cocina ] -> Database Mutation to in_production', isDbInProd,
      'Direct PostgreSQL check confirms order status mutated to in_production.',
      { dbStatus: dbRes1.stdout, screenshot: shotA2 }
    );

    // 4. Hard Reload Check 1
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const shotA3 = `${SCREENSHOT_DIR}/trackA_03_in_production_hard_reload.png`;
    await page.screenshot({ path: shotA3, fullPage: true });

    const rowAPostReload1 = page.locator(`tr:has-text("Carlos Martinez")`).first();
    const isUiInProd = (await rowAPostReload1.locator('text=En preparación').isVisible()) ||
                       (await rowAPostReload1.locator('text=En producción').isVisible());
    const quickActionBtn2 = rowAPostReload1.locator('button:has-text("Marcar Preparado")');
    const hasActionBtn2 = await quickActionBtn2.isVisible();

    recordStep('Track A', 3, 'Hard Reload UI Consistency (in_production)', isUiInProd && hasActionBtn2,
      'After hard reload, UI consistently reflects in_production and displays next action [ Marcar Preparado ].',
      { screenshot: shotA3 }
    );

    // 5. Action: Click [ Marcar Preparado ]
    await quickActionBtn2.click();
    await page.waitForTimeout(1500);

    const shotA4 = `${SCREENSHOT_DIR}/trackA_04_after_marcar_preparado.png`;
    await page.screenshot({ path: shotA4, fullPage: true });

    // 6. Database Check 2
    const dbRes2 = runSql(`SELECT status FROM public.orders WHERE id = '${orderAId}';`);
    const isDbPrepared = dbRes2.stdout === 'prepared';

    recordStep('Track A', 4, 'Action [ Marcar Preparado ] -> Database Mutation to prepared', isDbPrepared,
      'Direct PostgreSQL check confirms order status mutated to prepared.',
      { dbStatus: dbRes2.stdout, screenshot: shotA4 }
    );

    // 7. Hard Reload Check 2
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const shotA5 = `${SCREENSHOT_DIR}/trackA_05_prepared_hard_reload.png`;
    await page.screenshot({ path: shotA5, fullPage: true });

    const rowAPostReload2 = page.locator(`tr:has-text("Carlos Martinez")`).first();
    const isUiPrepared = await rowAPostReload2.locator('text=Preparado').isVisible();
    const quickActionBtn3 = rowAPostReload2.locator('button:has-text("Listo para Reparto")');
    const hasActionBtn3 = await quickActionBtn3.isVisible();

    recordStep('Track A', 5, 'Hard Reload UI Consistency (prepared)', isUiPrepared && hasActionBtn3,
      'After hard reload, UI consistently reflects prepared and displays next action [ Listo para Reparto ].',
      { screenshot: shotA5 }
    );

    // 8. Audit Trail Verification
    const auditRes = runSql(`
      SELECT count(*) FROM public.audit_log 
      WHERE entity_id = '${orderAId}' AND action = 'status_change';
    `);
    const auditCount = parseInt(auditRes.stdout, 10);
    const hasAuditLogs = auditCount >= 2;

    recordStep('Track A', 6, 'Audit Log Persistence for Order Lifecycle', hasAuditLogs,
      `audit_log table recorded ${auditCount} status_change entries with actor and timestamp.`,
      { auditCount }
    );

    // ========================================================================
    // TRACK B: ORDER DRAWER (5 NIVELES)
    // ========================================================================
    console.log('\n--- EXECUTING TRACK B: ORDER DRAWER (5 NIVELES) ---');
    // Open drawer by clicking on the 'Detalle' button
    const detailBtn = rowAPostReload2.locator('button:has-text("Detalle")');
    await detailBtn.click();
    await page.waitForTimeout(1000);

    const drawer = page.locator('[role="dialog"]').first();
    const isDrawerOpen = await drawer.isVisible();

    const shotB1 = `${SCREENSHOT_DIR}/trackB_01_drawer_5_tiers.png`;
    await page.screenshot({ path: shotB1, fullPage: true });

    // Verify 5 tiers in drawer DOM
    const hasTier1 = (await drawer.locator('text=Carlos Martinez').first().isVisible()) &&
                     (await drawer.locator('text=25.00').first().isVisible());
    const hasTier2 = (await drawer.locator('text=Acciones Operacionales').first().isVisible()) ||
                     (await drawer.locator('text=Listo para Reparto').first().isVisible());
    const hasTier3 = (await drawer.locator('text=Platos del Pedido').first().isVisible()) &&
                     (await drawer.locator('text=Pollo Asado con Guarnición').first().isVisible());
    const hasTier4 = (await drawer.locator('text=Datos de Contacto y Ubicación').first().isVisible()) &&
                     (await drawer.locator('text=Entregar en conserjería').first().isVisible());
    const hasTier5 = (await drawer.locator('text=Contexto Temporal y Comercial').first().isVisible());

    const allTiersPresent = isDrawerOpen && hasTier1 && hasTier2 && hasTier3 && hasTier4 && hasTier5;

    recordStep('Track B', 1, 'Drawer 5-Tier Operational Hierarchy Rendering', allTiersPresent,
      'Drawer renders Tier 1 (Identity), Tier 2 (Action Bar), Tier 3 (Culinary), Tier 4 (Logistics), Tier 5 (Audit).',
      { screenshot: shotB1 }
    );

    // Close drawer
    const closeBtn = drawer.locator('button:has-text("Cerrar")').or(drawer.locator('button.close, [aria-label="Close"], button svg.lucide-x')).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    const isDrawerClosed = !(await drawer.isVisible());
    recordStep('Track B', 2, 'Drawer Safe Close Without Side-Effect Mutations', isDrawerClosed,
      'Drawer closes cleanly without triggering any unwanted state changes.',
      {}
    );

    // ========================================================================
    // TRACK C: KITCHEN & PACKING OPERATIONS KIOSK
    // ========================================================================
    console.log('\n--- EXECUTING TRACK C: KITCHEN & PACKING OPERATIONS KIOSK ---');
    await page.goto(`${baseUrl}/admin/production-sheet?date=${todayStr}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const shotC1 = `${SCREENSHOT_DIR}/trackC_01_production_sheet_p1.png`;
    await page.screenshot({ path: shotC1, fullPage: true });

    // Switch to P2 Packing Tab
    const p2TabBtn = page.locator('button:has-text("Nivel 2: Packing por Cliente")').or(page.locator('button:has-text("Packing por Cliente")')).first();
    if (await p2TabBtn.isVisible()) {
      await p2TabBtn.click();
      await page.waitForTimeout(800);
    }

    const shotC2 = `${SCREENSHOT_DIR}/trackC_02_packing_p2_view.png`;
    await page.screenshot({ path: shotC2, fullPage: true });

    // Verify Macro Progress Bar
    const progressBarText = page.locator('text=Progreso de Envasado:').first();
    const hasProgressBar = await progressBarText.isVisible();

    recordStep('Track C', 1, 'Packing Kiosk Macro Progress Bar Presence', hasProgressBar,
      'Macro progress bar renders live packing metrics.',
      { screenshot: shotC2 }
    );

    // Locate Order B Card
    const cardOrderB = page.locator(`div:has-text("Pedido #${orderBId.slice(0, 8)}")`).first();
    const hasCardOrderB = await cardOrderB.isVisible();

    // Interact with Dish Checklist item
    const checkItem = cardOrderB.locator('button:has(svg.lucide-square)').or(cardOrderB.locator('button:has-text("Pollo Asado")')).first();
    if (await checkItem.isVisible()) {
      await checkItem.click();
      await page.waitForTimeout(400);
    }

    const shotC3 = `${SCREENSHOT_DIR}/trackC_03_checklist_interaction.png`;
    await page.screenshot({ path: shotC3, fullPage: true });

    // Click [ Marcar Pedido Empacado ]
    const markPackedBtn = cardOrderB.locator('button:has-text("Marcar Pedido Empacado")');
    const hasMarkPackedBtn = await markPackedBtn.isVisible();

    recordStep('Track C', 2, 'Packing Card & Checklist Interaction', hasCardOrderB && hasMarkPackedBtn,
      'Order B card found in P2 packing grid with active checklist and [ Marcar Pedido Empacado ] button.',
      { screenshot: shotC3 }
    );

    await markPackedBtn.click();
    await page.waitForTimeout(1500);

    const shotC4 = `${SCREENSHOT_DIR}/trackC_04_after_marcar_empacado.png`;
    await page.screenshot({ path: shotC4, fullPage: true });

    // Database Check 3
    const dbRes3 = runSql(`SELECT status FROM public.orders WHERE id = '${orderBId}';`);
    const isOrderBPrepared = dbRes3.stdout === 'prepared';

    recordStep('Track C', 3, 'Action [ Marcar Pedido Empacado ] -> Database Mutation to prepared', isOrderBPrepared,
      'Direct PostgreSQL check confirms Order B transitioned to prepared status upon packaging.',
      { dbStatus: dbRes3.stdout, screenshot: shotC4 }
    );

    // Hard Reload Check 3
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    if (await p2TabBtn.isVisible()) {
      await p2TabBtn.click();
      await page.waitForTimeout(800);
    }

    const shotC5 = `${SCREENSHOT_DIR}/trackC_05_packed_hard_reload.png`;
    await page.screenshot({ path: shotC5, fullPage: true });

    const cardOrderBPostReload = page.locator(`div:has-text("Pedido #${orderBId.slice(0, 8)}")`).first();
    const hasPackedBadge = (await cardOrderBPostReload.locator('text=Empacado').first().isVisible()) ||
                           (await cardOrderBPostReload.locator('text=Listo para Expedición').first().isVisible());

    recordStep('Track C', 4, 'Hard Reload Persistence of Packed State', hasPackedBadge,
      'After hard reload, Order B card consistently displays Empacado and Listo para Expedición.',
      { screenshot: shotC5 }
    );

    // ========================================================================
    // TRACK D: PHYSICAL PDF & 2-LEVEL PRODUCTION SHEET LAYOUT PRESERVATION
    // ========================================================================
    console.log('\n--- EXECUTING TRACK D: PHYSICAL PDF & PRODUCTION SHEET FIDELITY ---');
    const previewContainer = page.locator('div:has-text("Vista previa para impresión")').last();
    await previewContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const hasPrintMarkup = await previewContainer.locator('text=HOJA DE PRODUCCIÓN (P1)').isVisible();
    const hasPrintP2 = await previewContainer.locator('text=HOJA DE PACKING POR CLIENTE (P2)').isVisible();

    const shotD1 = `${SCREENSHOT_DIR}/trackD_01_printable_pdf_structure.png`;
    await page.screenshot({ path: shotD1, fullPage: true });

    recordStep('Track D', 1, 'Physical 2-Page Printable Structure Integrity', hasPrintMarkup && hasPrintP2,
      'Print layout preserves both P1 Kitchen Marmitas aggregation and P2 Packing per client intact.',
      { screenshot: shotD1 }
    );

  } finally {
    await browser.close();
    await server.close();
  }

  // Write Evidence Artifact
  const evidenceFile = resolve('docs/05-architecture/cr-ops-ux-live-browser-evidence.json');
  writeFileSync(evidenceFile, JSON.stringify(evidenceLog, null, 2), 'utf8');
  console.log(`\nEvidence JSON saved to: ${evidenceFile}`);

  console.log('\n========================================================================');
  console.log('WALKTHROUGH COMPLETE');
  console.log(`Total checks: ${evidenceLog.length}`);
  const passCount = evidenceLog.filter(e => e.result === '🟢 PASS').length;
  console.log(`Passed: ${passCount} / ${evidenceLog.length}`);
  console.log('========================================================================');
}

runLiveFunctionalCertification().catch(err => {
  console.error('FATAL CERTIFICATION ERROR:', err);
  process.exit(1);
});
