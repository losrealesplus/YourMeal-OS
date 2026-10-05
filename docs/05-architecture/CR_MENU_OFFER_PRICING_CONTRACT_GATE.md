# CR-MENU — Offer Pricing Contract Gate r1

Fecha: 2026-10-05. **PROPOSED / READY FOR HUMAN CONTRACT REVIEW**.
Decisión semántica aprobada por Alexander: Dish.price es catálogo; WeeklyMenuSlot puede tener precio de oferta; OrderItem.unit_price es snapshot financiero. El diseño técnico siguiente necesita aprobación propia antes de implementarse. CR-ORDER r1 ya aprobado no autoriza estas nuevas reglas técnicas ni mutación del menú.
Base inspeccionada: `daa1fc4d945255eea0c6c541538c0162666d37d6`.

## Evidencia y problema

[Discovery read-only](./CR_MENU_ORDER_READ_ONLY_EVIDENCE.json) y [manifest original de las 15 ofertas](./CR_MENU_DISCOVERY_MANIFEST.json), preservados sin editar. Son evidencia histórica fechada, no consulta viva de este PR. Digest del manifest: `cb3b191ecd78b1553e01baa67e9c4e626ca9759eadc8916bd148301f62cc90bb`; evidencia: `db525acae0e101d708b923ff8d2f90e2bb7e86915164c8ed79477a53c8f07e13`.

La semana 2026-10-05 del tenant EatClean tiene 20 slots existentes (4 por lunes–viernes) y no tiene unit_price por slot. Crema de calabaza y puerro tiene catálogo 11.90 y yogurt de cacahuete y avena catálogo 0; su oferta aprobada debe ser 2.50 sin alterar esos valores globales. No se crea Dish duplicado para representar precio.

WeeklyMenuRepository lee `*, dishes(*)`; WeeklyMenuMapper proyecta CatalogDish y pierde slotId. StaffOrderCaptureService obtiene precio de catálogo/override, sin resolver slot; OrderService verifica oferta por día pero la rama à-la-carte calcula catálogo, mientras CommercialPricingResolver tiene precios de paquetes. WeeklyMenuService duplica semanas sin precio de slot y permite removeSlot en draft; no conviene introducir una FK financiera que cambie ese ciclo de vida sin necesidad.

## Invariantes de Offer Pricing propuestos

OP01. Cada slot tiene `unit_price numeric(12,4) NULL` inicialmente; NULL significa fallback, cero es oferta explícita gratuita. Valores no negativos, finitos y con precisión máxima cuatro decimales; rechazar exceso de precisión/rango en servicio/RPC antes de cast, no redondear silenciosamente. Validar base catalogue también: ausente/inválido no significa cero.

OP02. `effective_offer_price = slot.unit_price ?? dishes.price`, evaluado en servidor con decimal exacto. `0 || catalogue` es incorrecto. Snapshot EUR y total usan la política vigente de cuatro decimales/total dos decimales. No duplicar Dish ni mutar dishes.price para corregir una oferta.

OP03. Cada proyección ofrecida transporta slotId, menuId, dishId, dayDate, unitPrice efectivo, base/offer nullable y priceSource slot/catalogue. Mantener lectura de slots históricos NULL y calendario relativo existente. La identidad operativa de dish sigue siendo dishId; la identidad de selección de oferta es slotId. Dos slots del mismo Dish/día no pueden colapsarse por un Map keyed solo por dishId. Custom no tiene slot y conserva identidad order_item.id.

OP04. La captura dish envía referencia slotId, no autoridad de precio. El servidor comprueba tenant efectivo, menú publicado y semana, fecha y Dish activo, y resuelve precio bajo locks coherentes hasta commit. Si cambia el precio mostrado antes del commit, devolver PRICE_CHANGED para reconfirmar (token/hash de cotización sin confiar en precio cliente). Slot/dish/menu ajenos, inexistentes, eliminados o fuera de fecha se rechazan antes de escribir. Idempotency retry ya confirmado devuelve snapshot original, no nueva cotización.

OP05. Compatibilidad DTO anterior sin slotId: solo resolver automáticamente si hay exactamente un slot elegible para tenant/semana/día/dish. Cero candidatos o varios => error tipado; nunca escoger primero/latest ni volver al catálogo para eludir oferta. Con todos los slots NULL y un candidato, el resultado financiero continúa siendo el catálogo. El uso staff de catálogo fuera de menú, si existe como flujo real requerido, debe documentarse/aprobarse como modo distinto; no se introduce bypass en este CR. Custom-only sigue sin menú.

