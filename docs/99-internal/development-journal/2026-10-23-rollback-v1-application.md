# Marcha atrás — Pedidos y Cocina, sin activación

## DOCUMENT CONTEXT CHECK

L0 FOUNDATION; L1 AGENTS y ENGINEERING_OPERATING_PROTOCOL; L2 contexto estratégico, filosofía y CTO;
L3 transiciones operativas existentes y guard_v2; L4 alcance humano de retroceso v1;
L5 Gate 7 y separación de migración/activación consultados. Se reutiliza el dominio actual.
Problema: corregir avances erróneos en cocina sin perder auditoría ni afectar pedidos no seleccionados.

## Cambios

Individual y masivo comparten confirmación, alcance multijornada, motivo obligatorio y resumen persistente
con estados antes/después y cantidades de éxitos/omitidos/fallos. No se afirma atomicidad global del lote.
Los pedidos desconocidos y v2 siguen excluidos. El backend recibe el estado, revisión y fechas del operador;
no adapta silenciosamente un estado obsoleto al leído posteriormente.
Se admite el permiso operativo de Cocina/Producción, manteniendo excluidos clientes y staff no operativo.
Pedidos deja de depender exclusivamente de la constante falsa. Se centraliza la lectura del flag de build.

## Flag Vite

Prueba con `vite.build`, configuración aislada, sin escribir bundles: flag ausente y false → desactivado;
true en compilación → activado en ese módulo sintético. Se restaura el entorno tras cada prueba.
La lectura productiva usa import.meta.env, para que cliente y SSR compartan el valor compilado.
Una variable runtime del Worker no sustituye la compilación. No se ha cambiado ninguna configuración de despliegue.

## Publicación, en orden y con autorizaciones distintas

1. Revisar/mergear PR backend; autorizar aparte su instalación dirigida únicamente a EatClean.
   El canal de migración debe seleccionar expresamente `20261023065216_cr_order_rollback_v1_atomic.sql`
   y verificar primero baseline/esquema/proyecto. No aplicar SQL manual ni migraciones ajenas.
2. Verificar en lectura la firma, permisos y esquema del RPC instalado y ejecutar pruebas autorizadas de staging.
3. Revisar/mergear este PR de aplicación. Mientras el flag no esté activo, sigue bloqueado.
4. Solo tras nueva autorización humana: preparar una compilación con VITE_OPERATIONAL_ROLLBACK_ENABLED=true,
   revisar el artefacto y aprobar su publicación protegida. No basta alterar la variable runtime del Worker.
5. Validación operativa humana de un v1 de prueba: antes/después, motivo, auditoría, fechas y pedido no seleccionado.

Si existen servicios de entrega más avanzados que el destino, el RPC rechaza la operación sin cambiar nada;
no se revierten entregas ni trabajo logístico automáticamente. Los v2 requieren ampliar el ciclo de vida
canónico (revisión, idempotencia, dependientes y auditoría); no se usa el RPC v1 ni se desactiva guard_v2.

## Cierre de revisión

Se excluyen las fechas de delivery_services archivados del snapshot UI, igual que en el RPC.
El modal no puede cerrarse por Escape/X/exterior mientras ejecuta. El resumen conserva resultado por pedido,
incluidos motivos de omisión, y el detalle se refresca al cerrar tras éxito o fallo para no reintentar sobre datos
obsoletos. Pruebas específicas del mapper, guard de cierre y resultado parcial SSR; no se presentan como E2E.
