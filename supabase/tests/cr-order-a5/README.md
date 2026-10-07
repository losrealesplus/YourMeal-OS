# A5 — PostgreSQL local / autoridad real

Ejecutar `node --test supabase/tests/cr-order-a5/local-integration.mjs` desde la raíz.

Clúster temporal PostgreSQL 17.10 con socket Unix, `listen_addresses=''`, sin URLs ni credenciales Supabase. Binarios locales iguales al runner A4a. El ejecutor de migraciones es NOLOGIN/NOINHERIT/CREATEROLE, distinto del writer. Callers authenticated/service_role/postgres usan SET SESSION AUTHORIZATION / SET ROLE efectivos. Ninguna consulta mutadora alcanza al proveedor.

Secuencia real: fixture A3 → A1 → A3 → M2 → A4a → M3 → A5 ledger/writer/UUID. Enums reales de nueve estados de pedido y ocho de delivery. Audit entity_id UUID antes de capturar, evitando el falso positivo del fixture previo con text. Se conservan las migraciones históricas byte por byte.

La suite incluye 81 pares parentales, dish/custom/mixed, autoridad/membership/GUC/ACL, request replay/conflict, revisiones, cancel/cancel, edit/cancel, transition/transition, dispatch/cancel, retry/cancel, all-delivered/mixed/all-cancelled, audit rollback y no-op terminal. Los estados artificiales de la matriz se preparan únicamente con el owner local; no se confunden con operaciones de negocio reales. La prueba de packing utiliza la secuencia completa canónica.

Las activaciones del fixture son sintéticas y temporales. El proveedor y A4b no se activan. La prueba prueba guards con postgres BYPASSRLS y service_role; no pretende impedir que un superusuario desactive deliberadamente triggers, cambie funciones o falsifique el esquema. Privilegio administrativo no constituye autorización.

Límites: no certifica el proveedor live, aplicaciones antiguas, efectos externos ni UX productiva. Nuevos eventos de evidencia también incrementan revisión para serializar el trabajo, conservando el estado parental. UNKNOWN externos mantienen bloqueada la certificación y activación.
