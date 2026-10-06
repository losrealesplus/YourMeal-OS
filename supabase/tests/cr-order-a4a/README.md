# A4a — PostgreSQL local con roles efectivos

Ejecutar desde la raíz: `node --test supabase/tests/cr-order-a4a/local-integration.mjs`.

El runner crea y elimina un clúster PostgreSQL 17.10 propio en una carpeta temporal,
con socket Unix y `listen_addresses=''` (sin TCP). No utiliza URL, credenciales,
proyecto Supabase ni CLI de proveedor. Binarios por defecto:
`/tmp/offer-embedded/package/native/bin`; cliente `/opt/homebrew/bin/psql`.
Overrides locales: `CR_ORDER_LOCAL_PG_BIN`, `CR_ORDER_LOCAL_PSQL` (rutas absolutas).

El ejecutor de migración es NOINHERIT, NOLOGIN y no superusuario; CREATEROLE permite
preparar el rol privado ya requerido por A3. API y cocina se prueban con SESSION
AUTHORIZATION y SET ROLE reales, no solamente con claims/GUC. Se conserva la
separación entre el rol del escritor privado, propietario de tablas y callers.

Fixtures A1/A3/M2 + migración A4a real, constraints y RLS activos. Custom queda
CLOSED: la migración no inserta filas en `cr_order_private.custom_activation` y
ningún rol API puede editarla. El fixture local la abre explícitamente con el
migrador; no genera un mecanismo de activación productiva.

Matriz: pure custom sin menú, mixed con quote dish M2, dish-only, homónimos con UUID
distintos, actor/owner/otro cliente/kitchen/suspendido/cross-tenant/anon,
precio/qty/nombre/fecha inválidos y cero explícito, idempotencia/hash/conflicto y
concurrencia, edición con UUID estable/archivo/revision, bypass directo/legacy/GUC,
repetición con confirmaciones ligadas al intento actual, batch discriminado y
transiciones kitchen serializadas/auditadas, bloqueo operativo y rollback tras
cada frontera (cliente, pedido, items, delivery, audit). Cierre de gate también
bloquea modificar una orden custom reemplazando sus líneas por dish.

`written-fixture.json` contiene exclusivamente datos sintéticos realmente escritos
por el commit canónico mixed (pedido confirmado, dish y dos custom homónimas), para
las regresiones downstream A2. Reruns normales no lo reescriben. Regeneración
explícita: `CR_ORDER_A4A_EXPORT_FIXTURE=1 node --test supabase/tests/cr-order-a4a/local-integration.mjs`.
UUID y timestamps serán nuevos; los snapshots UNKNOWN/precios/identidades se
preservan como filas de BD, sin reescritura del estado para hacer pasar lectores.

Límites: el modelo aislado no certifica owners/ACL/triggers/datos del proveedor
real, ni rollout/activación/UI. Reconciliación, migración y activación siguen
requiriendo gates humanos separados. Repetición debe conservar provenance desde
el adaptador: una entrada nueva staff sin provenance no se puede distinguir de
una propuesta cuyo origen se eliminó, y SQL no infiere origen por nombres.
