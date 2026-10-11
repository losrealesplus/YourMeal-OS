# P0 pedidos — preparación local separada

Contexto consultado: FOUNDATION/AGENTS, estrategia/filosofía/CTO, servicios staff/draft y migraciones reales de guards/precios. Autorización humana: laboratorio sintético, inspección productiva READ ONLY y preparación separada; sin activar flags, SQL productivo, PR ni deploy.

Se reutilizan las dos correcciones SQL existentes, sin alterar P34 ni crear SQL redundante. Metadatos productivos confirman ausencia de USAGE y falta de autoridad del operador postgres para concederlo. 20 checks nativos PostgreSQL 17.6 PASS, con ownership, trigger y RLS reales, sin P34/A5. Se demostró la falta de atomicidad del flujo staff de dos requests; no se certifica ni reactiva. Detalle accionable: docs/10-validation/p0-orders/ORDER_PERMISSION_RECOVERY.md. E2E autenticado de app NOT_TESTED. Contenedor propio tmpfs sin red eliminado y ausencia verificada.

Checkpoint local solamente; sin push/PR para pedidos. No modificar módulos operativos ajenos.
