/**
 * YOURMEAL-OS · CR-OPS-UX-HF01 GATE 8 TRACK C FUNCTIONAL CERTIFICATION
 *
 * Runs exclusively Track C (Packing Operations Kiosk) against
 * the LIVE Cloudflare Worker (eatclean.yourmealos.com)
 * and Supabase Production database (nhirlpkuvonggctdzzad).
 *
 * Strict Protocol:
 * USER ACTION → UI RESULT → DATABASE/PERSISTENCE → HARD RELOAD → UI CONSISTENCY
 *
 * Fixture:
 * QA-B Order: cafe0002-8bba-42c8-9283-000000000002
 * Tenant: EatClean (8bba00ba-331b-42c8-9283-4e3836ffb870)
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
const QA_ORDER_B_ID = 'cafe0002-8bba-42c8-9283-000000000002';
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
  console.log(`[${item.result}] ${track} Step ${stepNum}: ${action}`);
  if (details) console.log(`   -> ${details}`);
}

async function runTrackC() {
  console.log('========================================================================');
  console.log('STARTING GATE 8 TRACK C: PACKING FUNCTIONAL PRODUCTION CERTIFICATION');
  console.log('Target URL:', PROD_URL);
  console.log('Target Tenant:', `EatClean (${EATCLEAN_TENANT_ID})`);
  console.log('Target Fixture QA-B:', QA_ORDER_B_ID);
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Verify initial status of QA-B
  const { data: initialOrderB, error: initErr } = await supabase
    .from('orders')
    .select('id, status, customer_id')
    .eq('id', QA_ORDER_B_ID)
    .single();

  if (initErr || !initialOrderB) {
    throw new Error(`Failed to query initial QA-B fixture: ${initErr?.message || 'Not found'}`);
  }

  console.log(`Initial QA-B status in PostgreSQL: ${initialOrderB.status}`);
  if (initialOrderB.status !== 'confirmed') {
    console.log(`Note: QA-B status is currently '${initialOrderB.status}'. Resetting to 'confirmed' for clean certification.`);
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', QA_ORDER_B_ID);
  }

  // Launch browser
  console.log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Authenticate via GoTrue
    console.log('1. Authenticating QA Operator in live edge...');
    const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
      email: QA_USER_EMAIL,
      password: QA_USER_PASSWORD,
    });
    if (sessionErr) throw sessionErr;

    await page.goto(`${PROD_URL}/auth`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Inject session into localStorage
    await page.evaluate(({ session }) => {
      const storageKey = 'sb-nhirlpkuvonggctdzzad-auth-token';
      localStorage.setItem(storageKey, JSON.stringify(session));
    }, { session: sessionData.session });

    // 2. Navigate to Production Sheet (date of fixture = 2026-10-01)
    console.log('2. Navigating to /admin/production-sheet?date=2026-10-01 ...');
    await page.goto(`${PROD_URL}/admin/production-sheet?date=2026-10-01`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const shotC1 = `${SCREENSHOT_DIR}/prod_trackC_01_production_sheet_p1.png`;
    await page.screenshot({ path: shotC1, fullPage: true });

    // Switch to P2 Packing Tab
    console.log('Switching to P2 · Packing por Cliente tab...');
    const p2TabBtn = page.locator('button:has-text("P2 · Packing por Cliente"), button:has-text("Packing por Cliente")').first();
    if (await p2TabBtn.isVisible()) {
      await p2TabBtn.click();
      await page.waitForTimeout(1500);
    }

    const shotC2 = `${SCREENSHOT_DIR}/prod_trackC_02_packing_p2_view.png`;
    await page.screenshot({ path: shotC2, fullPage: true });

    // ── C1: Macro Progress Bar ───────────────────────────────────────────────
    const progressBarText = page.locator('text=Progreso de Envasado:').first();
    const hasProgressBar = await progressBarText.isVisible();

    recordStep('Track C', 1, 'Production Packing Kiosk Macro Progress Bar', hasProgressBar,
      'Live macro progress bar renders live packing metrics on edge.',
      { screenshot: shotC2 }
    );

    // ── C2: Locate QA-B Card & Interact with Checklist ──────────────────────
    console.log('Locating Order QA-B card using scoped card boundary...');
    const cardOrderB = page.locator(`div.rounded-xl.border:has-text("Pedido #${QA_ORDER_B_ID.slice(0, 8)}")`).first();
    const hasCardOrderB = await cardOrderB.isVisible();

    if (!hasCardOrderB) {
      const shotMissing = `${SCREENSHOT_DIR}/prod_trackC_error_card_missing.png`;
      await page.screenshot({ path: shotMissing, fullPage: true });
      recordStep('Track C', 2, 'Packing Card & Checklist Interaction', false,
        `Order QA-B card not visible in P2 Packing table. Screenshot: ${shotMissing}`);
      throw new Error(`Order QA-B card (Pedido #${QA_ORDER_B_ID.slice(0, 8)}) not found on P2 packing table.`);
    }

    // Interact with Dish Checklist item
    const checkItem = cardOrderB.locator('li').first();
    if (await checkItem.isVisible()) {
      await checkItem.click();
      await page.waitForTimeout(400);
    }

    const shotC3 = `${SCREENSHOT_DIR}/prod_trackC_03_checklist_interaction.png`;
    await page.screenshot({ path: shotC3, fullPage: true });

    // Locate [ Marcar Pedido Empacado ] button scoped inside cardOrderB
    const markPackedBtn = cardOrderB.locator('button:has-text("Marcar Pedido Empacado")').first();
    const hasMarkPackedBtn = await markPackedBtn.isVisible();

    recordStep('Track C', 2, 'Packing Card & Checklist Interaction', hasCardOrderB && hasMarkPackedBtn,
      'Order QA-B card scoped uniquely with tactile checklist and [ Marcar Pedido Empacado ] button.',
      { screenshot: shotC3 }
    );

    if (!hasMarkPackedBtn) {
      throw new Error('Button [ Marcar Pedido Empacado ] not found inside Order QA-B card.');
    }

    // ── C3: Action [ Marcar Pedido Empacado ] & Remote Database Check ────────
    console.log('Clicking [ Marcar Pedido Empacado ] on Order QA-B card...');
    await markPackedBtn.click();
    await page.waitForTimeout(2500); // Allow edge API call & Supabase mutation

    const shotC4 = `${SCREENSHOT_DIR}/prod_trackC_04_after_marcar_empacado.png`;
    await page.screenshot({ path: shotC4, fullPage: true });

    // Database check directly in PostgreSQL
    const { data: dbOrderB } = await supabase.from('orders').select('status').eq('id', QA_ORDER_B_ID).single();
    const isOrderBPrepared = dbOrderB?.status === 'prepared';

    recordStep('Track C', 3, 'Action [ Marcar Pedido Empacado ] -> Production DB prepared', isOrderBPrepared,
      `Remote PostgreSQL confirms Order QA-B transitioned to '${dbOrderB?.status}' upon packaging.`,
      { dbStatus: dbOrderB?.status, screenshot: shotC4 }
    );

    // ── C4: Hard Reload Persistence ──────────────────────────────────────────
    console.log('Executing hard reload on live edge...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

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

  } finally {
    await browser.close();
  }

  // Save evidence JSON
  const evidenceFile = resolve('docs/05-architecture/cr-ops-ux-track-c-live-evidence.json');
  writeFileSync(evidenceFile, JSON.stringify(evidenceLog, null, 2), 'utf8');
  console.log(`\nEvidence JSON saved to: ${evidenceFile}`);

  console.log('\n========================================================================');
  console.log('TRACK C PRODUCTION WALKTHROUGH COMPLETE');
  const passCount = evidenceLog.filter(e => e.result === '🟢 PASS').length;
  console.log(`Score: ${passCount} / ${evidenceLog.length}`);
  console.log('========================================================================');

  if (passCount !== evidenceLog.length) {
    process.exit(1);
  }
}

runTrackC().catch(err => {
  console.error('\nTRACK C EXECUTION ERROR:', err);
  process.exit(1);
});
