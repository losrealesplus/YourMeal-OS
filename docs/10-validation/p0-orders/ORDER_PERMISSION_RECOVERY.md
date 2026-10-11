# P0 — Recuperación de pedidos: corrección mínima preparada

Estado: LOCAL_SQL_QUALIFIED / HOSTED_EXECUTOR_BLOCKED / ORDERS_FLAGS_UNCHANGED.
Base inicial: 9059a666235bc3809adf964ff05666f38731c0b8. Rama histórica local: codex/eatclean-orders-permission-recovery. Sin PR ni push.

## Evidencia productiva permitida

Consulta exclusiva de catálogos en transacción READ ONLY, proyecto nhirlpkuvonggctdzzad, 11/10/2026:

- current_user = session_user = postgres; PostgreSQL 17.6.
- auth owner = supabase_admin.
- cr_order_writer USAGE auth = false.
- postgres USAGE WITH GRANT OPTION auth = false.
- postgres privilegios efectivos del propietario auth = false.
- postgres puede SET ROLE al propietario auth = false; superuser = false.
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

## Continuación: operación staff atómica implementada — 11/10/2026

Estado: LOCAL_ATOMIC_STAFF_ORDER_QUALIFIED / HOSTED_EXECUTOR_BLOCKED / ORDERS_FLAGS_UNCHANGED.

`public.capture_staff_existing_order(uuid,jsonb)` es una RPC nueva, SECURITY INVOKER con search_path vacío, EXECUTE exclusivamente para authenticated, RLS y triggers intactos. Solo acepta Company Admin / Operations Manager con membresía aprobada y cliente existente del tenant. No utiliza actor suministrado por el caller ni service_role. Conserva el contrato legacy version 1; no habilita writer V2, A5 ni el circuito comercial de quotes.

Una sola transacción crea draft, líneas, total calculado por el servidor, confirmación opcional y auditoría. No se utiliza compensación DELETE. El servidor valida cliente/tenant, oferta publicada, día, cantidad entera positiva, precio finito no negativo y relaciones empresa/sede/unidad. Conserva comentarios y overrides staff, obtiene el perfil dietético actual y deriva la autoría desde auth.uid(). Los precios específicos de slot siguen requiriendo su vía de quote y se rechazan en este circuito, igual que antes.

Adaptador Repository y servicio preparados únicamente para EatClean + cliente existente. El freeze se comprueba primero y sigue false en las features de producción; no se reactiva el flujo. Otros tenants y el alta de nuevos clientes conservan su comportamiento anterior, que no se certifica como atómico por este cambio.

SQL mínimo para este alcance: el USAGE ya preparado y la nueva migración `20261011163814_staff_existing_order_atomic_capture.sql`. Hashes/ejecutor en ATOMIC_STAFF_ORDER_SQL_MANIFEST.json. La corrección de program_draft_order no es dependencia de esta RPC; sigue siendo necesaria si se decide recuperar aquel flujo B2C. No se alteraron las migraciones originales P34, los dos SQL anteriores, flags ni governance.

Pruebas nuevas: 37/37 PostgreSQL PASS en contenedor propio `yourmeal-p0-orders-atomic-20261011`, imagen digest anterior, sin red/puertos/mounts y PGDATA tmpfs. Evidencia ATOMIC_STAFF_ORDER_SYNTHETIC_RESULT.txt. Incluye rollback de segunda línea inválida, fallo de confirmación y fallo de auditoría; compara cabeceras, líneas y auditorías antes/después. Verifica roles staff, membresía, tenant/customer extranjero, RLS, precios/total, comentarios, snapshot dietético y relaciones empresariales. CLEANUP PASS con ausencia independiente del contenedor.

29/29 Vitest PASS: 8 pruebas nuevas del adaptador/frontera, 11 del servicio existente y 10 del freeze. Typecheck, lint focalizado y diff-check PASS. Se corrigieron incompatibilidades locales de la implementación con tipos reales (order_items sin created_at; audit_log.entity_id UUID). El fixture empresarial incluye company_code requerido; no se relajaron constraints ni guards.

Límite: integración SQL con rol authenticated e identidad sintética configurada por el laboratorio; NO es login real GoTrue ni E2E navegador/PostgREST. No hubo conexión productiva en esta continuación. Una respuesta de transporte perdida no acredita si el commit ocurrió: no hay retry/fallback automático, y antes de un intento manual debe reconciliarse el resultado. No se certifica exactamente-una-vez/idempotencia.

