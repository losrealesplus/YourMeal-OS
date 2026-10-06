# CR-MENU — Offer Pricing M3 Technical Implementation

Fecha: 2026-10-06.
Estado: **IMPLEMENTED OFFLINE / READY FOR HUMAN REVIEW**.
Baseline: `4790450c0d7a976c7ca31bef3a6d2be9937e7e03` (PR #499 merged).

## Resumen Ejecutivo

Este PR implementa el Contrato Comercial M3 (C01–C10 + OP08) aprobado y congelado por Alexander:

1. **Modo Canónico Versionado:** `individual_line_pricing_v1` para compras individuales independientes (`individual_menu` / à-la-carte).
2. **Cálculo de Línea Canónico:**
   $$\text{effective\_line\_price} = \text{weekly\_menu\_slots.unit\_price} \mathbin{??} \text{dishes.price}$$
3. **Invariante Financiero:** `order_items.unit_price` se captura como snapshot inmutable en la misma transacción canónica (sin segundo writer financiero).
4. **Fail-Closed Estricto:** Planes semanales (`weekly_plan`), mensuales (`monthly_plan`), paquetes, promociones, suscripciones o compras corporativas continúan fallando con `OFFER_PRICING_COMMERCIAL_UNSUPPORTED` o `COMMERCIAL_QUOTE_REQUIRED` ante precios de slot explícitos.
5. **OP08 — Protección de Ofertas Publicadas:** Bloqueo en PostgreSQL de modificaciones directas de `unit_price` en slots de menús publicados (`PUBLISHED_OFFER_PRICE_MODIFICATION_BLOCKED`).
6. **OP08 — Remediación Privilegiada:** Función `cr_menu_published_offer_price_remediation` que exige verificación de actor staff, validación atómica contra hash de manifiesto SHA-256 (`manifestHash`), coincidencia de `expectedOldPrice`, actualización atómica y registro en `audit_log`.

---

## Archivos Modificados e Incorporados

- `src/modules/weekly-menu/domain/offer-quote.ts`
- `src/modules/weekly-menu/domain/offer-quote.spec.ts`
- `src/modules/weekly-menu/server/offer-write.server.ts`
- `src/modules/weekly-menu/server/offer-write.server.spec.ts`
- `src/modules/weekly-menu/application/offer-remediation.ts`
- `src/modules/weekly-menu/application/offer-remediation.spec.ts`
- `supabase/migrations/20261006110000_cr_menu_offer_pricing_m3_individual_line.sql`
- `supabase/tests/offer-pricing-m3/local-integration.mjs`

---

## Evidencia de Verificación Offline

- **PostgreSQL Tests (M2 + A4a + M3):** `50/50 PASS` (22 M2 + 20 A4a + 8 M3 en ~5.0s).
- **Vitest Global:** `302/302 suites PASS` (1.888 tests pasando en 6.5s).
- **Governance Preconditions:** `25/25 PASS`.
- **Typecheck:** `tsc --noEmit` `0 errors`.
- **Build:** Nitro prebuilt generado limpiamente.
