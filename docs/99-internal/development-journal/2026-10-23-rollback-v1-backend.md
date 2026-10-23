# Marcha atrás v1 — backend preparado, sin instalación productiva

## Contexto y autorización

La operación de EatClean necesita corregir avances equivocados. Se recupera el RPC de `55889fc9`, retirado en `dec9d44b`, en una migración nueva generada por CLI. No se reabre arquitectura ni se alteran contratos v2.

Lectura autorizada de EatClean (`nhirlpkuvonggctdzzad`, tenant `8bba00ba-331b-42c8-9283-4e3836ffb870`) el 23/10/2026:
138 pedidos no archivados: v1 119 confirmados, 1 en preparación y 17 cancelados; v2 1 cancelado.
DISA: 118 confirmados, 1 en preparación y 8 cancelados, todos v1.
El pedido operativo en preparación es v1, revisión 0, fechas 19–22/10; sus cuatro servicios están pendientes. No se ha modificado.

## Integridad

RPC autenticado y limitado a roles operativos; revoca EXECUTE a PUBLIC/anon. Bloquea cabecera y dependientes,
verifica estado/revisión/fechas exactas y consentimiento multijornada, incrementa revisión y escribe auditoría
en la misma transacción. Solo permite prepared→in_production, in_production→confirmed y ready_for_delivery→prepared.
Los servicios de entrega deben estar pendientes, cancelados o ya en el estado objetivo; no se rebobina reparto silenciosamente.

V2 permanece rechazado: `cr_order_private.guard_v2` exige writer canónico y `cr_order_lifecycle` no ofrece acción
inversa. Añadirla requeriría extender sus validadores, revisiones, idempotencia, servicios, sesiones y auditoría;
no es necesario para el pedido actual y no se simula mediante UPDATE directo.

## Validación y frontera

Pruebas SQL sintéticas en BD Docker desechable con esquema local completo: PASS, incluida auditoría fallida,
concurrencia y pedidos no seleccionados. Se consultaron columnas, permisos y triggers productivos solo en lectura.
Pendiente instalar esta migración en el entorno correcto, con autorización humana separada y por el canal
controlado del repositorio. No ejecutar manualmente en Supabase. El flag de aplicación sigue desactivado.
