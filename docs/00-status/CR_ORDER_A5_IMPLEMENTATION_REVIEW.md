# CR-ORDER A5 — revisión de implementación

Estado: CR_ORDER_A5_IMPLEMENTATION_COMPLETE_READY_FOR_HUMAN_REVIEW.
Fecha: 2026-10-07. Autoridad humana: Alexander Hernandez.
Baseline de código: `8283d56092affa0e7aaa6bf26551a7098c82f561`.

## Contrato y alcance

La autorización congelada está en `docs/05-architecture/CR_ORDER_A5_APPROVED_CONTRACT.md`; ADR 0104 documenta la frontera. A5 es general v2 dish/custom/mixed. V1 conserva sus flujos. Ningún cambio de workflows, Wrangler, capabilities, flags o activación; ninguna migración histórica modificada. Las tres migraciones nuevas son locales y aditivas; no se aplicaron al proveedor.

A5.1 amplía el ledger a lifecycle con resultado persistido. A5.2 introduce acciones autenticadas en el writer canónico. A5.3 conecta confirmación/cancelación y los llamadores existentes sin reconstruir precios. A5.4 persiste evidencia operacional mínima en la frontera privada; packing/asignación v2 ya no depende de Maps del navegador. A5.x exige evidencia positiva de delivery y elimina el falso packed como valor de enum en el helper legacy. A5.5 aporta pruebas, matriz y límites de certificación.

## Autoridad y concurrencia

Los RPC públicos son INVOKER; el motor privado es SECURITY DEFINER propiedad de `cr_order_writer`. API pública authenticated solamente; el motor exige rol efectivo authenticated, auth.uid, membership activa exacta y autoridad de dominio. Confirm/cancel requieren staff más orders.write. Cocina/producción/logística usan acciones acotadas, sin recibir orders.write ni elegir toState. PostgreSQL/service_role o GUC forjado no constituyen autorización.

Locks ordenados: request → claves día/plato/custom → parent → servicios → evidencia. Comparación de revisión, ledger y audit comparten transacción con parent y dependencias. Hash de petición liga tenant, request, actor verificado, autoridad, comando completo y destino derivado. Replay devuelve el resultado original; input distinto genera conflicto. Nueva petición de cancelación de cancelled devuelve ALREADY_CANCELLED sin revisión, ledger, auditoría ni cascada. Evidencia operacional también incrementa revisión para serializar edit/cancel, conservando estado parental.

El ledger y auditoría lifecycle son inmutables. Guards impiden escrituras v2 por caminos heredados. El superusuario que deshabilita triggers o redefine funciones está fuera del contrato; las pruebas no prometen proteger contra administración deliberadamente destructiva.

## Transiciones y preservación

`CR_ORDER_A5_FROZEN_TRANSITIONS.csv` contiene los 81 pares. Nueve estados persistidos existentes, sin nuevos enums; spine sin saltos y issue/retry acotados. Cancelación solo en los cinco estados iniciales y con parada segura demostrable. Servicios pending/in_production/prepared/ready_for_delivery pueden cancelarse únicamente sin dispatch/delivery ni operación irreversible; timestamps, actores, notas e historia se conservan. Trabajo activo o evidencia histórica insuficiente produce OPERATIONAL_WORK_STARTED.

Cancelled es terminal. All-cancelled o delivered+cancelled nunca deriva delivered; exige resolución explícita. Solo conjunto no vacío de servicios positivamente delivered, con fecha y actor, permite cierre. No se borran items, snapshots, quotes, totales ni precios. Repeat sigue siendo nueva intención del contrato A4a, sin reutilizar identidad del pedido cancelado.

El fence de batches comparte locks de día y bloquea trabajo futuro sobre demanda v2 cancelada, sin cancelar demanda compartida válida. Rollback de auditoría revierte todo el comando.

## Correcciones de compatibilidad justificadas

Lectura live mostró audit_log.entity_id UUID. Los writers anteriores enviaban text; el fixture antiguo ocultaba el problema. La tercera migración reproduce cuerpos existentes con únicamente tres casts UUID corregidos, incluido quote commit, sin cambios de pricing ni ACL. Dos pruebas estáticas comparan esos cuerpos con sus originales.

Los selectores SQL de informes enviaban aliases que no pertenecen al enum. Ahora usan estados persistidos reales, incluyen in_production y excluyen cancelled. Los aliases de presentación siguen intactos; tres tests verifican informes pasados/presentes/futuros.

## Evidencia de validación

- Vitest: 1.956 PASS, 310 archivos.
- PostgreSQL 17.10 local aislado: 17 PASS, incluyendo 81 pares parentales, secuencia operacional real, dish/custom/mixed, replay/conflicto/no-op, revisión, cancel/cancel, edit/cancel, transition/transition, dispatch/cancel, retry/cancel, all-delivered/mixed/all-cancelled, rollback audit, guards y roles efectivos.
- Static UUID compatibility: 2 PASS.
- Governance: 25 PASS.
- Typecheck y build: PASS.
- Lint de todos los archivos fuente/scripts cambiados: PASS.
- git diff --check: PASS.
- Lint global: FAIL por deuda previa (13.243 problemas: 13.199 errores/44 warnings tras excluir outputs generados). No se declara verde.
- Doctor: 55/57; fallan probe externo example.com y comprobación del índice developer en este entorno. No certifica el proveedor.

Pruebas locales usan fixture sintético, migrador distinto del writer, roles efectivos y socket Unix sin conexiones Cloud/Supabase. Activación en fixture no significa activación productiva. No hay certificación UX ni prueba completa de aplicaciones antiguas: guards proporcionan fallo seguro, pero el rollout requiere validación humana.

## Lecturas live y límites

A las 2026-10-07T02:18:56.757229+00:00, tenant EatClean `8bba00ba-331b-42c8-9283-4e3836ffb870`: cero filas/activaciones de orders_custom_capture y custom_activation. Ausencia equivale CLOSED según contrato. Ninguna mutación.

Lectura limitada: Edge Functions vacías; pg_cron/pg_net no instalados; triggers relevantes inspeccionados sin referencias directas de red. Repo sin sender externo lifecycle conectado. Esto NO demuestra ausencia de integraciones externas/transitivas. Billing/payment, comunicaciones y cron/webhooks externos permanecen UNKNOWN: no bloquean esta implementación autorizada, sí bloquean certificación productiva y A4b activation.

## Rollout, rollback y revisión humana

Antes de proveedor: revisar schema/owners/ACL/policies/triggers/locks/RPC reales y compatibilidad; aplicar expand mediante autorización separada, luego aplicación; nunca activar implicitamente. Cambios de provider, merge, Gate7, deploy y activación requieren sus fronteras humanas específicas.

Rollback seguro: cerrar acceso/capability con autorización separada, conservar ledger/audit/evidencia/snapshots y reconciliar por lectura cualquier resultado incierto. No borrar registros ni remover columnas usadas. Una aplicación anterior no puede convertirse en writer v2 por rollback. Histórico sin evidencia suficiente falla cerrado y necesita resolución operativa explícita.

Revisión pendiente: autoridad humana de PR, preflight proveedor, efectos externos UNKNOWN y validación productiva. A4b permanece CLOSED; M3/OP08/Extras no cambiados. No merge, deployment, approval soberano ni mutación de negocio/proveedor realizados.
