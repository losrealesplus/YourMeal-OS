# CR-ORDER — Líneas nativas dish/custom

ADR propuesto, referencia CR-ORDER, revisión 1. Fecha: 5 octubre 2026.

**Estado: PROPOSED / READY FOR HUMAN CONTRACT REVIEW.** Decisiones conceptuales aprobadas por Alexander; especificación técnica siguiente propuesta para aprobación y congelación. No es ADR Accepted ni autoriza implementación. El número canónico ADR se asignará al incorporarlo al repositorio con autorización.

## Contexto documental y problema

Base: source daa1fc4d945255eea0c6c541538c0162666d37d6, esquema vivo YourMeal-EatClean y discovery precedente. FOUNDATION, AGENTS, contexto estratégico/CTO/filosofía, protocolo de ingeniería, ADR 0004, modelo Dish, contratos de menú/pedido y servicios fueron consultados. FOPEBA y gobierno de despliegue se preservan; no hay certificación productiva nueva en esta fase. Ver READ_ONLY_EVIDENCE.json y ../menu-custom-order-discovery/DISCOVERY.md.

Hoy dish_id es NOT NULL en order_items y kitchen_production_batches. No existe snapshot de nombre/composición por línea. Reducirlo a nullable dejaría identidades «null», agrupaciones incorrectas y preparación sin nombre. La política oi_all permite operaciones de staff y del propietario del pedido; RLS existente no distingue custom de dish. El servicio de captura hace varias escrituras con compensación, no una transacción única.

## Decisión de producto ya aprobada

- Order + OrderItem son la única Source of Truth. Dish sigue siendo catálogo; custom no crea Dish, menú, pedido paralelo ni entidad Extra.
- Se permiten pedidos custom-only sin menú publicado.
- Custom contiene nombre/descripcion operativa, fecha, qty entera positiva, precio explícito >=0 y notas opcionales.
- Todas las custom nacen UNKNOWN; declarar alérgenos queda fuera de esta revisión.
- Identidad normal por dish_id; custom por order_item.id. Igual nombre no implica igual preparación.
- Cocina muestra PERSONALIZADO, nombre, raciones, Receta no vinculada y Alérgenos sin declarar. Sin receta, ingredientes, peso, coste ni tiempo inventados.
- Se preservan en edición, historial, packing, etiquetas y reparto. Repetir exige reconfirmación de disponibilidad y precio.

## Invariantes para congelar

I01. Cada item es dish o custom, nunca ambos. dish requiere dish_id del tenant; custom requiere dish_id NULL y nombre snapshot válido.

I02. Identidad tipada: `dish:<UUID>` o `custom:<order_item UUID>`; nunca UUID vacío, cadena null, nombre o número de fila como clave. Dos custom diferentes no se fusionan por texto.

I03. qty entera positiva; fecha real dentro de week_start..week_start+6 (semana comienza lunes), tanto para custom-only como mixtos. Los siete días son seleccionables para custom sin afirmar oferta publicada en ninguno.

I04. Precio custom es decimal finito, no negativo y explícito. Ausente/null/NaN/Infinity se rechazan. Cero implica explicit_zero y confirmación comercial de cero, nunca unknown. Mantener 4 decimales internos del snapshot actual y total EUR redondeado a 2 según política vigente; nada de floats binarios como autoridad financiera.

I05. UNKNOWN no equivale a sin alérgenos. Snapshot de composición y restricciones del cliente permanecen separados. Falta de receta se representa NOT_AVAILABLE, no como receta vacía certificada.

I06. Snapshot nuevo conserva exactamente el conocimiento capturado; cambiar catálogo no modifica nombre, precio o declaración de items ya capturados. No reconstruir snapshots históricos a partir del catálogo actual.

I07. Validación, creación mínima de cliente si procede, pedido, líneas, total, entrega derivada que forme parte de la operación, audit e idempotencia se confirman juntos o no dejan cambios.

I08. Solo personal con orders.write puede crear/editar custom; cocina necesita kitchen.operate para estados. Cliente final no puede habilitar custom mediante POST directo, tipo manipulado o RPC alternate. Lectura propia permanece según permisos vigentes.

I09. No reemplazar UUIDs de custom al editar; conservar trazabilidad de lotes y raciones. Eliminar una línea de negocio es archive, no hard delete. No modificar líneas en preparación/entregadas fuera del contrato actual de edición.

