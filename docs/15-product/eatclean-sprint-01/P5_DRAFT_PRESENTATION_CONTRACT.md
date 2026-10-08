# P5.1 — Contrato de presentación y preview aislada

Fecha: 2026-10-08. Baseline main `83845bf47987a3f47c21ede95bbd7be7dc54508b`. Autoridad: Alexander, sprint adjunto. Scope autorizado: contrato + preview aislada, sin publicación ni migración.

# DOCUMENT CONTEXT CHECK

FOUNDATION/AGENTS/estrategia/filosofía/CTO: CONSULTED. Dish/CAP-003/ADR0103/Offer Pricing r2: CONSULTED. FOPEBA: N/A (configuración de presentación). Provider: N/A (offline). Scope humano P5.1: CONSULTED.

## Freeze de este slice

La configuración habitual de EatClean define cuatro IDs estables main-1..main-4 y etiquetas Platillo 1 Carnes, 2 Pescados, 3 Vegetariano, 4 Ensaladas. Extras: soups/yogurt/juice. El catálogo mantiene Dish; slotId conserva identidad de oferta; labels nunca son identificadores de pedido. Config está en Instance Layer y solo se pasa explícitamente al laboratorio; no se importa desde instance.config, runtime ni rutas.

La proyección genérica recibe WeeklyMenuDayView ya tenant-scoped, config exact tenant y overlay efímero por slotId. Reutiliza offerPrices/effectivePrice, no calcula otra cotización ni altera precios. Otros tenants sin config mantienen orden legacy. Principal se ordena por ID configurado y no por índice visible; Extras por categoría/orden/slotId. Un draft incompleto muestra missing/duplicate/unassigned/unknown explícitos. No es validador productivo de publicación. No oculta ofertas mal asignadas: las muestra sin asignación. Referencias de tenant/menu/day inválidas y slot identity ambiguo rechazan.

## Evidencia del Excel y límites

Archivo humano Menú x semanas ECT.xlsx: Hoja 1, 280 entradas, ocho semanas relativas con 35 entradas cada una. La fixture transcribe C2:C8; verifica labels y estructura contra esas celdas. LAB IDs, fecha y precios ilustrativos son sintéticos: NO Dish UUIDs, precios ni publicación live. No infiere que semana 1 corresponda a 2026-10-05. El sexto extra a veces es tortitas u otro postre, no siempre Yogurt: la futura edición de categorías debe ser configurable y no clasificar por fila sin revisión. No se importan sus enlaces ni fotografías.

## Preview y selección

Componente lab read-only, sin ruta, fetch, form, CTA de publicación ni writer. Mantiene offer.slotId/dishId para futura UOC. Aceptación UOC actual: mapper/pricing íntegros; integración productiva de labels pendiente del siguiente slice. El precio mostrado viene del DTO ya resuelto y recibe formatter; no introduce toLocaleString ni autoridad financiera.

## Persistencia — STOP exacto

Overlay in-memory no constituye persistencia. Para conectar admin/publicación/cliente/UOC se requiere acordar almacenamiento tenant/menu/day/slotId, versionado, unicidad de posición, relación tenant y compatibilidad al duplicar. Candidato mínimo: metadata aditiva del slot o tabla de configuración ligada al slot con claves compuestas y default legacy. Hace falta preflight/contrato de migración para elegirlo. No se implementa SQL especulativo ni sidecar durable como segundo menú. Este PR termina en preview; próxima fase requiere aprobación de ese diseño.

Sin cambios a octubre 5, M3/OP08, flags, A4b, SQL, workflows ni governance. No concede merge/deploy.

## Validación local

13 pruebas de proyección/markup + 13 mapper + 27 pricing: 53/53 PASS. Typecheck PASS. Lint de nuevos archivos: cero errores/warnings. Build PASS. Browser aislado comprueba tres Extras, legacy, incomplete y viewport 390 px sin overflow; nueve checks totales incluyendo P2, con red externa interceptada y cero pageerrors. Governance sin cambios: 25/25 PASS en mismo baseline. git diff --check PASS.

No se afirma cualificación de datos/UUID live, publish, selección UOC end-to-end ni migración. Preview es laboratorio estructural y solo lectura.
