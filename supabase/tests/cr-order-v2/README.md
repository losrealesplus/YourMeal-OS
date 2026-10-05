# A3 — Integración PostgreSQL aislada

La suite inicia un cluster nativo temporal propio, con TCP desactivado, aplica un fixture sintético y los archivos reales de migración A1/A3 y elimina el cluster al terminar. No lee URLs ni credenciales de proveedor y no conecta a una base local preexistente. El fixture refleja las tablas, alias, ACL de helpers y pertenencia que utiliza esta unidad; no es un dump productivo ni prueba de preflight del proveedor.

Ejecutar con una distribución PostgreSQL local y psql:

```sh
CR_ORDER_LOCAL_PG_BIN=/absolute/path/to/postgresql/bin \
CR_ORDER_LOCAL_PSQL=/absolute/path/to/psql \
node --test supabase/tests/cr-order-v2/local-integration.mjs
```

Runtime validado: PostgreSQL 17.10 en `/tmp/offer-embedded/package/native/bin` y psql en `/opt/homebrew/bin/psql`. Las rutas pueden configurarse con las variables anteriores. Los roles y bases se crean únicamente dentro del cluster temporal propio. A1/A3 se aplican con propietario no superusuario, NOINHERIT y CREATEROLE. Las llamadas API cambian SET SESSION AUTHORIZATION; no conservan accidentalmente privilegios de una sesión superusuario.

19 tests (18 escenarios y suite) verifican totales decimales, override con motivo auditado/cero confirmado, snapshots, replay con revisión confirmada y lectura posterior, revisiones optimistas, rollback de cliente/pedido/items/entrega/audit/ledger, personal autorizado y denegaciones de cocina/cliente/anon/suspendido/otro tenant, autoridad o GUC falsificados, ledger cerrado, paths directos/definer legacy, drift de catálogo/dirección, concurrencia y creación de lote bajo DateStyle distinto. La eliminación del autor conserva el conocimiento del snapshot mediante la FK SET NULL prevista en A1.

A3 es fundación dish-only: custom, flujo comercial/slot explícito y entrega B2B siguen cerrados; no se activa UI ni se reemplaza el pricing legacy de clientes. Los callers v1 permanecen. Una línea histórica v1 requiere reemplazo explícito para convertirla en snapshot v2. Un cliente sin cotización recibe COMMERCIAL_QUOTE_REQUIRED. M2 debe revocar ejecución autenticada del writer bare antes de usar su flujo cotizado de servidor.

La RPC pública es SECURITY INVOKER. El núcleo privado y el checker diferido pertenecen a cr_order_writer: NOLOGIN/NOINHERIT/NOBYPASSRLS, sin propiedad de tablas y sujeto a RLS por tenant/capability. El rol permite acceso al ledger cerrado y procedencia no falsificable; un GUC del cliente no autoriza escritura directa. CREATE de schema se concede solo durante transferencia de propiedad de funciones y se revoca. UPDATE en filas de catálogo/cliente existe porque SELECT con row lock lo requiere; no hay interfaz de SQL arbitrario ni membresía API en el rol. Cocina y edición canónica comparten claves advisory ordenadas con fechas ISO, también para lotes inexistentes.

El preflight del esquema/ACL real y la autorización separada de migración/activación siguen pendientes. Estas pruebas no certifican estado de proveedor ni activan el writer.
