# ADR 0087 — Billing Capability (Architecture Freeze)

## Estado

**Accepted** — 2026-08-07  
**Track:** OPERATIONAL-007 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [BILLING_CAPABILITY](../05-architecture/BILLING_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)

## Contexto

Delivery Capability está **Capability Demo** (ADR 0086). PRODUCT LAW 001 (ADR 0084) está activo. El Operational Engine tiene Identity→Delivery en la cadena operativa; falta el **Outcome**.

Billing no se diseña como Capability aislada: es la **última pieza estructural** del Operational Engine. Cada decisión de naming refuerza que el Engine termina en Outcome.

## Decisión

1. Declarar **Billing Capability** como **OPERATIONAL-007**.  
2. Capability Type / Layer: **Operational Outcome** (LAW 005).  
3. Pregunta canónica (LAW 006 — una sola):

   > *What financial outcome must be produced from successfully completed operational work?*  
   > *¿Qué resultado financiero debe producirse a partir del trabajo operativo completado con éxito?*

4. Congelar contratos públicos en `src/billing/contracts/`:  
   `BillingContext` · `BillingSummary` · `BillingStatus` · `BillingDocument` · `InvoiceReference` · `PaymentStatus` · `BillingResult` (+ InvoiceLine · CreditNote · BillingEvidence · FinancialOutcome).  
5. Lifecycle: `Pending` → `ReadyToBill` → `Invoiced` → `PartiallyPaid` → `Paid` | `Cancelled`.  
6. **Billing never creates demand · never plans · never executes · never modifies Orders / Production / Kitchen / Delivery.**  
7. Billing consume solo Facades certificadas (Identity→Delivery) — **nunca** infraestructura / repos / Supabase.  
8. Lenguaje prohibido en dominio: Accounting · ERP · Ledger · Tax Engine · Bank.  
9. Phase 1 = **solo arquitectura** (sin UI / Commands / Queries / Services / DB / Facade).  
10. Reservar hito institucional posterior **OPERATIONAL-ENGINE-001** (Engine v1.0 Declaration) — docs only, no código — tras Billing Demo (+ FLOW-003 según board).  
11. No expansión arquitectónica más allá de Billing para Engine v1.0.

## Consecuencias

- Una sola respuesta a: *¿qué es Billing en YourMeal OS?*  
- El mapa de Capabilities del Engine queda estructuralmente completo (Identity→Billing).  
- Facade / Certification / Demo siguen el método canónico; la declaración v1.0 es un PR institucional separado.  
- Delivery permanece cerrado — no se reabre ni se modifica.

## Referencias

- ADR [0078](./0078-delivery-capability.md)–[0086](./0086-delivery-workspace-demo.md) · [0084](./0084-product-law-001.md)  
- [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · LAW 001–007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)  
- [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md)
