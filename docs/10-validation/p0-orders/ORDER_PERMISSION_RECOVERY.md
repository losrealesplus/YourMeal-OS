# P0 — Recuperación de pedidos: corrección mínima preparada

Estado: LOCAL_SQL_QUALIFIED / HOSTED_EXECUTOR_BLOCKED / ORDERS_FLAGS_UNCHANGED.
Base: 9059a666235bc3809adf964ff05666f38731c0b8. Rama local separada: codex/eatclean-orders-permission-recovery. Sin PR ni push.

## Evidencia productiva permitida

Consulta exclusiva de catálogos en transacción READ ONLY, proyecto nhirlpkuvonggctdzzad, 11/10/2026:

- current_user = session_user = postgres; PostgreSQL 17.6.
- auth owner = supabase_admin.
- cr_order_writer USAGE auth = false.
- postgres USAGE WITH GRANT OPTION auth = false.
- postgres privilegios efectivos del propietario auth = false.
- guard_legacy_offer owner cr_order_writer; SECURITY DEFINER; search_path vacío.

No se leyeron filas de clientes/Auth, secretos ni archivos de servidor. No hubo escrituras productivas. No se probó SET ROLE ni se concedieron privilegios. Esta evidencia confirma que el canal actual no acredita autoridad para el GRANT; no demuestra que no exista otro canal legítimo del proveedor.

## Solución A recomendada

Reutilizar sin modificar:

supabase/migrations/20261010155728_release_cr_order_writer_auth_usage.sql
SHA256 86d6203287bedf2f87c7f9dd11c47a99c7efce635266efedccebba0215d8fac5.

El ejecutor necesita ser propietario efectivo del esquema auth o disponer de USAGE WITH GRANT OPTION, mediante canal legítimo aprobado. No asumir que postgres puede hacerlo, no cambiar propietario, no ampliar memberships ni usar service_role para eludir negocio. La intervención mínima del propietario/proveedor es conceder USAGE ON SCHEMA auth TO cr_order_writer, conservando NOLOGIN/NOSUPERUSER/NOBYPASSRLS y EXECUTE existente sobre auth.uid(), sin SELECT sobre auth.users.

Postcondiciones: USAGE efectivo; flags del writer conservados; ausencia SELECT Auth; propietarios/triggers/RLS intactos. Después ejecutar pedido de aceptación bajo autorización independiente y con datos apropiados. Este documento NO autoriza ejecutar el GRANT.

Reversión: exclusivamente operador legítimo, bajo autorización independiente y pausa de escritores; REVOKE USAGE ON SCHEMA auth FROM cr_order_writer solo si el permiso estaba ausente inicialmente, fue concedido por esta intervención y la revisión de dependencias permite retirarlo. Revocarlo vuelve a bloquear pedidos; no es una reversión operacional transparente. No borrar pedidos ni alterar ledger para simular rollback.

## Dependencia de precio y atomicidad

El laboratorio reutilizó también la corrección ya versionada:

supabase/migrations/20261010155729_release_program_draft_order_price_snapshot.sql
SHA256 7a2b1f9a530f6edca8bd73bde6a53dd01fe6124750a417fcd1d9701ba0a5f106.

Conserva ownership/ACL y requiere definición original exacta. No se aplicó productivamente ni se afirma que sea aplicable al origen sin comprobar su precondición. No modificar las migraciones P34 originales. No aplicar A5.

El flujo staff actual escribe cabecera y líneas en requests independientes y después intenta compensación DELETE. El laboratorio demostró que un fallo de línea extranjera deja una cabecera comprometida antes de compensación. Su atomicidad estricta NO está acreditada: el permiso no resuelve este problema. La RPC existente program_draft_order, con corrección de snapshot, sí permite recuperar el pedido draft completo de forma atómica. No sustituir automáticamente el flujo staff por ella: autoConfirm, comentarios, overrides, snapshot dietético y alta P34 deben preservarse explícitamente antes de integrarlo.

La opción B (reducir dependencia auth del trigger) no se implementa porque afecta múltiples funciones/políticas del writer; un wrapper externo no elimina llamadas internas auth.uid(). No derivar identidad de claims manipulables ni desactivar guards. La opción A es la modificación mínima que el laboratorio demuestra suficiente para el permiso.

## Laboratorio y resultados

qualify-permission-recovery.py: PostgreSQL 17.6, imagen digest 3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b; contenedor propio yourmeal-p0-orders-synthetic-20261011, --network none, sin puertos ni mounts compartidos, tmpfs, sin datos reales. Migraciones del repositorio reproducidas excluyendo P34, A5 y las dos correcciones durante la preparación; las correcciones se aplicaron explícitamente después de reproducir el fallo.

20/20 comprobaciones PASS en la ejecución final:

- Versión 17.6; customers sin revision; propietario real y SECURITY DEFINER del trigger; USAGE inicialmente ausente.
- 42501 reproducido en cabecera a través de dependencia de policy/función del writer; cabecera fallida no persistida. Esta fase concreta es de laboratorio, no se extrapola como fase observada del incidente productivo.
- USAGE mínimo efectivo; sin SELECT Auth ni LOGIN/SUPER/BYPASS del writer.
- Staff cliente existente: cabecera, líneas, qty=2, unit_price=8.5 y confirmación PASS.
- Riesgo de cabecera huérfana en requests staff separados demostrado.
- RPC draft staff: precio de catálogo y qty correctos; tenant/dish extranjeros rechazados; fallos sin cabeceras parciales.
- B2C propietario: operación SQL PASS; identidad vacía rechazada; RLS activo y lecturas de otro tenant ocultas.
- CLEANUP PASS: eliminación y ausencia del contenedor propio verificadas.

Se corrigieron solo defectos del fixture: espera del servidor TCP definitivo, valor válido membership_type=customer con rol staff independiente y escenario de fallo de línea mediante plato extranjero. No se debilitaron controles para obtener PASS.

STAFF_EXISTING_CUSTOMER: SQL_PASS; flujo frontend completo no acreditado.
STAFF_NEW_CUSTOMER: BLOCKED por dependencia P34/create_staff no aplicada en el esquema reproducido.
B2C_ORDER: SQL_PASS con precio corregido; flags EatClean siguen false.
ATOMICITY: RPC_PASS / STAFF_SEPARATE_REQUESTS_NOT_ATOMIC.
RLS: SQL_PASS dentro del laboratorio.
LAB_E2E: DATABASE_INTEGRATION_PASS; AUTHENTICATED_APP_E2E NOT_TESTED (sin GoTrue/PostgREST/navegador en esta ejecución).
READY_FOR_REVIEW: YES, propuesta de permiso y límites; READY_FOR_PRODUCTION: NO.

## Próxima acción

Obtener del proveedor/propietario un canal legítimo para el USAGE mínimo, sin compartir credenciales con agentes. Separadamente completar la adaptación atómica staff y aceptación autenticada antes de activar flags; el hotfix #522 no contiene cambios de pedidos. No se solicita ampliar privilegios del operador postgres ni reabrir P34.

Referencia oficial sobre roles administrados: https://supabase.com/docs/guides/database/postgres/roles (supabase_admin es rol interno del proveedor; Dashboard ejecuta como postgres).
