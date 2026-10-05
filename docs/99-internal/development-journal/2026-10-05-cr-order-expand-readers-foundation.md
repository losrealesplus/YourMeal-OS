# CR-ORDER — Primer PR expand/readers tras #492

Alexander autoriza únicamente primer PR compatible y drafting de Offer Pricing final. Main y merge #492 verificados en bb742f2da2bbe4d83c12bd16a889840c36057ea2; contrato r1/matriz conservan digests aprobados. Contexto obligatorio y Supabase docs/changelog consultados. No se reabre Core; razón operativa: preservar forma/identidad/snapshots antes de ofrecer escritura custom.

Columnas aditivas, CHECKs de fase dish/v1-only, dish_id NOT NULL intacto, idempotency foundation RLS/ACL cerrada y FKs tenant compuestas. Se evita ambigüedad PostgREST sustituyendo FK bajo mismo nombre en una transacción. Lectores tipados y snapshot-first; custom solo fixtures/modelo puro, downstream dish-only rechaza explícitamente hasta soporte completo posterior. No UI ni RPC writer nueva ni operación financiera cambiada.

Pruebas reales PostgreSQL local aislado con fixture sintético, roles y FK/ACL/RLS; migración incompatible aborta 23503 y revierte íntegra. 166 tests de pedidos/operaciones, 25 governance, typecheck/lint de cambios/build local; no afirmar RLS/capability certificada en producción ni historial completo ensayado. Problemas iniciales del harness local (rol postgres no superuser y readiness durante init) corregidos usando supabase_admin local y readiness TCP; no cambios a proveedor para pruebas.

Offer Pricing r2 se entrega como artefacto de drafting separado, no código en este PR. Inventario comercial demuestra ofertas por defecto en EatClean; regla mínima propuesta rechaza combinación de slot price explícito con pricing comercial hasta contrato compatible, sin desregistrar planes ni mutar 15 ofertas. Revisar esa limitación con Alexander antes de freeze.

Estado final: PR OPEN / READY FOR HUMAN REVIEW y Offer Contract READY FOR HUMAN APPROVAL. Merge, migration/provider, Gate 7, approval production-worker, deploy, data mutation y custom activation no realizados ni autorizados en esta unidad.
