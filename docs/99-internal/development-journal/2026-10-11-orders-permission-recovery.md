# P0 pedidos — preparación local separada

Contexto consultado: FOUNDATION/AGENTS, estrategia/filosofía/CTO, servicios staff/draft y migraciones reales de guards/precios. Autorización humana: laboratorio sintético, inspección productiva READ ONLY y preparación separada; sin activar flags, SQL productivo, PR ni deploy.

Se reutilizan las dos correcciones SQL existentes, sin alterar P34 ni crear SQL redundante. Metadatos productivos confirman ausencia de USAGE y falta de autoridad del operador postgres para concederlo. 20 checks nativos PostgreSQL 17.6 PASS, con ownership, trigger y RLS reales, sin P34/A5. Se demostró la falta de atomicidad del flujo staff de dos requests; no se certifica ni reactiva. Detalle accionable: docs/10-validation/p0-orders/ORDER_PERMISSION_RECOVERY.md. E2E autenticado de app NOT_TESTED. Contenedor propio tmpfs sin red eliminado y ausencia verificada.

Checkpoint local solamente; sin push/PR para pedidos. No modificar módulos operativos ajenos.

## Checkpoint atómico staff existente

Decisión de herramienta: Codex exclusivo; continuidad de investigación/laboratorio y menor coordinación. Contexto adicional CAP-008, ADR0017, permisos orders.write, guards legacy/v2/offer y snapshot dietético. El valor operativo es evitar pedidos parciales en cocina cuando falla una línea o confirmación.

Se materializa RPC INVOKER (sin bypass RLS), adaptador Repository y selección del servicio para EatClean + existing, después del freeze intacto. Atomicidad incluye cabecera, líneas, confirmación, total servidor y auditoría. No se modifica la semántica de otros tenants ni se habilita alta nueva/B2C. SQL mínimo y límites en ORDER_PERMISSION_RECOVERY.md y ATOMIC_STAFF_ORDER_SQL_MANIFEST.json.

37 controles PostgreSQL nuevos PASS, 29 pruebas TypeScript afectadas PASS; typecheck/lint/diff-check PASS. Contenedor propio sin red, tmpfs, eliminado y ausencia verificada. E2E GoTrue/PostgREST/navegador NOT_TESTED. No se repitieron los 20 controles antiguos como objetivo, ni P34/E2E general. Sin producción, SQL productivo, cambios de flags, push o PR. Commit local autorizado; el permiso del proveedor y la integración/revisión quedan pendientes.

## Publicación para revisión autorizada

Se prepara rama limpia desde main 27dc2bda con PR #522 preservado. Autorización limitada a push y un PR; sin merge/deploy/SQL/flags. Se revisa acceso directo: la migración activa EXECUTE authenticated inmediatamente, independiente de la congelación frontend. Se documenta como condición productiva explícita, sin crear nuevos mecanismos de governance. Gate7 clasifica cuatro de diez rutas como SPECIAL: REQUIRES_SEPARATE_AUTHORIZATION. Build local PASS; no acredita artefacto productivo ni E2E autenticado.
