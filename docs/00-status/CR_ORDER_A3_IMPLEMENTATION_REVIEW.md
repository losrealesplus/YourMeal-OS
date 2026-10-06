# CR-ORDER A3 — Writer transaccional dish-only

Autoridad: Alexander Hernandez, autorización POST-#494/#495. Base verificada: `70d5d052fe6fdcc5d956af5c074cb784c483890a`. Esta unidad implementa ADR 0102; no habilita custom ni cambia sus contratos congelados.

## Document context check

FOUNDATION, AGENTS, Contexto Estratégico Permanente, Filosofía de Producto, Contexto CTO, Engineering Operating Protocol, PR Review Protocol, ADR 0102, contrato CR-ORDER r1 y matriz de impacto consultados. ADR 0103 y contrato Offer Pricing r2 delimitan la dependencia posterior M2. Supabase skill, changelog y documentación de funciones/RLS consultados; validación de SQL únicamente en PostgreSQL local aislado.

## Comportamiento

`CanonicalOrderWriteService` valida la entrada y llama una única RPC autenticada. La operación SQL crea o modifica un pedido dish-only, mantiene snapshots, archiva las líneas retiradas y confirma cliente mínimo, pedido, líneas, entrega derivada, audit y ledger en la misma transacción. El precio y hash se calculan en servidor; un precio de override del personal autorizado es intención explícita validada, no un total enviado por el cliente.

El ledger conserva identidad y revisión originales del commit. Un retry con el mismo actor, requestId y comando no crea otra escritura; un hash diferente se rechaza. Si hubo una modificación posterior, el retry devuelve la identidad/revisión de su commit original junto a la lectura actual autorizada del pedido. No almacena una copia adicional de notas o perfiles dietéticos en el ledger ni vuelve a cotizar el pedido ya confirmado.

La RPC pública es SECURITY INVOKER. El núcleo privado tiene SECURITY DEFINER con un rol dedicado NOLOGIN/NOBYPASSRLS, sin propiedad de las tablas y con políticas RLS específicas. Esta separación permite acceder al ledger cerrado y distinguir la procedencia del writer sin confiar en un GUC manipulable por el cliente. Se valida actor, pertenencia y autorización dentro de SQL. Los triggers cierran escrituras directas/legacy sobre v2.

## Fronteras y dependencia

A3 es una fundación para captura individual de catálogo/override del personal. Los clientes requieren una cotización comercial verificada de M2. El contexto B2B se rechaza explícitamente: su entrega requiere la sede y no puede sustituirse por una dirección particular. Su flujo legacy permanece disponible; esta unidad no anuncia soporte transaccional B2B nuevo. No se conecta aún una nueva pantalla ni se desvía el flujo comercial legacy a este writer. Custom sigue rechazado y dish_id sigue obligatorio. Los paths legacy v1 conservan su comportamiento; su atomicidad anterior no queda certificada por esta unidad.

M2 debe integrar el hook de precio con cotización emitida por servidor y cerrar la entrada bare de A3 cuando el servidor comercial sea autoridad. Orden de merge requerido: A3 → M2. La aplicación de migraciones y la activación posterior requieren autoridad humana separada.

## Revisión y evidencia

Revisión técnica local: **READY WITH WARNINGS / READY FOR HUMAN REVIEW**. No quedan P0/P1 conocidos en el alcance local revisado. Riesgo HIGH para una eventual aplicación de esquema: requiere preflight del proveedor y autoridad humana separada. Esta revisión permite evaluar el PR, no ejecutar la migración ni activar el writer.

- PostgreSQL 17.10 temporal propio, sin TCP: 19/19 tests (18 escenarios + suite). Migrador no superusuario, NOINHERIT/CREATEROLE; roles API mediante SET SESSION AUTHORIZATION. Captura/modificación, cinco fallos de persistencia con rollback, idempotencia/hash/revisión, concurrencia de requests/ediciones, carrera con lote aún no visible, DateStyle, aislamiento y ACL/RLS pasan.
- Suite Vitest completa final: 292 archivos / 1.728 tests PASS, incluidos 90 específicos de la fachada canónica.
- Gobernanza local: 71 tests PASS. Typecheck global, build SSR/Nitro con Node 20.20.2, ESLint de implementación nueva/specs/runner y git diff --check PASS.
- Types generado: quedan 2.269 incidencias de formato preexistentes, igual número y misma regla que en main. La nueva declaración RPC no añade incidencias. No se reformatea el archivo completo para ocultar esa deuda.
- Contrato r1, matriz y r2 conservan sus tres digests aprobados. Los datos de baseline de rendimiento que regenera la suite se descartaron como salida de pruebas, no como cambio de esta unidad.

Los overrides del personal requieren un motivo explícito no vacío y auditado junto a identidad de línea y precios. Los locks de lotes usan claves ISO compartidas con el writer para cubrir también creación de lote concurrente. La dirección original y su snapshot se conservan al añadir fechas, incluido origen archivado, salvo intención explícita de cambio.

Límite: el fixture refleja el subconjunto de esquema y ACL utilizado; no es un dump productivo ni ejecución del historial completo de migraciones de Supabase. El preflight real pendiente debe comprobar esquema, propietarios, permisos, triggers existentes y ventana de locks antes de cualquier aplicación.

La inversión devuelve tiempo a la cocina evitando pedidos parciales y preservando precios/composición ya capturados. No hay observación UX nueva ni validación en producción. Android/APK/ADB: N/A; no se modifica el flujo móvil ni se afirma device-ready.

No se ejecutaron migraciones de proveedor, merge, Gate 7, deploy, cambios de precios de producción ni Cloudflare.