OP06. Captura de nuevo item copia precio efectivo al snapshot con price_snapshot_status captured o explicit_zero. Nunca recalcular líneas ya capturadas desde oferta o catálogo. Edición de qty/fecha y repetición usan el contrato de snapshots: conservar precio en edición que no sea repricing; línea nueva o repeat recotiza y necesita confirmaciones correspondientes. Precio de cliente manipulado nunca se persiste. Overrides staff solo bajo capability vigente, explícitos y auditados; no se amplían permisos por implementar oferta.

OP07. No añadir columna ni FK de oferta a OrderItem en la variante mínima: registrar slotId, menuId, priceSource y precio resuelto en el audit de la misma transacción de captura/repricing, sin duplicar perfiles/notas sensibles. El snapshot financiero sobrevive a borrar/archivar slot. Cocina agrupa por Dish como antes y no reconstruye precio desde ese audit. Si se necesita vínculo navegable histórico en otra capacidad, requiere contrato separado.

OP08. Tenant/RLS y gates menu.write/publish vigentes se conservan. Update de oferta pasa por servicio y audit con old/new price. Ninguna UI o write directo puede modificar oferta de tenant ajeno ni inventar snapshot. Enforcement RPC/RLS y bloqueo de modificaciones tras confirmación deben probarse con roles reales; no basta con ocultar controles. No edición published por vías ordinarias ni unpublish para remediar esta semana.

OP09. Menu/admin/capture muestran precio efectivo y procedencia cuando ayuda al operador; cambiar oferta no cambia catálogo. Duplicar una semana copia explícitamente la oferta a un nuevo draft con nuevos slotIds y audit (propuesta técnica por aprobar), no publica automáticamente. Templates relativos conservan NULL/default hasta decisión explícita al programar; cambios de fecha/Dish de slot invalidan cotizaciones pendientes.

OP10. El contract mínimo aplica a pricing por línea/à-la-carte. No redefine paquetes, descuentos, impuestos, extras comerciales ni distribución contable entre líneas. Antes de habilitar ofertas con precio explícito, inventariar consumidores/commercial offer del tenant: si un flujo combina slot override con package pricing sin contrato compatible, **rechazar esa combinación y devolver a autoridad humana**, no sumar ambos ni inventar asignación. El guard actual de pedidos a cero necesita extensión deliberada: oferta cero válida + confirmación explícita puede producir explicit_zero; ausencia de precio continúa PRICE_UNAVAILABLE. Cambiar este guard es parte del PR M2, probado y revisado, no efecto implícito de la columna.

## Schema y diseño de migración

M1 aditiva: añadir solo weekly_menu_slots.unit_price nullable numeric(12,4), sin DEFAULT 0 ni backfill. CHECK `unit_price IS NULL OR (unit_price >= 0 AND unit_price NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric))`; confirmar dialecto soportado en BD de pruebas antes de generar SQL definitivo. No migración aplicada en este gate. No nuevo índice innecesario ni cambio de dish_id/category, orders u order_items. Tipos/repository aceptan nullable y exactitud decimal en límites financieros.

Preflight antes de cualquier aplicación autorizada: columna ausente/presente y definición, constraints y RLS vigentes, FK tenant de menu/Dish, duplicates de selección por día/Dish, volumen/locks y referencias de readers/RPC. No resolver duplicados ni políticas automáticamente. Ensayo con datos legacy NULL, cero, positivo y valores no finitos/negativos/exceso de precisión; migración sin cambios en precio/snapshot histórico.

M2 actualiza readers y writer antes de primeros slots no NULL. RPC v2 CR-ORDER si ya existe; sino una operación canónica compatible, sin HTTP compensatorio. BD no debe aceptar modificación silenciosa de snapshot de líneas confirmadas. Cotización y revalidación comparten tenant/referencias y hash; misma transacción captura/audit/idempotencia. Las pruebas deberán demostrar que catálogo/slot no cambian entre resolución y captura sin detección.

No añadir SQL de los 15 slots a M1. M3 solo prepara una remediación transaccional con manifest e identidad actuales, autorización específica posterior y preflight exacto de slots ya publicados. Precio 2.50 en cada nueva oferta; catálogo existente intacto; no recrear conexiones ni publicar de nuevo automáticamente.

## Impacto por frontera

