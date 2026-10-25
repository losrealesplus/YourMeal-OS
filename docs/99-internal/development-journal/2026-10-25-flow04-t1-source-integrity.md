# FLOW-04 · Integridad de T1 · PR #554

Autorización limitada: cerrar origen de cantidades, discrepancias de reintentos y concurrencia de T1 en la misma rama; mantener Draft y dependencia de #553. Sin merge ni operaciones productivas.

Contexto consultado: FOUNDATION, AGENTS, estrategia, filosofía, CTO, protocolo operativo y especificación congelada FLOW-04. No cambios relevantes respecto al contexto de #553; la fuente canónica existente es `order_items` de pedidos operativos no eliminados × `dish_ingredients` del mismo tenant e ingredientes activos. No se modifica Pedidos ni Cocina.

## Contrato corregido

- El RPC recalcula cantidades en servidor con esa fuente. Compara ingrediente, unidad y cantidad agregada con la petición; rechaza falsificaciones, duplicados y ausencia de fuente. Nombres y líneas persistidos provienen del servidor.
- Serializa `(tenant, fecha)` con bloqueo transaccional antes de leer/crear: dos peticiones iguales devuelven una sola cabecera y líneas, una creación y un resultado idempotente.
- Repetición exacta válida devuelve el plan existente en su estado actual. Diferencias entre petición/fuente o plan guardado/fuente fallan con `22023`; no sobrescribe ni replanifica silenciosamente un consumo `planned`, `applied` o `sealed`. La discrepancia requiere reconciliación explícita fuera de esta corrección.
- El servicio vuelve a validar T1 en cada llamada: se elimina la salida anticipada que devolvía planes sin contrastar la fuente. El adaptador en memoria conserva el mismo contrato de idempotencia.
- La precisión persistida es de tres decimales: el servidor rechaza una fuente no representable; la adaptación de cantidades elimina residuos binarios de JavaScript al enviar el RPC.

## Pruebas y dependencia de laboratorio

12 pruebas PostgreSQL/PostgREST PASS: suite previa T1/T2/T3 + negativos mínimos de origen, discrepancias y dos creaciones simultáneas. Las dos conexiones se observaron esperando el bloqueo del mismo tenant/fecha antes de liberarlo. Incluye recepción #553 → planificación → descuento persistente → sellado, permisos, aislamiento, atomicidad y concurrencia T2.

34 pruebas reales de #553 PASS y 151 regresiones PASS; typecheck y política estática de migraciones PASS. Las integraciones opt-in se ejecutaron por separado, no se cuentan sus skips como PASS.

Laboratorio propio de `scripts/receipt553-local-lab.py`, red interna, sin DSN del host ni proyectos compartidos. El bootstrap ordinario excluye `20261010155728_release_cr_order_writer_auth_usage.sql`; la fixture aplica esa corrección existente **solo en el laboratorio** para que el guard canónico pueda resolver `auth.uid()`. No se desactiva ningún trigger ni se introduce una migración nueva. La instalación futura debe verificar ese prerrequisito existente en su preflight autorizado.

No se amplía a 1B ni se cambian pedidos, cocina, SQL o despliegue productivos. Recomendación: revisión humana de #553 → #554, con autorización posterior e independiente para integración y publicación.