I10. Repeat produce propuesta; cada custom exige disponibilidad confirmada y precio introducido/reconfirmado, incluido cero. Sin esas dos confirmaciones, no puede confirmar el nuevo pedido. Nada de desaparición silenciosa o conversión a Dish.

## Esquema compatible propuesto (no SQL ejecutado)

### order_items

Conservar columnas existentes. Añadir:

- `item_kind text NOT NULL DEFAULT 'dish'`, dominio cerrado dish/custom.
- `name_snapshot text NULL`, `description_snapshot text NULL`.
- `allergen_state text NOT NULL DEFAULT 'HISTORICAL_UNAVAILABLE'`: HISTORICAL_UNAVAILABLE / UNKNOWN / DECLARED.
- `allergens_snapshot text[] NULL`: NULL histórico; [] en custom UNKNOWN; lista explícita copiada en nuevos dish declarados.
- `snapshot_captured_at timestamptz NULL`, `snapshot_author_id uuid NULL` (auth.users, ON DELETE SET NULL, no borrar snapshot al desactivar autor).

Mantener comment para notas operativas, unit_price/price_snapshot_status para precio. `dish_id` pasa a nullable únicamente cuando se habilite writer compatible. No añadir recipe_id ficticio; el modelo de aplicación deriva recipe/composition NOT_AVAILABLE para custom. Moneda se mantiene como EUR en esta capacidad, siguiendo el flujo actual; no introducir multimoneda en este CR.

Constraints:

- dish → dish_id IS NOT NULL; custom → dish_id IS NULL, name_snapshot IS NOT NULL y btrim(name_snapshot) no vacío, snapshot_captured_at IS NOT NULL, allergen_state=UNKNOWN, allergens_snapshot=[]; custom no admite histórico sin snapshot.
- Qty >0. Nombre normalizado Unicode, máximo propuesto 200 caracteres; descripción máximo 2000, comentario máximo 2000; esos límites son parte de esta propuesta técnica, sujetos a la firma del contrato.
- custom unit_price NOT NULL; status captured para >0, explicit_zero para 0; excluir numeric NaN/Infinity explícitamente. Mantener los estados financieros históricos de dish sin reinterpretarlos.
- HISTORICAL_UNAVAILABLE → snapshots de declaración NULL; UNKNOWN → []; DECLARED → al menos un valor declarado; no existe estado «certificado sin alérgenos» en este CR.
- Snapshot de nuevos dish copia nombre/descripción y declaración del catálogo al capturar; si allergens=[] usa UNKNOWN. Nombre de históricos puede seguir NULL con fallback marcado como metadata actual, nunca presentado como snapshot histórico.
- FK compuesta (tenant_id, order_id) → orders(tenant_id,id), y (tenant_id,dish_id) → dishes(tenant_id,id), respaldadas por índices únicos compuestos. NULL custom solo evita la segunda FK, no el aislamiento de pedido.
- Fecha coherente con semana y tenant del pedido mediante validación transaccional/trigger (no CHECK que intente consultar otra tabla).

### orders y operaciones idempotentes

Añadir revision NOT NULL DEFAULT 0 para concurrencia optimista. Añadir write_contract_version NOT NULL DEFAULT 1: nuevos pedidos de writer v2, y pedidos con custom, usan 2. Históricos se mantienen 1 hasta edición explícita validada.

Registro transaccional `order_write_requests`: tenant_id, request_id UUID, operation capture/modify, input_hash, order_id, committed_revision y created_at. UNIQUE(tenant_id,request_id), FK compuesta al pedido. Una petición repetida con mismo hash devuelve identidad/revisión ya confirmada; misma clave con hash distinto se rechaza. El registro no contiene notas ni perfiles dietéticos en claro duplicados. No expone escrituras a clientes fuera de la operación autorizada.

Para v2, un control de consistencia diferido al commit verifica total contra suma de snapshots no eliminados, misma moneda/semana y presencia de al menos una línea. Si una edición intenta introducir custom en un pedido con precios históricos no disponibles, rechazar PRICE_UNAVAILABLE hasta una operación explícita de repricing aprobada; no inventar reparto del total pasado. Audit de escritura de v2 queda en la misma transacción. Un write directo no puede eludir integridad de filas/totales/audit.

### kitchen_production_batches