- **Schema/types:** weekly_menu_slots y tipos generados; numeric transport validado, NULL preservado.
- **WeeklyMenuRepository/Service:** insert/update/list/duplicate con precio nullable; write tenant/capability/audit; política published conservada. getSlot con referencias para resolver captura.
- **WeeklyMenuMapper/queries/use-weekly-menu:** DTO de oferta que no pierde slotId/procedencia, legacy NULL y dates preservadas.
- **Admin menus/planning/publish preview:** editar precio de oferta draft, distinguir fallback vs cero; no convertir edición de oferta en edición de catálogo.
- **Consumer menu/DayPicker + Universal Order Intake Drawer:** selección por slotId y precio efectivo, total preview, reconfirmación de cambio, no autoridad cliente; custom independiente.
- **Staff capture/OrderService/program_draft_order/RPC:** resolución financiera canónica, negativos de tenant/ambigüedad/quote, restricciones comerciales/cero explícitas; inventario de todos los callers antes de activar.
- **Modification/repeat/templates:** snapshots confirmados conservados; nuevas compras recotizadas; repeat custom sigue I10. Templates no llevan precio histórico como autoridad nueva.
- **Accounting/history/kitchen/packing/delivery:** continúan leyendo snapshots/identidad existente; prueba de ausencia de dependencia a precio actual y no cambios de cantidades/operación por OP.

No modificar CR_ORDER_IMPACT_MATRIX.json aprobado para incluir este dominio. [Descomposición P0–P6/M0–M3](./CR_ORDER_IMPLEMENTATION_PLAN.md): CR/PR separado evita acoplar migraciones; punto de unión exclusivo en resolver financiero dish y captura transaccional. Ningún cambio a I01–I10.

## Aceptación mínima antes de habilitar

1. Catalogue 11.90 + oferta 2.50 → menú/capture/item 2.50 y catalogue 11.90 intacto; slot NULL → catalogue; slot 0 → cero explícito, sin fallback. Base ausente, NaN/Infinity, negativo o precisión inválida => rechazo.
2. Quote muestra 2.50, precio cambia a 3.00 antes de captura => PRICE_CHANGED, cero pedido parcial; confirmar nueva quote crea snapshot 3.00. Cambiar catálogo/slot después no altera pedido previo. Retry confirmado no recotiza.
3. Slot ajeno, dish ajeno, fecha/semana errónea, menú no publicado, UUID alterado, cliente manda precio falso, viejo DTO ambiguo => rechazo transaccional sin writes.
4. Dos tenants y roles staff/cliente/kitchen/anon: SELECT/INSERT/UPDATE/DELETE y RPC bajo RLS real. Override staff auditado sin ampliar capability; cliente final no puede fabricar override.
5. Legacy NULL y firma antigua siguen funcionando con candidato único; package pricing vigente no se altera. Combinación no soportada con precio de slot falla explícitamente; cero ausente no queda interpretado como gratuito. El inventario comercial bloquea habilitación si falta compatibilidad.
6. Menú duplicado draft conserva oferta y nuevas identidades; eliminación de slot no elimina snapshot/audit capturado. Edición no financiera conserva unit_price; repeat/nuevas líneas recotizan conforme al contrato.
7. UI/admin/consumer/mobile presentan precios/total correctos; snapshot → accounting/history conserva exactitud; cocina/packing/reparto preservan cantidades/identidad. Gobierno/typecheck/lint/build/diff-check pasan en PRs de código.

## Mapping y siguiente operación autorizable

Alexander aprobó explícitamente REUSE de «Crema de verdura mixta» como «Crema de verduras mixtas», Dish `86b6bfa5-f49a-454e-9359-859caa9c8e67`. La nota previa de review del manifest queda resuelta por esta aprobación; su copia histórica no se reescribe.

15 slots adicionales de la oferta 2026-10-05 siguen aprobados semánticamente a 2.50 EUR; 14 REUSE y 1 CREATE (Sopa de judías negras). El manifest no es permiso para ejecutar ahora ni sustitución de sopa por otra legumbre. Alérgenos no se infieren por nombre. No se ha modificado menú publicado, catálogo, precios ni producción en este bloque.

## Riesgos y rollback

Principal riesgo: código antiguo ignora unit_price y cobra catálogo. Antes de valores no NULL, expand puede permanecer y revertirse aplicación compatible; no necesita quitar columna. Tras ofertas explícitas, conservar resolver/lectores/snapshots y cerrar capturas afectadas si hay incidente; rollback a lectores viejos o poner NULL masivamente cambiaría autoridad financiera y necesita autorización propia. Audit es evidencia de procedencia, no segunda fuente contable. No hay vínculo FK nuevo que rompa removeSlot legacy.

CURRENT STATE: READY FOR HUMAN CONTRACT REVIEW (Offer Pricing); CR-ORDER r1 continúa APPROVED / FROZEN.
NEXT STEP: Alexander aprueba/revisa OP01–OP10, política de duplicate, quote/cero/compatibilidad comercial y plan M1/M2; después Codex prepara esos PRs.
REQUIRES AUTHORIZATION: diseño técnico Offer Pricing y, por separado, merge, migración, publicación y remediación de datos.
EXPECTED NEXT STATE: Offer Pricing CONTRACT APPROVED / FROZEN; sin nuevos datos productivos.
