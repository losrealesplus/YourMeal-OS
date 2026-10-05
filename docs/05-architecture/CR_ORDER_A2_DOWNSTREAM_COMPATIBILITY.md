# CR-ORDER A2 — Lectores downstream compatibles

Autoridad: Alexander Hernandez, autorización POST-#493; base `54614a2ef29aba36977acf433a629d013d9b1305`. ADR 0102 y contrato r1 I01–I10 permanecen congelados, sin cambios en sus bytes ni en la matriz aprobada.

## Alcance y frontera

Repositorio operativo, normalización, cocina, reportes, packing, etiquetas, exports, resumen/historial, fechas de entrega y propuestas de repetición preservan identidad tipada y snapshots. Custom conserva `custom:<order_item UUID>`, UNKNOWN, nombre/descripción capturados y receta NOT_AVAILABLE. Dos homónimos no se fusionan. No se consultan catálogo ni ingredientes para custom. El precio leído sigue siendo el snapshot; cero no se transforma en ausencia.

Los lectores transportan futuras filas custom mediante fixtures; la base A1 sigue cerrada: dish_id NOT NULL y CHECK dish/v1-only intactos. Sin migración en este PR, writer v2, captura custom ni UI de captura. Confirmación, modificación y repetición legacy rechazan custom/v2 antes de sus escrituras; botones de lotes custom no invocan transiciones. Las plantillas conservan sus objetos pero no permiten aplicar propuestas custom al escritor legacy. Repetición expone propuesta pendiente de disponibilidad y precio; no reutiliza autorización financiera histórica.

A2 NO certifica el futuro writer. A3/A4 deben implementar transacción, idempotencia, revisión, archive y autorización/RLS del contrato antes de activar custom; el guard de aplicación no sustituye protección frente a carreras o escrituras directas. Las mutaciones legacy dish-only existentes no se reconstruyen en esta fase.

## Declaraciones por origen

La incertidumbre no desaparece al agrupar un Dish. UNKNOWN domina DECLARED y HISTORICAL_UNAVAILABLE se mantiene si no hay UNKNOWN. Listas declaradas agregadas son unión de información conocida, nunca garantía sobre todas las raciones. Packing y etiquetas leen nombre/declaración por item de origen, no la composición agregada de otro item. Restricciones del cliente permanecen separadas.

## Evolución de formatos operativos

El CSV conserva las primeras 14 columnas y su orden; añade IDENTIDAD_ITEM, TIPO_ITEM y ESTADO_ALERGENOS (17 columnas). Integraciones que requieren exactamente 14 columnas deben adaptarse antes de usar el nuevo export. Esta evolución materializa la trazabilidad downstream exigida en A2, sin modificar el blueprint histórico.

Fingerprint schema 2 usa identidad tipada y declaración capturada, con tuplas JSON para evitar colisiones de separadores en nombres/comentarios. Versiones almacenadas schema 1 permanecen legibles y no se reescriben. Sus hashes no son comparables como continuidad binaria: la primera comparación con v2 señalará drift de formato y exige revisar/recrear la referencia operativa bajo su autorización normal; no se declara una mutación de demanda solo por ese cambio. El diff semántico conserva las identidades de ración y no convierte metadatos históricos faltantes en snapshots reconstruidos.

## Evidencia y límites

Pruebas de fixtures futuros recorren repositorio → normalización → cocina/packing → CSV/etiquetas y fechas; cubren homónimos, qty, cero, UNKNOWN y catálogo ausente. Pruebas adicionales cubren resumen/historial, guard de modificación/confirmación, propuesta de repetición/plantillas, lotes bloqueados y declaraciones mixtas. Regresión dish-only y governance se ejecutan localmente.

No se afirma observación UX en producción, RLS futura certificada, validación móvil nativa ni estado de Cloudflare. No merge, migración de proveedor, datos de menú, Gate 7 o deploy. Estado solicitado: PR OPEN / READY FOR HUMAN REVIEW; siguiente actor Alexander, revisión humana. Cualquier aplicación de proveedor o activación requiere autorización separada.