Extender la tabla existente, manteniendo todos los registros históricos:

- item_kind DEFAULT dish; dish_id nullable condicionado; `custom_order_item_id UUID NULL`.
- Exclusión: dish → dish_id presente/custom_order_item_id NULL; custom → dish_id NULL/custom_order_item_id presente.
- FK compuesta de tenant a Dish o custom order_item. Custom referenciada debe ser realmente custom y su day_date coincidir con delivery_date, comprobado transaccionalmente.
- Conservar UNIQUE(tenant_id,delivery_date,dish_id) para dish; añadir unicidad parcial (tenant_id,delivery_date,custom_order_item_id) para custom.
- Misma máquina de estados y audit de cocina. No nueva tabla paralela de pedidos ni lote identificado por nombre.
- Identidades y fechas con ejecución iniciada no se reasignan silenciosamente. Archive de línea conserva lote para trazabilidad, pero lo excluye de demanda vigente según política de cancelación. Referencias custom bloquean hard delete físico; purge/reconciliación quedan fuera de esta capacidad.

## DTO discriminado y reglas de aplicación

Contrato de lectura y escritura distingue:

`DishLineInput = { kind: 'dish', lineId?, dishId, dayDate, qty, unitPriceOverride?, comment? }`.

`CustomLineInput = { kind: 'custom', lineId?, name, description?, dayDate, qty, unitPrice, explicitZeroConfirmed?, comment?, repeatConfirmation? }`.

Capture envelope: requestId, customer (existing/new), weekStart, lines no vacías, orderNotes, contexto B2C/B2B vigente y autoConfirm. Modify añade orderId + expectedRevision. Snapshot_author_id, captured_at, tenantId efectivo, totales y IDs persistidos se resuelven en servidor; no se confía en valores del cliente.

Para custom, unitPrice es decimal explícito (preferir transporte como string decimal validado), name obligatorio y description complemento opcional: el nombre solo satisface la descripción operativa mínima aprobada. Rechazar payloads dish con campos custom/conflicting kind, custom con dishId y estados de alérgenos enviados por cliente. lineId de edición debe pertenecer al pedido y tenant; no permite convertir el kind de una línea existente.

El servidor valida el calendario, referencias, capability y snapshots antes de persistir. El drawer muestra cantidades y total como preview; no es fuente financiera. Los errores son tipados y sin incluir credenciales ni datos dietéticos en logs.

UI: publicados siguen usando oferta normal. Sección Añadir plato personalizado disponible aun con menú vacío/no publicado; no desbloquea selección de Dish no ofertado por accidente. Custom-only requiere cliente, fecha, qty y precio, no menú. Cada tarjeta tiene UUID local estable; no se usa nombre como key. No guarda al pulsar Añadir/Eliminar; Guardar es el límite de persistencia. Estética/fechas/UNKNOWN conservan patrones del drawer actual.

## Atomicidad y autorización en BD

Implementar una operación canónica de captura/edición v2 mediante RPC transaccional SECURITY INVOKER por defecto. Una invocación PostgreSQL constituye la transacción de todas las escrituras; nunca varias peticiones HTTP con compensaciones. No usar SECURITY DEFINER como solución automática a RLS ni insertar con service_role desde el navegador.

La función verifica auth.uid, membership y capability efectiva del tenant usando la matriz canónica de permisos; la definición SQL de capability debe coincidir con PermissionService y tener tests contra deriva. No leer permisos de user_metadata. Para custom, el control se realiza en servidor y RLS, además de UI.

Secuencia: autenticar → resolver/bloquear idempotency key → validar y bloquear pedido/cliente/Dish necesarios → comprobar expectedRevision para edición → construir snapshots/precios → cliente nuevo + datos mínimos obligatorios → order + items → audit/derivados requeridos → consistencia diferida → commit. Error de validación, audit o persistencia revierte todo, incluido cliente nuevo. Reintento concurrente de la misma petición produce una única creación. La actualización de revisión serializa edición versus cocina/cancelación; no se acepta edición sobre versión desactualizada.

RLS: conservar el acceso válido a dish y lectura propia; añadir políticas **RESTRICTIVE** para que las permisivas existentes no habiliten custom por OR. En INSERT/UPDATE de custom se exige capability orders.write y coherencia con pedido/tenant. En DELETE se niega hard delete de custom; el flujo usa archive. UPDATE exige USING y WITH CHECK, y triggers impiden mover tenant/order, cambiar kind o falsificar snapshots. SELECT de custom usa las mismas reglas de propiedad/tenant del pedido. No conceder kitchen write a quien solo lee orders.

