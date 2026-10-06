# Offer Pricing M2 — revisión final de implementación

## DOCUMENT CONTEXT CHECK

FOUNDATION, AGENTS, protocolo FOPEBA/Engineering, contexto estratégico/CTO/filosofía,
Dish/WeeklyMenu/Orders/commercial engine, ADR0102 y ADR0103: CONSULTED.
Contratos congelados r1/r2: CONSULTED; bytes aprobados sin cambios.
Runbooks de aplicación proveedor: N/A para esta entrega local y PR.
Autorización Alexander Hernandez POST-#494/#495: código/migrations FILES ONLY,
pruebas locales, rama/commit/push/PR. No merge, producción, proveedor ni activación UI.

## Resultado y dependencia

Foundation canónica SSR quote/commit para dish-only à-la-carte, sobre A3 commit
`041a7476e20b5c33c43df01d82217a2dbb351039` / PR #496.
La migración M2 `20261005174256_offer_pricing_canonical_quote_capture.sql` fue generada
por CLI después de A3 `20261005174218_cr_order_v2_dish_writer.sql`.
Orden obligatorio A3 → M2; aplicación a BD requiere preflight y autorización separados.

La entrada SSR autentica JWT, valida comando estricto, tenant configurado/roles y
registry comercial server explícitamente inicializado. El navegador no proporciona
actor, precios ni contexto comercial. Backend service-role existente, sin nuevos
secretos ni exposición frontend, emite y redime quote privado inmutable. Solo guarda
estado financiero y hash del comando completo; no duplica notas/perfil personal.

Commit fija tenant/actor/request/comando/quote y locks del menú/slots/Dish, revalida
política actual y falla PRICE_CHANGED antes de escrituras ante drift. Reutiliza A3
para snapshot precio/name/allergen, total, audit, derivados e idempotencia atómicos.
Retry comprometido conserva identidad original y precede expiración/precios actuales.
Modificación con lineId conserva snapshot financiero anterior. Duplicados con comentarios
distintos solo comparten autoridad cuando todos los matches financieros son unánimes.
Cero requiere slot explícito válido y confirmación; ausencia no se convierte en cero.

## Seguridad y compatibilidad revisadas

- EXECUTE de quote/commit exclusivamente service_role; revocado authenticated del
  writer A3 desnudo/core para cerrar bypass de la cotización verificada.
- Actor SQL real, membership/capability y customer owner/staff revalidados; JWT sub
  distinto del actor explícito, otro cliente, kitchen, suspendido y tenant ajeno denegados.
- Guard legacy limitado al rol privado NOLOGIN/NOBYPASSRLS bajo RLS; exige auth.uid
  real antes de locks/owner. GUC forjado no autoriza. El guard A3 anterior impide
  mutación browser de v2. No callable privilegio abierto a clientes.
- Legacy nuevo precio noNULL/ambigüedad/restauración/cambio financiero bloqueados;
  locks cierran carrera NULL→precio explícito. Comment/archivo/confirmación histórica
  conservan snapshot sin consultar catálogo/oferta actuales.
- SQL fixed errors y transporte sanitizados. DTO quote valida identidades, precios,
  límites, source/status cero, policyHash y suma exacta redondeada; commit usa guard A3.
- Bundle público no contiene SUPABASE_SERVICE_ROLE_KEY/getServerEnv/client.server/
  supabaseAdmin. No token nuevo ni modificación de autoridad del proveedor.
- Comercial activo + slot explícito falla OFFER_PRICING_COMMERCIAL_UNSUPPORTED.
  Comercial NULL conserva flows v1 y motor vigente; quoted v2 no inventa prorrateo de
  paquetes. No se certifica nueva atomicidad de v1 ni reescritura total de su seguridad.
- Override manual quoted y B2B v2 son límites tipados pendientes; legacy NULL override
  regresión permanece. Custom, UI, 15 extras y proveedor fuera de alcance.

## Evidencia final

- Vitest completo: **296 archivos / 1806 tests PASS** (ejecución independiente root).
- PostgreSQL17.10 local/socket temporal: **22 tests PASS**, migrador no superuser y
  roles reales; race/idempotencia/concurrency, zero, expiry, audit failure rollback,
  owner/cross-tenant y snapshots incluidos. Fixture usa grants plataforma simulados;
  M2 no concede grants generales nuevos en tablas de negocio.
- Governance: **25 tests PASS**.
- Typecheck: **PASS** (agente y verificación independiente root).
- Build Nitro/Cloudflare: **PASS**, Node20.20.2 local; no deploy.
- Lint producción tocada y módulos/tests M2 nuevos: **PASS**.
- Full lint: **12963 errores / 44 warnings**, frente a **12984 / 44** en A3 base.
  No archivo aumenta su conteo; deuda previa preservada, incluido types.ts2269.
  No afirmar lint global PASS.
- git diff --check: **PASS**.
- r2 SHA-256 intacto:
  `7eefc3cd73a20e3677d5248aef12fbfaa6bd7c02ff43b65e97a67952cedb2a85`.

Logs locales: `/tmp/offer-pricing-m2-vitest-final.log`,
`/tmp/offer-pricing-m2-postgres-final.log`, `/tmp/m2-typecheck.log`,
`/tmp/m2-build.log`, `/tmp/m2-lint.log`, `/tmp/m2-governance.log`,
`/tmp/m2-final-full-lint.json`, `/tmp/m2-base-lint.json`.

## Dictamen

READY WITH WARNINGS para revisión humana: dependencia A3, deuda global lint existente,
locks conservadores serializando capturas por menú y ausencia de aplicación proveedor/
activación UI. Ni Gate7 ni contratos comerciales nuevos ni migración real certificados.
La entrega revisable permite PR separado; no autoriza merge ni desplegar.

## PR Review Report — root, 2026-10-06

Branch: `cursor/offer-pricing-financial-integration`. Base de PR: rama A3
`cursor/cr-order-a3-dish-writer`, commit exacto citado arriba. PR apilado: revisar
únicamente M2 y retarget a main después del merge humano de #496.

Arquitectura, contratos, TypeScript, regresión, evidencia: PASS local. Tests pertinentes:
PASS; suite auxiliar doctor: WARN por entorno. Lint: WARN global preexistente, PASS
código nuevo. Android/APK/ADB: N/A; no se afirma validación de dispositivo. Era2/Laws:
inversión para evitar recotización silenciosa/pedidos parciales, sin observación UX inventada.
Riesgo: HIGH para futura aplicación de esquema; locks de menú conservadores, ACL/owners/
triggers existentes requieren preflight real. No P0/P1 conocidos en el diff revisado.

Revisión independiente: límite SSR/backend, política comercial inicializada, respuesta
financiera/identidades, ACL y cierre bare writer, idempotencia y locks, guard legacy
restauración/status, rollback y contratos congelados. Findings corregidos antes del PR.

Comprobación auxiliar del script completo `test:doctor:unit`: 55/57 PASS; fallan el probe
externo example.com (timeout) y el diagnóstico del repositorio por falta de
`VITE_SUPABASE_PUBLISHABLE_KEY` en el entorno aislado. Estos checks no se modifican ni
se introducen credenciales para hacerlos pasar. Los mismos dos fallos se reproducen en A3 base (log `/tmp/a3-doctor-baseline.log`).
No afirmar npm test completo PASS.
Logs adicionales: `/tmp/offer-pricing-m2-doctor-final.log`,
`/tmp/offer-pricing-m2-governance-final.log`.

Resultado: **READY WITH WARNINGS / READY FOR HUMAN REVIEW**. La producción no fue
modificada; merge, migraciones y activación siguen sujetos a autorización separada.
