# Retroceso v1 — prueba local reproducible

`node supabase/tests/rollback-v1/local-integration.mjs`

Requiere un contenedor PostgreSQL **local** con el esquema actual en su base `postgres`.
Por defecto utiliza `yourmeal-e2e-db`; `ROLLBACK_TEST_CONTAINER` permite indicar otro contenedor local.
Copia únicamente el esquema a una base nueva, instala allí la migración, ejecuta fixtures sintéticos y elimina esa base al terminar. No usa credenciales, CLI ni endpoints de Supabase cloud.

Verifica las tres transiciones, permisos operativos y denegados, aislamiento tenant, rechazo v2,
justificación, revisión y estado esperados, alcance multijornada exacto y consentimiento, rollback
transaccional ante error de auditoría, permiso real `authenticated` y denegación `anon`,
retroceso de microestados reales con auditoría, conservación de servicios anteriores/cancelados,
rechazo de reparto avanzado, dos solicitudes concurrentes y pedidos/servicios no seleccionados.

La prueba utiliza el esquema local, no certifica que esté sincronizado al 100% con producción.
El bootstrap completo de migraciones del PR verifica la instalación desde una BD vacía.