Evaluar todas las rutas directas y RPC antiguas: program_draft_order no acepta custom por cast nullable; legacy callers siguen dish-only y no editan pedidos v2 sin soporte. Revocar posibilidad de degradar write_contract_version. Los helpers privilegiados existentes no se amplían por este CR. RLS habilitada en tablas nuevas, roles públicos sin permisos nuevos, EXECUTE solo authenticated en RPC y capability comprobada. No introducir vistas que eviten RLS.

## Downstream y matriz de impacto

La matriz detallada está en CR_ORDER_IMPACT_MATRIX.json. Criterios obligatorios:

- Repositorio operativo devuelve kind, UUID item, snapshot, declaración y precio. No String(null). Resuelve nombre snapshot antes del catálogo y señala fallback histórico.
- Normalización por ración conserva orderItemId/portionIndex; transmite UNKNOWN y receta ausente. Clave de producción/packing discriminada. Corregir precedencia de expresión de dishName en el alcance necesario para dar nombres exactos.
- Cocina consolida dish como antes; custom consolida únicamente las raciones de su propio item, etiquetado PERSONALIZADO. Distintos items de igual texto no se unen.
- Lotes usan la clave tipada persistida; estados y cantidades sobreviven a recarga. Cambios de qty/fecha tras inicio requieren contrato operativo de edición vigente, nunca reinterpretación automática.
- Producción no introduce custom en consultas de receta por dish_id. Ingredientes/peso/tiempo/coste se mantienen unavailable y visibles; subtotales financieros usan precio snapshot conocido.
- Packing/CSV/matriz/etiquetas transmiten nombre, qty, kind, UNKNOWN y advertencias dietéticas del cliente separadas. No imprimir «sin alérgenos» ni exportar coste 0 conocido por ausencia de receta.
- Reparto usa día de custom para demanda/servicio y el mismo pedido/cliente; no perder un día custom-only al derivar entregas.
- Resumen/historial muestra snapshots sin depender de JOIN a Dish. Edición conserva IDs, datos, precio y trazabilidad; archiva eliminadas.
- Facturación mantiene orders.total confirmado por snapshots; no crear invoice_lines ni contabilidad paralela.
- Repetición/plantillas produce custom como propuesta visible con sourceOrderItemId, disponibilidad pendiente y precio pendiente. Confirmación reintroduce precio explícito y fecha actual. Nuevos order_item UUID; ningún lote histórico se hereda. Backend rechaza la confirmación si falta una reconfirmación. Cambios de texto/precio/fecha posteriores invalidan la reconfirmación previa.

## Migración / backfill / despliegue compatible

1. Inventario read-only de esquema/RPC/dependencias/constraints y estado aplicado; consultas previas de integridad cross-tenant, qty, fechas y precios. Violaciones existentes se documentan y resuelven con autorización propia; no se ocultan mediante backfill. No se presenta RLS como probada solo por estas consultas de metadata.
2. Fase expand: columnas aditivas con defaults dish/historical y revision 0, índices/FKs compatibles y tablas/operaciones nuevas inicialmente sin acceso funcional a custom. Toda fila histórica sigue dish. No copiar alérgenos/nombres actuales a un supuesto snapshot pasado. Índices grandes requieren estrategia de locks evaluada en entorno autorizado; no inventar ventana de mantenimiento.
3. Readers compatibles en todos los consumidores, y writer transaccional dish validado. RPC antigua conserva firma/respuesta. La capacidad custom sigue apagada; no hace falta que el frontend antiguo pueda leer custom porque aún no se permite crearlas.
4. Tras pruebas, habilitar writer/RLS/constraints custom y batch identity condicionado. Relajar NOT NULL solo junto a CHECK que mantiene dish obligatorio y readers desplegados. La migración se prueba en entorno expresamente autorizado; no se ejecuta en producción en este Contract Gate.
5. Activación custom mediante mecanismo de capability/feature gating vigente, con aprobación humana. UI, backend y BD coinciden en el gate; esconder botón solo no basta. No cambiar environments/rulesets ni privilegios Cloudflare como parte de esto.
6. Gate 7: Build Once → Deploy Exactly That permanece intacto. Migración/activación productiva son autorizaciones separadas; un PR de producto no concede permiso de migración ni publicación.

