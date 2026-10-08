# P34 — Remediación de seguridad P2.2/P2.3

## Contexto y autoridad

Corrección autorizada por Alexander de los tres P2 de la revisión final. P34.1 parte de `41f78b80ef8b6b5d666feb5d9b82b1eeb58fa4d1`; la UI apilada parte de `16501925d3ed167f8514586739c485d726d214b0`. Sin merge, deploy, proveedor, OAuth ni activación.

## Cambios

P2.2: la verificación se liga a tenant, actor, customer ID, revisión y solicitud. El cambio de contexto invalida la selección y checkbox desde el render, antes del efecto de limpieza. La solicitud debe seguir pendiente. Un resultado incierto conserva UUID/payload originales y solo se reconcilia desde la ficha/sesión originales.

P2.3: migración aditiva `20261008160753_p34_identity_conflict_recovery.sql`, SHA-256 `81acb6ac9c87c3a38e60ff5f810ff9f6a0a201a015465b01e5b48eb57a0726b4`. No modifica migraciones anteriores. Amplía el estado terminal `closed` y registra actor, timestamp y razón fija `REVISION_CONFLICT`. El cliente solicita el cierre mediante la misma frontera SSR/RPC; SQL comprueba membership, propietario y conflicto real, bloquea solicitud y customer en el mismo orden que confirmación y escribe auditoría y ledger en una transacción. No altera el customer ni sus permisos. Replay exacto o cierre repetido conserva el timestamp original y una sola auditoría. Nueva solicitud exige otra aprobación y confirmación.

El wrapper canónico delega exclusivamente esta operación a una función SECURITY DEFINER de `p34_writer`, con search_path vacío. Resto de operaciones/declaraciones originales sin cambio. Sin acceso nuevo a auth; role NOLOGIN/NOBYPASSRLS. CREATE privado revocado al concluir. No permite cerrar solicitudes requested/consumed/expired ni aprobadas sin conflicto; solo el propio cliente, nunca por autoridad staff genérica.

## Validación local

- 50 comprobaciones SQL/RLS, incluidas dos membresías válidas para rechazo cross-tenant, cierre vs confirmación concurrente, cierres concurrentes, replay, auditoría única y rechazo de nonce antiguo.
- 405 pruebas customer-directory/company-accounts/orders PASS sobre la combinación con UI.
- 17 escenarios browser/SQL PASS en harness local; A→B y recuperación con nueva doble confirmación.
- 25 governance PASS; preflight estático PASS.
- Supabase CLI 2.109.1: db start, db reset --yes y migration list --local en proyecto NUEVO `p34-security-ci-isolated`, puertos 55434/55436, PostgreSQL 17: 67/67 entradas exactas. Docker OrbStack 29.4.0 aarch64. Nunca reseteado el proyecto existente.
- Typecheck/lint del alcance PASS. Build de UI y build P34.1 PASS.

Los resultados son de laboratorio: Auth/Storage sintéticos, sin OAuth/JWT reales, sin conexión ni certificación productiva. El warning de nueva versión CLI no implica upgrade: host intacto. CI remoto se documentará tras push.

## Límites y siguiente actor

Migración adicional requiere manifest/preflight/autorización independiente para proveedor. No se toca auto-aprobación legacy de membership: sigue bloqueando OAuth. A5 HARD_DISABLED; A4b sin activación autorizada. Nueva revisión de seguridad y revisión humana pendientes; ningún resultado equivale a autorización de merge.
