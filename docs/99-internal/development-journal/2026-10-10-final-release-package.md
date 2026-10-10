# Paquete final de corrección de EatClean

Intención: convertir únicamente las correcciones SQL demostradas en el E2E en migraciones independientes y preparar una decisión conjunta de publicación. Sin nuevas fases ni repetición del recorrido.

Base main 38eb0b5d; checkpoint E2E 49c8f57d conservado por descendencia en codex/eatclean-final-release-package. Guard de sesiones cliente incluido sin cambios adicionales.

Dos migraciones nuevas generadas mediante CLI: USAGE mínimo auth para cr_order_writer, con comprobación de concesión efectiva; snapshot de precio en RPC de 11 argumentos, con binding de definición original y conservación de owner/ACL/security config. Dos migraciones P34 originales intactas. Manifiesto scripts/release/eatclean-final-sql-manifest.json.

22 comprobaciones PostgreSQL focalizadas PASS. Precios pagado/cero, precio recibido ignorado, tenant/customer, ausencia de identidad, atomicidad, permisos mínimos, grant inefectivo y rol inseguro rechazados; definición desconocida rechazada; ACL conservadas. Se corrigieron fixtures y la autoridad de aplicación del grant exclusivamente en el laboratorio. Cleanup PASS. No E2E repetido ni acceso productivo.

Informe único FINAL_RELEASE_PACKAGE.md en reports/eatclean-sprint-02 del workspace superior: código, manifiesto, transición, source, artefacto, limitaciones y decisiones. Pausa productiva todavía requiere operador exclusivo y cobertura verificable de escritores; no está autorizada ni desplegada. Sin push/PR/merge/deploy, SQL productivo, cambios Gate7 ni reapertura P34.