Rollback: antes de custom persistidas puede revertirse según validación de expand. Después de custom existentes, apagar nuevas capturas si es necesario pero mantener lectores y schema compatibles; no volver a NOT NULL, borrar snapshots o desplegar un reader antiguo. Corrección hacia delante / reversión compensatoria bajo autoridad humana. Exportación y audit preservan registros ya capturados.

## Red team / aceptación para futuras pruebas

El contrato no se certifica por intención. Antes de habilitar requiere evidencia de:

1. Custom-only sin menú, mixto y varias custom de mismo texto en distintos pedidos/fechas; igualdad de cantidades/precios/snapshots en cocina, lotes, packing, etiquetas, historial y reparto.
2. Ausente/NaN/Infinity/precio negativo; cero no confirmado; qty cero/fraccionaria; calendario inválido/fuera de semana; nombre vacío/oversized y payloads de tipo contradictorio: rechazo antes de cualquier commit.
3. Falla tras crear cliente, tras order, tras items y en audit: cero entidades parciales; captura reintentada y concurrente con requestId duplicado da un pedido; hash distinto con misma clave se rechaza.
4. Edición concurrente versus edición/cocina, stale revision, UUID ajeno, cambio de kind/tenant/order, archive/reparto/lote dependiente y histórico sin precio: ningún daño silencioso.
5. Dos tenants y roles reales (staff autorizado, kitchen, cliente propietario, cliente ajeno, anon): probar SELECT/INSERT/UPDATE/DELETE/RPC y SQL directo. Las FKs compuestas y restricciones custom deniegan contaminación cruzada y clientes no autorizados.
6. Cambiar precio/nombre/alérgenos del catálogo después de captura no altera snapshots. Históricos permanecen marcados historical_unavailable; nunca se rellenan por invención.
7. UNKNOWN distinto de declaración positiva; no inferencia de alérgenos por texto; metadatos/receta ausentes no producen coste/ingredientes/tiempo ni inocuidad ficticios.
8. Repetir conserva cada custom propuesta; necesita reconfirmación; nuevos IDs, fechas y precios; backend fail-closed ante omisiones o payload manipulado.
9. Readers antiguos con datos dish previos y todas las rutas migradas; formato financiero, totales, facturación y estados regresan correctamente. No depender de tests que solo reflejan el código nuevo.

Tests unitarios de discriminador/precios/normalización; integración de RPC/RLS/constraints/rollback/idempotencia; pruebas de flujos downstream y UX móvil/escritorio; governance, typecheck, lint/build y diff checks en PR futuro. No se ejecutaron migraciones ni tests mutadores para redactar este contrato.

## Alternativas y consecuencias

Dish ficticio / creación automática: rechazada por autoridad; contamina catálogo y oculta que receta/composición no existen. Tabla paralela de pedidos: rechazada por doble fuente de verdad. Nullable-only / UI-only: rechazada por romper identidades y downstream.

La decisión aumenta el contrato de OrderItem y lote; requiere ADR, migraciones compatibles, RLS/atomicidad y cambios coordinados. Las custom recurrentes podrán promoverse a Dish en un CR posterior mediante acción explícita; declaración manual de alérgenos y consolidación por preparación compartida están fuera del alcance.

## Firma y condición de congelación

Firmante: Alexander Hernandez. Revisión a aprobar: CR-ORDER r1 con CR_ORDER_IMPACT_MATRIX.json. No firma inferida desde la aprobación conceptual. Tras aprobación explícita se fija digest del documento aprobado y se incorpora con número ADR canónico, alcance de implementación y pruebas. Cambios de invariantes requieren nueva revisión humana.

CURRENT STATE: READY FOR HUMAN CONTRACT REVIEW.
NEXT STEP: Alexander revisa límites técnicos, schema/atomicidad/RLS/identidad de lotes y estrategia compatible.
REQUIRES AUTHORIZATION: aprobación explícita del contrato antes de código; migración, activación y despliegue tienen límites de autorización independientes.
EXPECTED NEXT STATE: CONTRACT APPROVED / FROZEN FOR IMPLEMENTATION. No IMPLEMENT ni MIGRATE ni DEPLOY en esta fase.
