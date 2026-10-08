# P34_IMPLEMENTED_READY_FOR_REVIEW

## Alcance y estado

Implementación local de D1–D5 aprobadas por Alexander: asociación explícita tenant/identidad/CRM, doble confirmación asistida, perfil comercial canónico, direcciones múltiples con default coherente, revisión optimista, idempotencia y auditoría transaccional. Preparación Google/Apple únicamente: sin habilitar providers. Baseline exacto `df7526e957507eb70d76f36fbfa7f93be0a8213c`.

La base canónica sigue siendo customers/customer_phones/customer_addresses. El ledger privado guarda fingerprint y metadatos de commit; no crea otra base de contactos. La autoridad comprueba auth.uid y membership aprobada del tenant. El cliente no obtiene customers.write. Un rol NOLOGIN acota los writes. Los callers CRM legacy usan la misma frontera; no cambia pricing/lifecycle ni los writers de pedidos. La lectura de default deja de escoger arbitrariamente una dirección. Los registros históricos referenciados no se borran.

## Evidencia local

- Suite offline: 312 archivos, 2.005 pruebas PASS. Excluidos live-break-test (HTTP live/DNS ya fallaba en baseline) y performance-baseline (escribe baseline persistida); esto no equivale a suite live global verde.
- SQL/RLS: 30 comprobaciones PASS y 66 migraciones aplicadas en PostgreSQL 17.6 aislado Linux aarch64. Incluye denegación de otro tenant/owner, replay exacto, mismatch, revisión stale, carreras staff/cliente, linking doble, alta implícita rechazada, tipos/email inválidos, DML raw y service_role denegados. Definiciones de funciones order/offer existentes idénticas antes/después.
- Interfaz: 12 escenarios PASS con componentes reales conectados a SQL aislado. Incluye default/archive/restore y readback de respuesta perdida sin segunda mutación. Auth/router/SSR transport son fixtures sintéticos; no certifica JWT/OAuth reales. CSS del harness: no certificación visual productiva.
- Typecheck, build y governance 25/25 PASS. git diff --check PASS.
- Archivos nuevos de TypeScript/UI: lint PASS. En tres archivos legacy quedan errores any/prefer-const ya existentes; comparación con baseline registrada. Lint global no certificado verde.
- Imagen local fijada por digest registrada en P34_LOCAL_SQL_EVIDENCE.json. Sin conexiones provider/cloud ni secretos productivos; contenedores propios temporales retirados, Supabase local existente intacto.

## Bloqueos y límites explícitos

1. P34.2/OAuth NO ACTIVABLE: la política legacy `20260908120000_customer_deployment_auto_approval.sql` aún aprueba membership mediante asociación de deployment del callback. Se eliminan grants implícitos del ensure de CRM, pero eso no revoca la política independiente. Resolver el conflicto con D2 exige decisión humana separada; no se altera governance aquí.
2. Migración local preparada, NO aplicada al proveedor. Preflight live debe revisar privilegios auth/schema, owners, ACL/RLS, unicidad de asociaciones, hijos cross-tenant/defaults legacy y grants de writers. La migración falla ante inconsistencias; no repara datos automáticamente. La fixture local concede grant options sintéticos; no demuestra permisos live.
3. Perfil revisado por CRM no modifica Auth email ni verifica identidad por coincidencia de email. Apple relay se explica como método de login, no identificador comercial fiable.
4. Una petición incierta queda bloqueada hasta readback; solo se puede reenviar el UUID/payload exacto tras ausencia observada. Recarga o cambio de sesión requiere reconciliación antes de una nueva operación. No hay retry automático mutador.
5. P34.5 local completada dentro de estos límites. Certificación provider/OAuth/productiva queda pendiente. A5 HARD_DISABLED; A4b última evidencia CLOSED, no recertificación live.

## Reproducción local

`npm run typecheck`; `npm run test:governance`; `npm run build`.
`node_modules/.bin/vitest run --exclude src/lib/live-break-test.spec.ts --exclude src/runtime/platform-contracts/performance-baseline.spec.ts`.
`python3 supabase/tests/p34/local-integration.py` y `node scripts/p34-local-browser.mjs` requieren Docker aislado y Chromium ya disponible; no instalar ni resetear Supabase. El harness no lee DSN/PG credentials del host. La salida de evidencia se ubica en ../../reports/eatclean-sprint-02 y debe existir.

## Entregas preparadas

P34.1: frontera SQL/CRM, permisos, servicios SSR, linking staff, adaptación mínima callers y pruebas SQL/unit.
P34.3/P34.4: interfaz self-profile/direcciones y E2E local. Depende explícitamente de P34.1; no presentar una rama apilada como independiente de main.
Push/PR no ejecutados bajo autorización limitada a preparación de PR. Sin merge, deploy, provider migration, OAuth activation ni gate productivo.
