# 2026-10-06 — Offer Pricing M2

Autorización POST-#494/#495 de Alexander Hernandez: implementación local, migrations
como archivos y PR; sin custom UI, edición de los 15 extras, proveedor ni deployment.
Base dependiente A3: `041a7476e20b5c33c43df01d82217a2dbb351039`.
Migración successor generada por CLI: `20261005174256_offer_pricing_canonical_quote_capture.sql`.

Implementados quote inmutable y commit backend ligados a identidad verificada,
request/comando completo, elegibilidad/estado/precio de oferta y política comercial
server. Commit A3 congela precio/name/allergen, total/audit/derivados/idempotencia en
una transacción; drift falla `PRICE_CHANGED`. Se preservan snapshots existentes y
retry comprometido; slot cero necesita confirmación. No prorrateo comercial ni
manual override en quoted flow. Legacy NULL conserva engine y overrides existentes;
nuevas capturas legacy con oferta explícita o referencia ambigua se detienen.
Confirmar un snapshot histórico no consulta la oferta actual.

Review cruzado root y agente operativo: corregidos ACL helpers backend, NULL context,
actor/GUC/JWT checks, duplicates financieros unánimes, orden de locks y race legacy,
restore/status financiero y validación exacta de DTO/total. Artefacto público no
contiene referencias a clave service-role, backend admin o getServerEnv.

Pruebas finales: 296 archivos / 1806 Vitest PASS (independiente root), 22 PostgreSQL
PASS (independiente root), 25 governance PASS, typecheck/build/lint producción tocada
+ nuevos módulos/tests M2/diff-check PASS. Full lint12963errores/44warnings frente
baseA3 12984/44; ningún archivo aumenta errores, types.ts2269deuda previa conservada.

Estado: READY WITH WARNINGS para revisión humana por dependencia A3 y deuda lint;
pendiente PR y aprobación humana. No merge, migración aplicada, datos de negocio ni
producción modificados. Ver reporte OFFER_PRICING_M2_IMPLEMENTATION_REVIEW.md.
