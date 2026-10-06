# Offer Pricing M2: validación PostgreSQL local

Ejecutar desde la raíz del checkout con Node 20 y PostgreSQL 17 locales:

```sh
CR_ORDER_LOCAL_PG_BIN=/ruta/absoluta/postgresql/bin CR_ORDER_LOCAL_PSQL=/ruta/absoluta/psql node --test supabase/tests/offer-pricing-m2/local-integration.mjs
```

El runner crea un cluster temporal propio, escucha exclusivamente en su socket Unix,
usa un migrador **no superuser** y elimina el cluster al terminar. No recibe URL,
credenciales ni host de Supabase. Aplica fixture A3, A1, A3 y M2 en orden.
Los grants generales de `service_role` en la fixture simulan la plataforma; la
migración M2 no concede acceso general adicional a tablas de negocio.

La cotización y commit son RPC `SECURITY INVOKER` con EXECUTE exclusivamente backend.
El hook y guard legacy pertenecen al rol privado existente `cr_order_writer`,
NOLOGIN/NOBYPASSRLS y sin membresía de clientes. El guard legacy usa
`SECURITY DEFINER` únicamente para locks de lectura bajo las políticas RLS del rol:
exige `auth.uid()` real, capability y propietario/staff antes de bloquear menú,
slots y Dish. Un GUC actor forjado no sustituye identidad. No ofrece un callable
privilegiado al navegador. El guard A3 de v2 se ejecuta antes por orden alfabético
para impedir que una mutación browser aproveche el early return de M2.

Resultado local: **22 tests PASS** (21 escenarios más suite). Incluye roles reales,
captura/snapshot/zero, política comercial, ausencia/ambigüedad, drift y expiración,
retry concurrente, restore/status legacy, carrera NULL→precio explícito y rollback
completo ante fallo de audit. Locks amplios sobre un menú serializan capturas de
esa semana; un conflicto/timeout falla cerrado y no se convierte en autorización.
No se certifica aquí la atomicidad histórica de los workflows v1 comerciales.