Información exacta para Supabase Support (borrador, no enviado):

> Proyecto nhirlpkuvonggctdzzad, PostgreSQL 17.6. Solicitamos el canal oficial o intervención del propietario para conceder únicamente GRANT USAGE ON SCHEMA auth TO cr_order_writer. auth pertenece a supabase_admin; el canal postgres comprobado carece de USAGE WITH GRANT OPTION, membresía efectiva/SET al propietario y superuser. cr_order_writer es NOLOGIN/NOSUPERUSER/NOBYPASSRLS y ya tiene EXECUTE auth.uid(); su guard_legacy_offer SECURITY DEFINER requiere resolver auth.uid(). No solicitamos SELECT sobre auth.users, cambio de propietario ni ampliación de roles. Indicar quién puede ejecutar el GRANT y cómo verificar su efectividad sin acceder a filas Auth.

Siguiente decisión: autorización independiente para publicar/revisar este paquete local, sin merge/deploy implícitos. En paralelo el propietario puede solicitar a Support el canal legítimo. Aplicación SQL, publicación y activación del flujo necesitan decisiones posteriores; no están autorizadas por esta preparación. Antes de integrar debe reconciliarse la rama basada en 9059a666 con el main actual del hotfix #522, sin modificar ni repetir su incidente. La aceptación autenticada de pedidos y la habilitación quedan pendientes.

## Preparación de PR sobre main vigente

Base de revisión: 27dc2bda8844b7c27a2df9f2deac2433a9789f39 (contiene PR #522). Rama: codex/eatclean-atomic-staff-order-capture. Se incorporan exclusivamente los checkpoints de pedidos, preservando la rama anterior. Diff sin cambios de customer-directory, flags, workflows, governance ni migraciones anteriores.

**Exposición directa:** la migración nueva concede EXECUTE a authenticated dentro de la misma transacción que crea la RPC. Aplicarla habilita el acceso directo para staff autorizado del tenant, aunque la UI de EatClean siga congelada. La RPC no consulta flags frontend: estos no son una barrera de servidor. Por ello la autorización SQL futura debe incluir expresamente el momento de habilitación directa; no aplicar esta migración como preparación inocua mientras la creación de pedidos deba permanecer cerrada. La invocación directa conserva RLS, tenant, membresía aprobada y rol Company Admin/Operations Manager; anon, service_role y customers sin rol staff están rechazados. No hay ampliación de permisos sobre tablas.

Orden mínimo propuesto, todavía NO autorizado productivamente: (1) proveedor/propietario legítimo verifica y concede el USAGE mínimo ya versionado; (2) operador de migraciones autorizado crea esta RPC y concede su EXECUTE en la ventana de activación aprobada; (3) aceptación autenticada y publicación/activación de aplicación bajo autorización específica. El permiso debe verificarse antes de habilitar el endpoint. No ejecutar una cadena automática de todas las migraciones pendientes: P34/A5 no forman parte del paquete SQL mínimo.

La pérdida de respuesta después del COMMIT puede dejar un pedido íntegro creado sin que el cliente lo conozca. No existe idempotencia de request en esta RPC ni fallback/retry automático en el adaptador. Antes de repetir manualmente, el operador debe reconciliar el pedido creado; atomicidad no equivale a exactamente-una-vez.

Validación tras integración: 37/37 controles atómicos PostgreSQL PASS, 20/20 controles existentes de permiso PASS; 29/29 Vitest PASS, typecheck y lint focalizado PASS, build SSR local PASS. E2E GoTrue/PostgREST/navegador NOT_TESTED. La reproducción PostgreSQL excluye P34 y A5 explícitamente; no acredita el estado ni la autoridad productiva del proveedor.

Clasificación pura de las 10 rutas del PR con reglas Gate7 vigentes: REQUIRES_SEPARATE_AUTHORIZATION. SPECIAL: ORDER_PERMISSION_RECOVERY.md, qualify-permission-recovery.py, development-journal/2026-10-11-orders-permission-recovery.md y la migración nueva. No se genera autorización de release ni se reutiliza autorización histórica. Cualquier delta productivo posterior debe recalcularse contra su baseline vigente.
