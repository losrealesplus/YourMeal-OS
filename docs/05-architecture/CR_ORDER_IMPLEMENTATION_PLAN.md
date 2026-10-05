# CR-ORDER r1 — Plan canónico de implementación

Estado: **CONTRACT APPROVED / FROZEN FOR IMPLEMENTATION**. Fecha: 2026-10-05.
Fuente: origin/main `daa1fc4d945255eea0c6c541538c0162666d37d6`, comprobado mediante fetch; checkout limpio antes de crear rama.
Autoridad: Alexander Hernandez. Identidad: [ADR 0102](../adr/0102-native-custom-order-items.md). Contrato y matriz enlazados allí son normativos; este plan no altera I01–I10.

## DOCUMENT CONTEXT CHECK

Foundation, AGENTS, contexto estratégico, filosofía, contexto CTO, ENGINEERING_OPERATING_PROTOCOL, ADR 0004, modelo Dish y contratos de menú/pedido consultados. Código de WeeklyMenuRepository/Service/Mapper, captura staff, OrderService y CommercialPricingResolver inspeccionado; el inventario downstream está en la matriz aprobada. El discovery previo de esquema vivo es evidencia fechada, no garantía de ausencia de drift al aplicar una migración. No se reabre Foundation. Valor inmediato: conservar demanda personalizada y precios reales sin recetas ni seguridad alimentaria ficticias.

## Alcance y estrategia de schema

1. **Expand E1, custom cerrada:** añadir item_kind default dish, snapshots nullable y allergen_state HISTORICAL_UNAVAILABLE; orders.revision default 0 y write_contract_version default 1. Añadir order_write_requests con unicidad tenant/request, referencias compuestas e índices de tenant. Extender batches con item_kind y custom_order_item_id, sin admitir todavía identidades custom ni relajar NOT NULL. Mantener firmas antiguas y filas dish. No backfill de nombres/alérgenos actuales como conocimiento histórico.
2. **Writer compatible E2:** RPC v2 SECURITY INVOKER por defecto, capability canónica, idempotencia, locks/revisión optimista, audit y derivados transaccionales; primero dish-only. Controles de total diferidos para v2. Preparar validaciones de cantidades/calendario/snapshots y guardias contra degradación a v1, cambios de tenant/kind y bypass directo. Los estados financieros históricos no disponibles siguen explícitos; no introducir custom mediante repricing implícito.
3. **Habilitación estructural E3:** solo después de evidencia de readers y writer compatible. Relajar dish_id NOT NULL junto a exclusión dish/custom, referencias compuestas y constraints de snapshots, precio decimal finito, UNKNOWN y semana. Batches mantienen unicidad dish y añaden unicidad parcial custom por tenant/fecha/item; guardias de kind/fecha y hard delete. RLS restrictiva y gate de capacidad deben negar custom mientras la activación esté cerrada, incluso por SQL/RPC alternativo. No crear un nuevo sistema de permisos o feature flags.
4. Preflight read-only contra schema real inmediatamente antes de cualquier aplicación autorizada: columnas/constraints/RPC/policies aplicadas, referencias tenant, fechas/qty/precios históricos y volumen/locks. Violaciones detienen aplicación; no se corrigen silenciosamente. Ensayar instalación, reintentos, concurrencia y recuperación en BD local o entorno de pruebas expresamente autorizado, nunca staging/productivo por inferencia.

Las migraciones se crean en los PRs indicados; este PR documental no contiene SQL ejecutable ni aplica DDL. El orden de aplicación y el de despliegue necesitan identidades verificadas: E1 → readers desplegados compatibles sin custom → E2 dish validado → E3 cerrada → verificación → aprobación humana de activación. Ningún merge equivale a aplicar estos pasos.

## Descomposición exacta en unidades de PR

Los identificadores siguientes son unidades del plan, no números de GitHub ya creados. Cada PR conserva un alcance revisable; no autoriza por sí mismo un deploy.

- **P0 — Contratos/documentación (este PR):** ADR 0102, copias exactas r1/matriz, este plan, Offer Pricing propuesto y diario. Sin schema/código/workflows.
- **P1 — CR-ORDER expand:** migración E1, types generados desde esquema de pruebas y pruebas de preservación dish histórica, defaults, aislamiento/FKs. Sin custom persistible. Entrega inventario de dependencias SQL y prueba de actualización desde schema previo.
- **P2 — Lectores e identidad operativa:** DTO/repositories/normalización, cocina, batches y ejecución, producción/costes, packing/CSV/matriz/etiquetas, reparto, resumen/historial y propuestas de repetición. Adaptación de todos los consumidores de la matriz, no solo drawer. Tests con fixtures custom sintéticos, dos items homónimos, reload y fechas custom-only; no escrituras custom reales. E1 necesaria para habilitar esas lecturas.
- **P3 — Writer v2 dish-only:** migración E2, RPC captura/edición, cliente mínimo/audit/entregas/idempotencia atomicidad, capabilities y guardias legacy. Adaptadores de servicio preservan firmas antiguas; pruebas financieras, transacción fallida, retry concurrente y stale revision. Custom aún denegada en BD. Probar tanto clientes legacy como nuevos.
- **P4 — Writer custom y enforcement cerrado:** migración E3, autorización orders.write en RPC/RLS/SQL directo, snapshot y batch identity, total coherente y archive. Disponibilidad funcional cerrada por gate vigente. Tests roles/tenants reales y falsificación; old writer no degrada ni modifica v2. Requiere P2 y P3 completos, y estrategia exacta de gate comprobada antes de autorizar aplicar E3.
- **P5 — Captura/edición/repetición UI:** líneas discriminadas con UUID local, custom-only sin menú, confirmación explícita de cero, preservación UUID al editar y doble reconfirmación repeat; presentación UNKNOWN/NOT_AVAILABLE. Capacidad cerrada por defecto. Pruebas móvil/escritorio y extremo a extremo en entorno autorizado, sin datos productivos.
- **P6 — Evidencia de aceptación y runbook:** solo documentación de resultados efectivamente obtenidos, matriz I01–I10 → tests, preflight, identidades de migrations/build y rollback compatible; solicitud separada de migración/publicación/activación a Alexander. No ejecución productiva dentro del PR.
- **M0 — Offer Pricing Contract Gate (incluido documentalmente en P0):** diseño propuesto, no capacidad aprobada por congelar CR-ORDER.
- **M1 — Offer Pricing expand:** tras aprobación M0, migración nullable unit_price en slot, CHECK finito >=0 y types/tests; datos existentes NULL. Sin cargar 15 ofertas.
- **M2 — Offer Pricing resolver y lectores:** proyección con slotId/precio/procedencia, menu/admin/capture, servicio/RPC financiero autorizado, compatibilidad consumidor/edición/repeat y contratos comerciales; pruebas de snapshot y rechazo de ambigüedad/manipulación. No nueva mutación publicada.
- **M3 — Remediación de las 15 ofertas:** propuesta de manifest/SQL transaccional y evidencia preflight actualizada, sin ejecutar; solo puede aplicarse tras aprobación adicional y M1/M2 publicados/verificados. Reuse singular/plural aprobado; dishes.price existente permanece intacto.

