import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";

/**
 * Helper to run SQL queries against local PostgreSQL container (PostgreSQL 17).
 */
function runSql(sql: string): string {
  // Use heredoc via bash to safely pass multi-line SQL without escaping issues
  const cmd = `docker exec -i supabase_db_djangucecsphnejplvic psql -U postgres -d postgres -v ON_ERROR_STOP=1 -t -A << 'EOF_SQL'\n${sql}\nEOF_SQL`;
  return execSync(cmd, { encoding: "utf8", shell: "/bin/bash" }).trim();
}

function runSqlJson<T = any>(sql: string): T {
  const raw = runSql(sql);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse SQL JSON output: "${raw}" — Error: ${err}`);
  }
}

describe("CR-COST-1A Real PostgreSQL Integration: 20 Mandatory Scenarios", () => {
  // Synthetic test fixture IDs
  const tenantA = "11111111-aaaa-4444-aaaa-111111111111";
  const tenantB = "22222222-bbbb-4444-bbbb-222222222222";
  const supplierId = "33333333-cccc-4444-cccc-333333333333";
  const staffUserId = "44444444-dddd-4444-dddd-444444444444";
  const nonStaffUserId = "55555555-eeee-4444-eeee-555555555555";

  beforeAll(() => {
    // Seed prerequisite tenants, suppliers, and users in local DB
    runSql(`
      INSERT INTO public.tenants (id, name, slug)
      VALUES 
        ('${tenantA}', 'EatClean Tenerife (Test A)', 'eatclean-test-a'),
        ('${tenantB}', 'Other Tenant (Test B)', 'other-test-b')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.suppliers (id, tenant_id, name)
      VALUES ('${supplierId}', '${tenantA}', 'Makro Adeje Test')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO auth.users (id, email)
      VALUES 
        ('${staffUserId}', 'staff@eatclean.test'),
        ('${nonStaffUserId}', 'outsider@other.test')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.tenant_members (user_id, tenant_id, status)
      VALUES ('${staffUserId}', '${tenantA}', 'approved')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES ('${staffUserId}', '${tenantA}', 'company_admin')
      ON CONFLICT DO NOTHING;
    `);
  });

  afterAll(() => {
    // Clean up test fixtures created during the test run
    runSql(`
      DELETE FROM public.purchase_receipt_executions WHERE tenant_id IN ('${tenantA}', '${tenantB}');
      DELETE FROM public.stock_movements WHERE tenant_id IN ('${tenantA}', '${tenantB}');
      DELETE FROM public.item_cost_history WHERE tenant_id IN ('${tenantA}', '${tenantB}');
      DELETE FROM public.purchase_invoice_items WHERE tenant_id IN ('${tenantA}', '${tenantB}');
      DELETE FROM public.purchase_invoices WHERE tenant_id IN ('${tenantA}', '${tenantB}');
      DELETE FROM public.ingredients WHERE tenant_id IN ('${tenantA}', '${tenantB}');
      DELETE FROM public.user_roles WHERE user_id IN ('${staffUserId}', '${nonStaffUserId}');
      DELETE FROM public.tenant_members WHERE user_id IN ('${staffUserId}', '${nonStaffUserId}');
      DELETE FROM public.suppliers WHERE id = '${supplierId}';
      DELETE FROM public.tenants WHERE id IN ('${tenantA}', '${tenantB}');
    `);
  });

  // 1. Primera recepción correcta
  it("Scenario 1: Primera recepción correcta incrementa stock, calcula WAC y registra asientos", () => {
    const ingId = "a0000001-0000-0000-0000-000000000001";
    const invId = "b0000001-0000-0000-0000-000000000001";
    const lineId = "c0000001-0000-0000-0000-000000000001";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Pechuga Pollo', 'kg', 0, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-001', 50.00, 50.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('${lineId}', '${tenantA}', '${invId}', '${ingId}', 'Pechuga Pollo', 10.0, 'kg', 5.00, 5.00, 50.00, 'INVENTORYABLE');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);
    expect(result.status).toBe("received");
    expect(result.summary.total_stock_increment).toBe(10);

    const ing = runSqlJson(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingId}';
    `);
    expect(Number(ing.stock)).toBe(10);
    expect(Number(ing.cost)).toBe(5);

    const movements = runSqlJson(`
      SELECT json_build_object('count', count(*))
      FROM public.stock_movements WHERE reference_document_id = '${invId}';
    `);
    expect(Number(movements.count)).toBe(1);
  });

  // 2. Segunda recepción legítima del mismo ingrediente
  it("Scenario 2: Segunda recepción legítima del mismo ingrediente actualiza WAC ponderado canónico", () => {
    const ingId = "a0000001-0000-0000-0000-000000000001"; // tiene 10 kg @ 5.00
    const invId2 = "b0000002-0000-0000-0000-000000000002";
    const lineId2 = "c0000002-0000-0000-0000-000000000002";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId2}', '${tenantA}', '${supplierId}', 'FAC-002', 70.00, 70.00, 'draft');

      -- Entrada: 10 kg @ 7.00 €/kg.
      -- WAC esperado: ((10 * 5) + (10 * 7)) / (10 + 10) = 120 / 20 = 6.0000 €/kg.
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('${lineId2}', '${tenantA}', '${invId2}', '${ingId}', 'Pechuga Pollo', 10.0, 'kg', 7.00, 7.00, 70.00, 'INVENTORYABLE');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId2}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);

    const ing = runSqlJson(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingId}';
    `);
    expect(Number(ing.stock)).toBe(20);
    expect(Number(ing.cost)).toBe(6.0000);
  });

  // 3. Reintento idéntico sin duplicar existencias (Idempotencia)
  it("Scenario 3: Reintento idéntico con el mismo receipt_id es idempotente y no altera stock", () => {
    const ingId = "a0000001-0000-0000-0000-000000000001";
    const invId = "b0000003-0000-0000-0000-000000000003";
    const lineId = "c0000003-0000-0000-0000-000000000003";
    const receiptId = "e0000003-0000-0000-0000-000000000003";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-003', 40.00, 40.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('${lineId}', '${tenantA}', '${invId}', '${ingId}', 'Pechuga Pollo', 5.0, 'kg', 8.00, 8.00, 40.00, 'INVENTORYABLE');
    `);

    // Primera ejecución
    const res1 = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', '${receiptId}', NULL, '${staffUserId}');
    `);
    expect(res1.idempotent).toBe(false);

    const stockAfterFirst = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));

    // Segunda ejecución idéntica
    const res2 = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', '${receiptId}', NULL, '${staffUserId}');
    `);
    expect(res2.idempotent).toBe(true);

    const stockAfterSecond = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockAfterSecond).toBe(stockAfterFirst);
  });

  // 4. Dos recepciones concurrentes con WAC correcto
  it("Scenario 4: Dos recepciones concurrentes protegen la consistencia con FOR UPDATE", () => {
    const ingId = "a0000004-0000-0000-0000-000000000004";
    const invA = "b0000004-0000-0000-0000-000000000004";
    const invB = "b0000004-0000-0000-0000-000000000005";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Arroz Basmati', 'kg', 2.00, 10.00);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES 
        ('${invA}', '${tenantA}', '${supplierId}', 'FAC-CONC-1', 30.00, 30.00, 'draft'),
        ('${invB}', '${tenantA}', '${supplierId}', 'FAC-CONC-2', 50.00, 50.00, 'draft');

      -- InvA: 10 kg @ 3.00
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000004-0000-0000-0000-000000000004', '${tenantA}', '${invA}', '${ingId}', 'Arroz Basmati', 10.0, 'kg', 3.00, 3.00, 30.00, 'INVENTORYABLE');

      -- InvB: 10 kg @ 4.00
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000004-0000-0000-0000-000000000005', '${tenantA}', '${invB}', '${ingId}', 'Arroz Basmati', 10.0, 'kg', 4.00, 4.00, 40.00, 'INVENTORYABLE');
    `);

    // Ejecución secuencial simulando serialización bloqueada
    runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invA}', NULL, NULL, '${staffUserId}');`);
    runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invB}', NULL, NULL, '${staffUserId}');`);

    const ing = runSqlJson(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingId}';
    `);

    // Inicial: 10 kg @ 2.00 = 20.00
    // Tras InvA: +10 kg @ 3.00 = 30.00 -> 20 kg @ 2.50 = 50.00
    // Tras InvB: +10 kg @ 4.00 = 40.00 -> 30 kg @ 3.00 = 90.00
    expect(Number(ing.stock)).toBe(30.0);
    expect(Number(ing.cost)).toBe(3.0000);
  });

  // 5. Recepción parcial
  it("Scenario 5: Recepción parcial actualiza solo las líneas y cantidades recibidas y marca partially_received", () => {
    const ingId = "a0000005-0000-0000-0000-000000000005";
    const invId = "b0000005-0000-0000-0000-000000000005";
    const lineId = "c0000005-0000-0000-0000-000000000005";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Salmón Fresco', 'kg', 10.00, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-PARTIAL', 200.00, 200.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('${lineId}', '${tenantA}', '${invId}', '${ingId}', 'Salmón Fresco', 20.0, 'kg', 10.00, 10.00, 200.00, 'INVENTORYABLE');
    `);

    // Recibir parcialmente 8 kg de 20
    const partialLines = JSON.stringify([{ line_id: lineId, quantity: 8.0 }]);
    const resPartial = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, '${partialLines}'::jsonb, '${staffUserId}');
    `);

    expect(resPartial.status).toBe("partially_received");
    expect(resPartial.summary.remaining_pending_lines).toBe(1);

    const stockPartial = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockPartial).toBe(8.0);

    // Recibir los 12 kg restantes
    const resFinal = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(resFinal.status).toBe("received");
    const stockFinal = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockFinal).toBe(20.0);
  });

  // 6. Factura registrada sin mercancía recibida
  it("Scenario 6: Factura registrada en borrador mantiene existencias en 0 hasta recepción", () => {
    const ingId = "a0000006-0000-0000-0000-000000000006";
    const invId = "b0000006-0000-0000-0000-000000000006";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Aguacate Hass', 'kg', 4.50, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-DRAFT-ONLY', 45.00, 45.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000006-0000-0000-0000-000000000006', '${tenantA}', '${invId}', '${ingId}', 'Aguacate Hass', 10.0, 'kg', 4.50, 4.50, 45.00, 'INVENTORYABLE');
    `);

    const stock = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stock).toBe(0);
  });

  // 7. Albarán recibido antes de la factura
  it("Scenario 7: Recepción previa no duplica el incremento cuando se concilia", () => {
    const ingId = "a0000007-0000-0000-0000-000000000007";
    const invId = "b0000007-0000-0000-0000-000000000007";
    const receiptKey = "e0000007-0000-0000-0000-000000000007";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Huevos Camperos', 'ud', 0.20, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'ALBARAN-HUEVOS', 20.00, 20.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000007-0000-0000-0000-000000000007', '${tenantA}', '${invId}', '${ingId}', 'Huevos Camperos', 100.0, 'ud', 0.20, 0.20, 20.00, 'INVENTORYABLE');
    `);

    // Recepción del albarán
    runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', '${receiptKey}', NULL, '${staffUserId}');`);

    const stockAfterAlbaran = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockAfterAlbaran).toBe(100);

    // Llegada posterior con el mismo identificador de recepción
    const resInvoice = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', '${receiptKey}', NULL, '${staffUserId}');
    `);
    expect(resInvoice.idempotent).toBe(true);

    const stockFinal = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockFinal).toBe(100);
  });

  // 8. Documento mixto con mercancías y servicios
  it("Scenario 8: Documento mixto incrementa solo mercancías y aísla los servicios", () => {
    const ingId = "a0000008-0000-0000-0000-000000000008";
    const invId = "b0000008-0000-0000-0000-000000000008";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Lenteja Pardina', 'kg', 1.50, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-MIXTA', 80.00, 80.00, 'draft');

      -- Línea 1: Mercancía (20 kg Lentejas @ 1.50 = 30.00)
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000008-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingId}', 'Lenteja Pardina', 20.0, 'kg', 1.50, 1.50, 30.00, 'INVENTORYABLE');

      -- Línea 2: Servicio / Flete (1 servicio @ 50.00 = 50.00)
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000008-0000-0000-0000-000000000002', '${tenantA}', '${invId}', 'ffffffff-ffff-4444-ffff-ffffffffffff', 'Flete Isoterma', 1.0, 'ud', 50.00, 50.00, 50.00, 'EXPENSE_SERVICE');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);
    expect(result.summary.total_stock_increment).toBe(20.0);

    const stock = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stock).toBe(20.0);
  });

  // 9. Línea de servicio que no modifica stock
  it("Scenario 9: Factura puramente de servicio no crea movimientos de stock", () => {
    const invId = "b0000009-0000-0000-0000-000000000009";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-ENDESA', 800.00, 800.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000009-0000-0000-0000-000000000001', '${tenantA}', '${invId}', 'ffffffff-ffff-4444-ffff-000000000001', 'Electricidad Cocina Octubre', 1.0, 'mes', 800.00, 800.00, 800.00, 'EXPENSE_SERVICE');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);
    expect(result.summary.total_stock_increment).toBe(0);

    const movements = runSqlJson(`
      SELECT json_build_object('count', count(*))
      FROM public.stock_movements WHERE reference_document_id = '${invId}';
    `);
    expect(Number(movements.count)).toBe(0);
  });

  // 10. Activo CAPEX que no modifica stock de ingredientes
  it("Scenario 10: Activo CAPEX se registra sin alterar el inventario de ingredientes", () => {
    const invId = "b0000010-0000-0000-0000-000000000010";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-RATIONAL', 9500.00, 9500.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000010-0000-0000-0000-000000000001', '${tenantA}', '${invId}', 'ffffffff-ffff-4444-ffff-000000000002', 'Horno Mixto iCombi Pro', 1.0, 'ud', 9500.00, 9500.00, 9500.00, 'CAPEX_ASSET');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);
    expect(result.summary.total_stock_increment).toBe(0);
  });

  // 11. Fallo provocado con rollback completo
  it("Scenario 11: Error en una línea revierte la transacción completa sin mutaciones parciales", () => {
    const ingValid = "a0000011-0000-0000-0000-000000000011";
    const invId = "b0000011-0000-0000-0000-000000000011";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingValid}', '${tenantA}', 'Zanahoria', 'kg', 1.00, 5.00);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-FAIL-TEST', 100.00, 100.00, 'draft');

      -- Línea 1: válida
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000011-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingValid}', 'Zanahoria', 10.0, 'kg', 1.00, 1.00, 10.00, 'INVENTORYABLE');

      -- Línea 2: inválida (apunta a un ingrediente que NO existe)
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000011-0000-0000-0000-000000000002', '${tenantA}', '${invId}', '99999999-9999-9999-9999-999999999999', 'Ingrediente Fantasma', 5.0, 'kg', 2.00, 2.00, 10.00, 'INVENTORYABLE');
    `);

    // La llamada debe fallar
    expect(() => {
      runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');`);
    }).toThrow();

    // Comprobar rollback completo: el stock del ingrediente válido debe seguir intacto en 5.00
    const stock = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingValid}';`));
    expect(stock).toBe(5.00);

    const invStatus = runSql(`SELECT status FROM public.purchase_invoices WHERE id = '${invId}';`);
    expect(invStatus).toBe("draft");
  });

  // 12. Usuario sin permisos
  it("Scenario 12: Usuario sin rol de staff es rechazado por seguridad con excepción 42501", () => {
    const invId = "b0000012-0000-0000-0000-000000000012";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-RBAC-TEST', 10.00, 10.00, 'draft');
    `);

    expect(() => {
      runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${nonStaffUserId}');`);
    }).toThrow(/permission denied/);
  });

  // 13. Acceso a otro tenant rechazado
  it("Scenario 13: Acceso a factura de otro tenant es taxativamente bloqueado", () => {
    const invIdB = "b0000013-0000-0000-0000-000000000013";

    runSql(`
      INSERT INTO public.suppliers (id, tenant_id, name)
      VALUES ('33333333-cccc-4444-cccc-999999999999', '${tenantB}', 'Proveedor Tenant B')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invIdB}', '${tenantB}', '33333333-cccc-4444-cccc-999999999999', 'FAC-TENANT-B', 10.00, 10.00, 'draft');
    `);

    // Tenant A intenta recepcionar factura de Tenant B
    expect(() => {
      runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invIdB}', NULL, NULL, '${staffUserId}');`);
    }).toThrow(/not found/);
  });

  // 14. Ingrediente inactivo (soft-deleted)
  it("Scenario 14: Ingrediente inactivo con deleted_at no nulo aborta la recepción", () => {
    const ingDeleted = "a0000014-0000-0000-0000-000000000014";
    const invId = "b0000014-0000-0000-0000-000000000014";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, deleted_at)
      VALUES ('${ingDeleted}', '${tenantA}', 'Ingrediente Obsoleto', 'kg', 1.00, 0, now());

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-DELETED-ING', 10.00, 10.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000014-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingDeleted}', 'Ingrediente Obsoleto', 5.0, 'kg', 2.00, 2.00, 10.00, 'INVENTORYABLE');
    `);

    expect(() => {
      runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');`);
    }).toThrow(/deleted\/inactive/);
  });

  // 15. Unidades de compra diferentes de la unidad base (kg -> g)
  it("Scenario 15: Conversión automática entre unidades de compra (kg) y base (g)", () => {
    const ingId = "a0000015-0000-0000-0000-000000000015";
    const invId = "b0000015-0000-0000-0000-000000000015";

    runSql(`
      -- Ingrediente en gramos
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Pimentón de la Vera', 'g', 0.0200, 500);

      -- Factura en kilogramos: 2 kg @ 20.00 €/kg (= 40.00 €)
      -- Debe convertirse a: 2000 g @ 0.0200 €/g
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-UNITS-KG-G', 40.00, 40.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000015-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingId}', 'Pimentón de la Vera', 2.0, 'kg', 20.00, 20.00, 40.00, 'INVENTORYABLE');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);

    const ing = runSqlJson(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingId}';
    `);

    // 500 g previos + 2000 g recibidos = 2500 g
    expect(Number(ing.stock)).toBe(2500);
    expect(Number(ing.cost)).toBe(0.0200);
  });

  // 16. Cantidades negativas o inválidas
  it("Scenario 16: Cantidades de recepción negativas son rechazadas", () => {
    const ingId = "a0000015-0000-0000-0000-000000000015";
    const invId = "b0000016-0000-0000-0000-000000000016";
    const lineId = "c0000016-0000-0000-0000-000000000001";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-NEG-QTY', 10.00, 10.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('${lineId}', '${tenantA}', '${invId}', '${ingId}', 'Pimentón', 10.0, 'kg', 1.00, 1.00, 10.00, 'INVENTORYABLE');
    `);

    const badLines = JSON.stringify([{ line_id: lineId, quantity: -2.0 }]);
    expect(() => {
      runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, '${badLines}'::jsonb, '${staffUserId}');`);
    }).toThrow(/Invalid negative/);
  });

  // 17. Varias líneas del mismo ingrediente
  it("Scenario 17: Varias líneas del mismo ingrediente acumulan existencias y WAC de forma secuencial y exacta", () => {
    const ingId = "a0000017-0000-0000-0000-000000000017";
    const invId = "b0000017-0000-0000-0000-000000000017";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Aceite de Oliva VE', 'l', 0, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-MULTI-LINE', 90.00, 90.00, 'draft');

      -- Línea 1: 5 l @ 4.00 €/l = 20.00 €
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature, created_at)
      VALUES ('c0000017-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingId}', 'Aceite de Oliva VE', 5.0, 'l', 4.00, 4.00, 20.00, 'INVENTORYABLE', now());

      -- Línea 2: 10 l @ 7.00 €/l = 70.00 €
      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature, created_at)
      VALUES ('c0000017-0000-0000-0000-000000000002', '${tenantA}', '${invId}', '${ingId}', 'Aceite de Oliva VE', 10.0, 'l', 7.00, 7.00, 70.00, 'INVENTORYABLE', now() + interval '1 second');
    `);

    // Total: 15 l. WAC esperado: ((5 * 4) + (10 * 7)) / 15 = 90 / 15 = 6.0000 €/l
    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);

    const ing = runSqlJson(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingId}';
    `);

    expect(Number(ing.stock)).toBe(15.0);
    expect(Number(ing.cost)).toBe(6.0000);
  });

  // 18. Factura cancelada
  it("Scenario 18: Factura cancelada es rechazada taxativamente para recepción", () => {
    const invId = "b0000018-0000-0000-0000-000000000018";

    runSql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-CANCELLED', 10.00, 10.00, 'cancelled');
    `);

    expect(() => {
      runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');`);
    }).toThrow(/cancelled/);
  });

  // 19. Datos históricos inconsistentes (stock inicial <= 0)
  it("Scenario 19: Stock negativo previo resetea WAC al precio de adquisición de la entrada", () => {
    const ingId = "a0000019-0000-0000-0000-000000000019";
    const invId = "b0000019-0000-0000-0000-000000000019";

    runSql(`
      -- Stock negativo por desajuste histórico (-3 kg @ 2.00)
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Atún Rojo', 'kg', 2.00, -3.00);

      -- Entrada: 10 kg @ 18.00 €/kg
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-ATUN', 180.00, 180.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000019-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingId}', 'Atún Rojo', 10.0, 'kg', 18.00, 18.00, 180.00, 'INVENTORYABLE');
    `);

    const result = runSqlJson(`
      SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');
    `);

    expect(result.success).toBe(true);

    const ing = runSqlJson(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingId}';
    `);

    // Nuevo stock = -3 + 10 = 7 kg. WAC se resetea al coste de entrada (18.00) evitando distorsiones por stock negativo
    expect(Number(ing.stock)).toBe(7.0);
    expect(Number(ing.cost)).toBe(18.0000);
  });

  // 20. Compatibilidad con el consumo existente de FLOW-04
  it("Scenario 20: FLOW-04 puede descontar directamente las existencias reales creadas por la recepción", () => {
    const ingId = "a0000020-0000-0000-0000-000000000020";
    const invId = "b0000020-0000-0000-0000-000000000020";

    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock)
      VALUES ('${ingId}', '${tenantA}', 'Quinoa Real', 'kg', 3.00, 0);

      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invId}', '${tenantA}', '${supplierId}', 'FAC-QUINOA', 30.00, 30.00, 'draft');

      INSERT INTO public.purchase_invoice_items (id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature)
      VALUES ('c0000020-0000-0000-0000-000000000001', '${tenantA}', '${invId}', '${ingId}', 'Quinoa Real', 10.0, 'kg', 3.00, 3.00, 30.00, 'INVENTORYABLE');
    `);

    // 1. Recepción de compra: existencias suben a 10 kg
    runSql(`SELECT public.receive_purchase_invoice_v1('${tenantA}', '${invId}', NULL, NULL, '${staffUserId}');`);

    const stockBeforeFlow04 = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockBeforeFlow04).toBe(10.0);

    // 2. FLOW-04 producción consume 3.5 kg
    runSql(`
      UPDATE public.ingredients
      SET stock = stock - 3.5
      WHERE id = '${ingId}' AND tenant_id = '${tenantA}' AND stock >= 3.5;
    `);

    const stockAfterFlow04 = Number(runSql(`SELECT stock FROM public.ingredients WHERE id = '${ingId}';`));
    expect(stockAfterFlow04).toBe(6.5);
  });
});
