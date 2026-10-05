# CR-ORDER A1 — Expand y lectores base compatibles

Base: merge #492 `bb742f2da2bbe4d83c12bd16a889840c36057ea2`, verificado en GitHub y origin/main. Autoridad: Alexander Hernandez, POST-#492 Track A primer PR. Contrato: ADR 0102 / r1, SHA-256 `a6380e08d9c46644316373378c29ad8ac95ca462b99953ca734325ec35c1fe98`. I01–I10 y matriz aprobada intactos.

## DOCUMENT CONTEXT CHECK

Foundation, AGENTS, estrategia/filosofía/CTO, protocolo, ADR 0004/0102, modelo Dish, contrato r1/matriz/plan, schema discovery y código de pedidos/operaciones consultados. Documentación oficial Supabase RLS, changelog y aviso PostgreSQL septiembre 2026 consultados; no nueva API ni cambio de grants a frontend por inferencia. Valor: admitir una expansión sin pérdidas ni habilitar una forma que cocina aún no puede procesar.

## Contrato ejecutable de esta fase

Migración `20261005113919_cr_order_expand_readers_foundation.sql`, creada con CLI Supabase 2.109.1. Solo archivo preparado; no aplicada a proveedor.

- order_items: kind dish por defecto; campos de nombre/descripción/declaración/autor/fecha nullable y declaración HISTORICAL_UNAVAILABLE. CHECK de fase solo permite dish y metadatos nuevos vacíos; ninguna reconstrucción histórica ni snapshot escrito por caller legacy. dish_id continúa NOT NULL.
- orders: revision=0, write_contract_version=1, revisión no negativa y CHECK de fase v1-only. No RPC v2 ni apertura de version=2 hasta PR transaccional posterior.
- order_write_requests: clave tenant/request, hash válido, operación capture/modify, FK compuesta a pedido y revisión confirmada; RLS habilitada, sin policies y sin grants PUBLIC/anon/authenticated/service_role. Foundation cerrada, no idempotencia funcional aún.
- batches: kind dish, referencia futura custom nullable, CHECK dish-only y NOT NULL conservado. Estados/unique dish/policies existentes sin cambio.
- Referencias compuestas tenant/order y tenant/dish validadas. Sustituye FK simple por compuesta con el mismo nombre y acción ON DELETE dentro de la transacción: no duplicar relaciones hacia la misma tabla que vuelvan ambiguos embeds PostgREST. Índices tenant de consultas/referencias. No reparar datos cross-tenant automáticamente.
- BEGIN/COMMIT y timeouts locales: una violación aborta todos los cambios. No IF NOT EXISTS que acepte silenciosamente una expansión distinta; ejecución repetida tras aplicación registrada no es un reintento DDL válido.

No instala controles nuevos de qty/calendario/total financiero v2 sobre históricos: se implementan en el writer/constraints posterior según contrato. No se considera habilitada custom porque existan columnas.

## Lectores y límite downstream

Modelo discriminado OrderItemReadModel: identidad dish:<dish UUID>/custom:<item UUID>, snapshot-first, procedencia snapshot/current_catalogue/unavailable, estado HISTORICAL_UNAVAILABLE/UNKNOWN/DECLARED y receta custom NOT_AVAILABLE. No copia datos actuales a snapshots ni cambia precios. Admite campos expand opcionales para leer SELECT * tanto antes como después de expand. Tipos locales de compatibilidad extienden los tipos existentes, sin fingir regeneración desde producción ni declarar nullable dish_id en los writers legacy.

OrderRepository ofrece proyección de lectura conservando filas y campos originales. Resumen/operaciones leen nombre snapshot antes del JOIN al catálogo; normalizador conserva nombre correcto, identidad/ración, estado y prioridad de composición snapshot. Excluye líneas archivadas de items/delivery dates. Corrige precedencia de nombre en normalización para que el nombre real no sea sustituido por un genérico.