## Orden y puntos de unión

P0 → P1 → P2 → P3 → P4 → P5 → P6. P2/P3 pueden prepararse de forma independiente tras P1, pero se revisan/publican con el orden verificable anterior. M0 aprobación → M1 → M2 → M3; Offer Pricing no es prerrequisito de custom. Si P3 ya existe, M2 extiende su resolver dish sin cambiar I01–I10; si M2 llega primero, P3 debe reutilizarlo. Evitar dos writers financieros divergentes: una operación canónica por versión y pruebas de compatibilidad antes de integrar. No mezclar E1/E3 con la migración de oferta.

Se recomienda **CR/PR separado para Offer Pricing**: cambia el dominio WeeklyMenuSlot y sus lectores comerciales, no la identidad custom. Solo comparten el resolver de precio dish y el límite transaccional que captura el snapshot. Slot price nunca se aplica a custom. Si esa integración exige cambiar un invariante congelado, STOP y revisión de Alexander.

## Validación obligatoria por PR de código

Governance, typecheck, lint/build y tests relevantes sobre el commit final. P1/P3/P4: integración DB local con dos tenants y roles staff/kitchen/customer/anon; SELECT/INSERT/UPDATE/DELETE, RPC y escrituras directas, no considerar RLS probada por metadata. Inyectar fallos tras cliente/pedido/items/audit y demostrar cero parciales; retry simultáneo una sola entidad; misma requestId/hash distinto rechazado. Confirmar locks y stale revisions versus cocina/cancelación.

P2/P5: demanda, cantidades, fechas, identidad y estado conservados hasta packing/reparto/historial/facturación; metadatos ausentes no producen costes o inocuidad ficticios; repeat no confirma sin disponibilidad y precio, incluidos cero y cambios posteriores. P3/M2: cambio de catálogo/oferta después de captura no modifica snapshots; total decimal vigente EUR sin autoridad de floats. El listado de red team del r1 se ejecuta íntegro antes de activación.

## Riesgos y recuperación

- Cambio nullable prematuro: custom cerrada durante expand/readers; E3 condicionada a readers desplegados y evidencia. No fallback silencioso de null a Dish ficticio.
- Policies permisivas heredadas: restricciones y triggers cubren RPC y writes directos; no service_role en navegador ni permisos user_metadata.
- Concurrencia/idempotencia: locks, revisión, total diferido y audit en un commit; una cadena de HTTP compensada no satisface I07.
- Históricos financieros incompletos: PRICE_UNAVAILABLE ante edición custom; repricing requiere operación explícita aparte. Ningún backfill inventado.
- CommercialPricingResolver calcula paquetes: resolver esa compatibilidad antes de writer que afecte esos pedidos, sin repartir totales arbitrariamente entre líneas; si exige cambiar I01–I10, detener bloque.
- Metadata/receta ausente: UNKNOWN y NOT_AVAILABLE viajan separados de restricciones del cliente.
- Rollback antes de custom: revertir aplicación a writer compatible, conservar expand por defecto; schema reversal solo tras ensayo y autoridad específica. Después de custom: cerrar nuevas escrituras, mantener readers/schema/UUID/snapshots/audit y corregir hacia delante; nunca NOT NULL antiguo ni pérdida de registros.
- Offer Pricing activa: lectores antiguos pueden mostrar/cobrar catalogue price. Antes de primeros valores no NULL, todos los flujos soportados deben estar certificados; rollback conserva resolver y snapshots, cierra nuevos writes si es necesario. No borrar precios de oferta como supuesto rollback seguro.

CURRENT STATE: plan persistido para revisión; implementación no ejecutada en este bloque.
NEXT STEP: revisión de P0 y decisión del Contract Gate M0; luego preparar P1 dentro de autorización CR-ORDER existente.
WHO: Alexander para revisión/merge y M0; Codex para preparación local posterior.
REQUIRES AUTHORIZATION: merge, aceptación técnica M0, migraciones en proveedores, publicación y activación por separado.
EXPECTED NEXT STATE: P0 revisado; CR-ORDER sigue congelado; Offer Pricing aprobado o revisado sin mutación productiva.
