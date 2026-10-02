/**
 * YOURMEAL-OS · CR-OPS-DIET-01 LIVE PRODUCTION E2E CERTIFICATION
 *
 * Verifies the complete integral dietary loop on live production:
 * 1. P2: Compact Dietary Badges in OrdersTable (/admin/orders)
 * 2. P1: Customer Dietary Self-Service (/app/settings/dietary) with UI -> DB persistence -> hard reload
 * 3. P1: Customer Order Summary Dietary Snapshot Verification (/app/orders/$orderId)
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const PROD_URL = 'https://eatclean.yourmealos.com';
const SUPABASE_URL = 'https://nhirlpkuvonggctdzzad.supabase.co';

function getServiceKey() {
  if (process.env.EATCLEAN_SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.EATCLEAN_SUPABASE_SERVICE_ROLE_KEY;
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  try {
    const key = execSync('security find-generic-password -s eatcleanbackend -w 2>/dev/null', { encoding: 'utf8' }).trim();
    if (key) return key;
  } catch {}
  throw new Error('Supabase Secret Key not available.');
}

const SUPABASE_SERVICE_KEY = getServiceKey();
const EATCLEAN_TENANT_ID = '8bba00ba-331b-42c8-9283-4e3836ffb870';
const OPS_MANAGER_EMAIL = 'qa.ops.manager.hf01@eatclean.yourmealos.local';
const OPS_MANAGER_PASSWORD = 'TestOpsPassword123!';

const CUSTOMER_EMAIL = 'qa.customer.diet01@eatclean.yourmealos.local';
const CUSTOMER_PASSWORD = 'TestCustPassword123!';
const QA_CUSTOMER_ID = 'cccc0002-8bba-42c8-9283-000000000002';
const QA_ORDER_ID = '00000002-8bba-42c8-9283-000000000002';

const SCREENSHOT_DIR = resolve('docs/05-architecture/screenshots/cr-ops-diet-01');
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const evidenceLog = [];

function recordStep(stepNum, action, passed, details, evidence = {}) {
  const item = {
    step: stepNum,
    action,
    result: passed ? '🟢 PASS' : '🔴 FAIL',
    details,
    evidence,
    timestamp: new Date().toISOString(),
  };
  evidenceLog.push(item);
  console.log(`\n[STEP ${stepNum}] ${action} → ${passed ? '🟢 PASS' : '🔴 FAIL'}`);
  console.log(`  → Details: ${details}`);
  if (evidence.dbStatus) console.log(`  → DB Status: ${evidence.dbStatus}`);
  if (evidence.screenshot) console.log(`  → Screenshot: ${evidence.screenshot}`);
}

async function runLiveCertification() {
  console.log('========================================================================');
  console.log('CR-OPS-DIET-01 · GATE 8 LIVE PRODUCTION E2E CERTIFICATION');
  console.log('Target Worker:', PROD_URL);
  console.log('Target Supabase:', SUPABASE_URL);
  console.log('Tenant:', `EatClean (${EATCLEAN_TENANT_ID})`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================================================\n');

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Ensure QA Users exist
  console.log('1. Setting up QA users...');
  const { data: usersData, error: listUsersErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listUsersErr) throw listUsersErr;

  // Ops Manager User
  let opsUser = usersData.users.find((u) => u.email === OPS_MANAGER_EMAIL);
  if (!opsUser) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: OPS_MANAGER_EMAIL,
      password: OPS_MANAGER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'QA Ops Manager (DIET-01)' },
    });
    if (createErr) throw createErr;
    opsUser = created.user;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(opsUser.id, {
      password: OPS_MANAGER_PASSWORD,
      email_confirm: true,
    });
  }

  await supabaseAdmin.from('profiles').upsert({
    id: opsUser.id,
    full_name: 'QA Ops Manager (DIET-01)',
  });

  await supabaseAdmin.from('tenant_members').upsert({
    tenant_id: EATCLEAN_TENANT_ID,
    user_id: opsUser.id,
    membership_type: 'employee',
    status: 'approved',
  }, { onConflict: 'tenant_id,user_id' });

  await supabaseAdmin.from('user_roles').delete().eq('user_id', opsUser.id);
  await supabaseAdmin.from('user_roles').insert({
    user_id: opsUser.id,
    tenant_id: EATCLEAN_TENANT_ID,
    role: 'operations_manager',
  });

  // Customer User
  let custUser = usersData.users.find((u) => u.email === CUSTOMER_EMAIL);
  if (!custUser) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'QA Comensal (DIET-01)' },
    });
    if (createErr) throw createErr;
    custUser = created.user;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(custUser.id, {
      password: CUSTOMER_PASSWORD,
      email_confirm: true,
    });
  }

  await supabaseAdmin.from('profiles').upsert({
    id: custUser.id,
    full_name: 'QA Comensal (DIET-01)',
  });

  await supabaseAdmin.from('tenant_members').upsert({
    tenant_id: EATCLEAN_TENANT_ID,
    user_id: custUser.id,
    membership_type: 'customer',
    status: 'approved',
  }, { onConflict: 'tenant_id,user_id' });

  await supabaseAdmin.from('user_roles').delete().eq('user_id', custUser.id);
  await supabaseAdmin.from('user_roles').insert({
    user_id: custUser.id,
    tenant_id: EATCLEAN_TENANT_ID,
    role: 'customer',
  });

  // Link Customer record in public.customers
  await supabaseAdmin.from('customers').upsert({
    id: QA_CUSTOMER_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    user_id: custUser.id,
    kind: 'individual',
    display_name: 'QA Comensal Dietético',
    deleted_at: null,
  }, { onConflict: 'id' });

  // Clear previous dietary profile for QA customer for a clean test run
  await supabaseAdmin.from('customer_dietary_profiles').delete().eq('customer_id', QA_CUSTOMER_ID);

  // Provision an order with dietary snapshot for P2 and P1 verification
  const testSnapshot = {
    capturedAt: new Date().toISOString(),
    allergens: ['gluten', 'milk'],
    customAllergens: ['kiwi'],
    restrictions: ['celiac'],
    preferences: ['vegetarian'],
    dietaryNotes: 'Alergia severa a trazas de kiwi y gluten.',
    isOverride: false,
    overrideReason: null,
    authorUserId: opsUser.id,
  };

  await supabaseAdmin.from('orders').upsert({
    id: QA_ORDER_ID,
    tenant_id: EATCLEAN_TENANT_ID,
    customer_id: QA_CUSTOMER_ID,
    week_start: '2026-10-05',
    status: 'confirmed',
    total: 29.50,
    dietary_snapshot: testSnapshot,
    deleted_at: null,
  }, { onConflict: 'id' });

  // Provision dish and order_items so the order has items and portions
  const { data: dishes } = await supabaseAdmin
    .from('dishes')
    .select('id, name')
    .eq('tenant_id', EATCLEAN_TENANT_ID)
    .limit(1);

  if (dishes && dishes.length > 0) {
    const dishId = dishes[0].id;
    await supabaseAdmin.from('order_items').delete().eq('order_id', QA_ORDER_ID);
    await supabaseAdmin.from('order_items').insert({
      id: '00000002-8bba-42c8-9283-000000000010',
      tenant_id: EATCLEAN_TENANT_ID,
      order_id: QA_ORDER_ID,
      dish_id: dishId,
      day_date: '2026-10-05',
      qty: 2,
      unit_price: 14.75,
      comment: null,
    });
  }

  console.log('QA Environment and records prepared successfully.\n');

  // Launch Playwright Browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'es-ES',
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error('[BROWSER PAGE ERROR]', err);
  });

  try {
    // =========================================================================
    // TRACK 1: P2 ALERTS IN ORDERSTABLE (/admin/orders)
    // =========================================================================
    console.log('--- TRACK 1: P2 ALERTS IN ORDERSTABLE ---');

    // Authenticate as Ops Manager via session injection
    const { data: opsSession, error: opsSessionErr } = await supabaseAdmin.auth.signInWithPassword({
      email: OPS_MANAGER_EMAIL,
      password: OPS_MANAGER_PASSWORD,
    });
    if (opsSessionErr) throw opsSessionErr;

    await page.goto(`${PROD_URL}/auth`, { waitUntil: 'networkidle' });
    await page.evaluate(({ session }) => {
      localStorage.setItem('sb-nhirlpkuvonggctdzzad-auth-token', JSON.stringify(session));
    }, { session: opsSession.session });

    // Navigate to /admin/orders
    await page.goto(`${PROD_URL}/admin/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const ordersTableHtml = await page.content();
    const hasDietaryBadges = ordersTableHtml.includes('Gluten') || ordersTableHtml.includes('Lácteos') || ordersTableHtml.includes('kiwi');

    const screenshotP2 = resolve(SCREENSHOT_DIR, '01-admin-orders-table-dietary-badges.png');
    await page.screenshot({ path: screenshotP2, fullPage: true });

    recordStep(
      1,
      'P2: Alertas de Alérgenos Compactas en OrdersTable (/admin/orders)',
      hasDietaryBadges,
      'OrdersTable renderiza las alertas dietéticas compactas directamente en la columna Cliente para pedidos con snapshot.',
      {
        hasDietaryBadges,
        orderId: QA_ORDER_ID,
        screenshot: screenshotP2,
      }
    );

    // =========================================================================
    // TRACK 2: P1 CUSTOMER SELF-SERVICE (/app/settings/dietary)
    // =========================================================================
    console.log('\n--- TRACK 2: P1 CUSTOMER SELF-SERVICE ---');

    // Authenticate as Customer via session injection
    const { data: custSession, error: custSessionErr } = await supabaseAdmin.auth.signInWithPassword({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
    });
    if (custSessionErr) throw custSessionErr;

    await page.goto(`${PROD_URL}/auth`, { waitUntil: 'networkidle' });
    await page.evaluate(({ session }) => {
      localStorage.setItem('sb-nhirlpkuvonggctdzzad-auth-token', JSON.stringify(session));
    }, { session: custSession.session });

    // Navigate to /app/settings
    await page.goto(`${PROD_URL}/app/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const settingsHtml = await page.content();
    const hasAllergiesLink = settingsHtml.includes('/app/settings/dietary');

    recordStep(
      2,
      'P1: Enlace activo a Configuración Dietética en /app/settings',
      hasAllergiesLink,
      'La pantalla de ajustes del cliente expone el enlace a /app/settings/dietary en el grupo de alimentación.',
      { hasAllergiesLink }
    );

    // Navigate to /app/settings/dietary
    await page.goto(`${PROD_URL}/app/settings/dietary`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const dietaryPageHtml = await page.content();
    const hasDisclaimer = dietaryPageHtml.includes('El perfil dietético informa exclusivamente');
    const hasEU14 = dietaryPageHtml.includes('Alérgenos de Declaración Obligatoria (UE 14)');

    recordStep(
      3,
      'P1: Carga de Pantalla Autoservicio y Disclaimer Constitucional (/app/settings/dietary)',
      hasDisclaimer && hasEU14,
      'La pantalla de autoservicio carga el catálogo UE-14 y el Aviso Constitucional de Seguridad Alimentaria.',
      { hasDisclaimer, hasEU14 }
    );

    // Configure customer profile: toggle Crustáceos, add custom allergen 'Fresas', select restriction 'Bajo en Sodio', notes
    console.log('Interacting with dietary self-service controls...');

    // Click Crustáceos toggle
    const crustaceosBtn = page.locator('button:has-text("Crustáceos")');
    if (await crustaceosBtn.count() > 0) {
      await crustaceosBtn.first().click();
    }

    // Add custom allergen
    const customInput = page.locator('input[placeholder*="Ej. kiwi"]');
    if (await customInput.count() > 0) {
      await customInput.fill('Fresas');
      const addBtn = page.locator('button:has-text("Añadir")');
      if (await addBtn.count() > 0) {
        await addBtn.click();
      }
    }

    // Toggle restriction 'Bajo en Sodio'
    const restrictionBtn = page.locator('button:has-text("Bajo en Sodio")');
    if (await restrictionBtn.count() > 0) {
      await restrictionBtn.first().click();
    }

    // Set dietary notes
    const notesInput = page.locator('textarea[placeholder*="Ej. Cuidado extremo"]');
    if (await notesInput.count() > 0) {
      await notesInput.fill('Alergia severa a las fresas y régimen bajo en sal.');
    }

    await page.waitForTimeout(1000);

    const screenshotConfigured = resolve(SCREENSHOT_DIR, '02-customer-dietary-settings-configured.png');
    await page.screenshot({ path: screenshotConfigured, fullPage: true });

    // Click "Guardar Perfil Dietético"
    const saveBtn = page.locator('button:has-text("Guardar Perfil Dietético")');
    const saveBtnCount = await saveBtn.count();
    console.log('DEBUG saveBtn count:', saveBtnCount);
    if (saveBtnCount > 0) {
      console.log('DEBUG saveBtn disabled:', await saveBtn.isDisabled());
      await saveBtn.click();
    }

    // Wait for save feedback
    await page.waitForTimeout(4000);

    // Verify database persistence via Supabase direct query
    const { data: dbProfile, error: dbErr } = await supabaseAdmin
      .from('customer_dietary_profiles')
      .select('*')
      .eq('tenant_id', EATCLEAN_TENANT_ID)
      .eq('customer_id', QA_CUSTOMER_ID)
      .maybeSingle();

    if (dbErr) throw dbErr;
    console.log('DEBUG dbProfile:', JSON.stringify(dbProfile));

    const dbSaved = Boolean(
      dbProfile &&
      dbProfile.custom_allergens &&
      (dbProfile.custom_allergens.includes('fresas') || dbProfile.custom_allergens.includes('Fresas'))
    );

    recordStep(
      4,
      'P1: Persistencia en Base de Datos de Perfil Dietético Guardado por el Cliente',
      dbSaved,
      'El cliente autenticado guardó exitosamente su perfil dietético en public.customer_dietary_profiles.',
      {
        dbStatus: dbSaved ? 'PERSISTED' : 'NOT_FOUND',
        dbProfile,
      }
    );

    // Hard reload browser page and verify UI consistency
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const reloadedHtml = await page.content();
    const persistsFresas = reloadedHtml.toLowerCase().includes('fresas');
    const persistsNotes = reloadedHtml.includes('Alergia severa a las fresas');

    const screenshotReloaded = resolve(SCREENSHOT_DIR, '03-customer-dietary-settings-reloaded.png');
    await page.screenshot({ path: screenshotReloaded, fullPage: true });

    recordStep(
      5,
      'P1: Consistencia UI tras Hard Reload (/app/settings/dietary)',
      persistsFresas && persistsNotes,
      'Tras recargar la página, los alérgenos personalizados y notas permanecen activos y visibles en la UI.',
      {
        persistsFresas,
        persistsNotes,
        screenshot: screenshotReloaded,
      }
    );

    // =========================================================================
    // TRACK 3: P1 CUSTOMER ORDER SUMMARY VERIFICATION (/app/orders/$orderId)
    // =========================================================================
    console.log('\n--- TRACK 3: P1 ORDER SUMMARY DIETARY SNAPSHOT ---');

    await page.goto(`${PROD_URL}/app/orders/${QA_ORDER_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const orderSummaryHtml = await page.content();
    const hasDietarySection = orderSummaryHtml.includes('Condiciones dietéticas aplicadas');
    const hasSnapshotBadges = orderSummaryHtml.includes('Gluten') || orderSummaryHtml.includes('Lácteos') || orderSummaryHtml.includes('kiwi');
    const hasOrderDisclaimer = orderSummaryHtml.includes('El perfil dietético informa exclusivamente');

    const screenshotOrder = resolve(SCREENSHOT_DIR, '04-customer-order-dietary-snapshot.png');
    await page.screenshot({ path: screenshotOrder, fullPage: true });

    recordStep(
      6,
      'P1: Verificación de Snapshot Dietético en Pedido del Cliente (/app/orders/$orderId)',
      hasDietarySection && hasSnapshotBadges && hasOrderDisclaimer,
      'El resumen del pedido muestra la sección de condiciones dietéticas aplicadas con badges del snapshot y el aviso constitucional.',
      {
        hasDietarySection,
        hasSnapshotBadges,
        hasOrderDisclaimer,
        screenshot: screenshotOrder,
      }
    );

  } finally {
    await browser.close();
  }

  // Write Evidence JSON Log
  const evidenceFile = resolve('docs/05-architecture/cr-ops-diet-01-live-evidence.json');
  writeFileSync(evidenceFile, JSON.stringify(evidenceLog, null, 2), 'utf8');
  console.log(`\nEvidence JSON saved to: ${evidenceFile}`);

  const passedCount = evidenceLog.filter((s) => s.result.includes('PASS')).length;
  const totalCount = evidenceLog.length;
  console.log(`\n========================================================================`);
  console.log(`CR-OPS-DIET-01 CERTIFICATION RESULT: ${passedCount}/${totalCount} PASS`);
  console.log(`========================================================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runLiveCertification().catch((err) => {
  console.error('Fatal error during certification:', err);
  process.exit(1);
});