**No es el PR de soporte custom downstream completo.** El modelo puro puede leer fixtures custom; resumen y repositorio operativo tienen frontera requireDishReader que rechaza explícitamente custom. No stringify(null), no dropping silencioso ni agrupación por nombre. E1 niega custom incluso por SQL directo, por lo que esta frontera no corta pedidos válidos actuales. PR downstream posterior sustituye la frontera tras habilitar cocina/lotes/packing/export/reparto/historial/repeat de manera completa. No remover CHECK de fase ni activar custom antes de esos readers y writer validados/desplegados.

## Evidencia local y límites

- PostgreSQL 17.6 en contenedor local efímero, network none, datos sintéticos: migración real sobre schema mínimo pre-expand, invariantes históricas/defaults, FK tenant e identidad de relaciones, CHECKs cerrados, unicidad/hash/idempotency integrity, ACL y RLS deny-by-default. Fixture con staff/owner/otro/anon; policies de tablas antiguas son **fixture sintético**, no certificación de capability orders.write productiva.
- Segundo DB con FK histórica cross-tenant: expansión rechazada 23503; transacción conserva schema y FK simple previos, sin order_write_requests. No reparación oculta.
- Runner `node --test scripts/cr-order-expand.spec.mjs` crea y elimina su propio contenedor, sin URL/keys de proveedor; no admite conexión remota. No aplica historial completo Supabase ni ensaya RPC productiva; esas pruebas corresponden al preflight/integración antes de aplicación autorizada y siguientes PRs.
- Pedidos/operaciones: 166 tests / 33 archivos PASS. Gobierno 25/25 PASS. Typecheck, ESLint de archivos tocados y build Nitro EatClean local PASS; diff-check PASS al cerrar PR. UNKNOWN/custom fixtures no son datos productivos.
- Lectura fresca de metadata del proveedor: dish_id sigue NOT NULL en items/batches; expansión no aparece aplicada. Consulta SELECT, sin DDL/DML. No se atribuye certificación productiva nueva.

## Orden posterior y riesgos

A1 → A2 downstream completo → A3 writer v2 dish-only → A4a writer custom/constraints/RLS con gate cerrado → A4b UI custom cerrada → evidencia y autorización separada de migrations/publicación/activación. Writer dish-only puede prepararse antes de A2, pero abrir custom no. Offer Pricing va por CR/PR separado tras aprobación técnica: B1 schema/readers → B2 financial/capture → C1 propuesta de datos 15 ofertas, aplicación con autoridad propia.

Antes de aplicar E1: comprobar constraints/firma/estado real, integridad tenant, privilegios por defecto y volumen/locks; validar entorno autorizado completo. CHECKs de fase deben sustituirse explícitamente por enforcement writer/seguridad en siguientes migraciones, no omitirse para que pase un test. Antes de capturar custom, reemplazar fronteras dish-only de todos los consumidores. No cambiar invariantes para resolver un fallo: STOP y Alexander.

Rollback A1: conservar expand cerrado con lectura legacy; no requiere bajar schema. Después de custom futuras, cerrar writes y mantener schema/readers/snapshots, nunca restaurar NOT NULL ni borrar datos. FK compuestas se mantienen como defensa de tenant; no volver a FKs simples para sortear datos inconsistentes. Build Once → Deploy Exactly That y CR-GOV-02 sin cambios; no workflows/Cloudflare/DNS/tokens/secrets/environments/rulesets tocados.

CURRENT STATE: PR OPEN / READY FOR HUMAN REVIEW al crear PR.
NEXT STEP: Alexander revisa este primer PR; siguiente implementación requiere conservar gates y revisión separada.
WHO: Alexander (review/merge y permisos productivos); Codex (preparación local autorizada).
REQUIRES AUTHORIZATION: merge, toda aplicación de migración en proveedor, publicación/activación; Offer Pricing diseño todavía pendiente.
EXPECTED NEXT STATE: A1 revisado, sin custom habilitada ni cambios productivos.
