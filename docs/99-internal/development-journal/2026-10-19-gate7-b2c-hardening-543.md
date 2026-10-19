# Gate 7 — Preparación de Conciliación de Gobernanza B2C Hardening y Onboarding (EatClean #542 + #543)

Baseline publicado: `f2d63350ba3e21dd77301730dd1754cc11ad1fdc` (deploymentId 7155586740, versionId `8bbf1cc1-8325-4ade-82c9-86798ca119c6`).
Candidato de producto: `82e984eb647fef90db98d28a7b3e81ca5dd2dfb8` (merges de PR #542 `34d588de1d22bdacee55a22ab440e5c2b7d7d648` y PR #543 `82e984eb647fef90db98d28a7b3e81ca5dd2dfb8` en main).

Alcance sellado: 28 archivos netos de producto correspondientes a:
1. Onboarding B2C CX-01B (`CustomerWelcomeModal`).
2. Cesta multidía y selector de días en planificación semanal.
3. Hardening de 5 puntos: corte horario en servidor, aislamiento por tenant, validaciones de cliente.
4. Migración 74 de PostgreSQL (`cr_order_server_cutoff_enforcement.sql`).

Clasificación de las 5 rutas SPECIAL:
1. `B2C_HARDENING_5_POINTS_IMPLEMENTATION_REPORT.md` — Reporte de evidencia en directorio raíz.
2. `EATCLEAN_B2C_ONBOARDING_AND_MULTIDAY_IMPLEMENTATION_REPORT.md` — Reporte de evidencia en directorio raíz.
3. `src/hooks/use-tenant-active-week.spec.tsx` — Test unitario del hook de semana activa (sensible por palabra clave `tenant`).
4. `src/hooks/use-tenant-active-week.ts` — Hook cliente de semana activa y horario de corte por tenant.
5. `supabase/migrations/20261018193000_cr_order_server_cutoff_enforcement.sql` — Migración SQL M74 (ya aplicada y verificada en Supabase producción).

Estado de Base de Datos:
La Migración 74 ya fue aplicada y verificada atómicamente en Supabase producción (`nhirlpkuvonggctdzzad`). Ledger 74 activo, Checkpoint 13 activo, trigger de corte `cr_order_cutoff_header_guard` activo. Función RPC `is_weekly_order_cutoff_passed` verificada empíricamente en vivo (retorna `true` para semana pasada y `false` para semana activa). NO se autorizan ni ejecutan más migraciones SQL (`productionSqlAuthorized: false`, `migrationExecutionAuthorized: false`).

Preservaciones críticas verificadas:
- CX-01B Warm Premium Onboarding (`CustomerWelcomeModal`).
- Selección y persistencia de cesta multidía en `/app`.
- Validación de fecha de corte comercial en cliente y servidor.
- `orderCreation: true`, `staffOrderCapture: true`, `crmIdentityMutations: false`.

Mecanismo de Publicación:
Se habilita la reconciliación acotada B2C Hardening mediante `mode: exact_interval`, seleccionada exclusivamente cuando el baseline publicado es `f2d63350ba3e21dd77301730dd1754cc11ad1fdc`. Exige la secuencia canónica de 2 commits de producto en main (`34d588de` PR #542 y `82e984eb` PR #543) y un único PR de gobernanza desde la rama `codex/gate7-b2c-hardening-543-reconciliation`. Verifica procedencia humana por el revisor `losrealesplus` (ID: 292604102).

El comando CLI `--b2c-543-payload` genera exclusivamente la propuesta de lectura (read-only) tras el merge de gobernanza; no otorga autorización productiva por sí mismo.

Paso posterior, estrictamente condicionado a autorización soberana:
1. Crear PR de gobernanza desde `codex/gate7-b2c-hardening-543-reconciliation` hacia `main`.
2. Autorizar merge soberano en `main` por `@losrealesplus`.
3. Ejecutar `--b2c-543-payload` contra el nuevo `main` para obtener scope identity e intervalo exacto.
4. Despachar `deploy-production.yml` vía `workflow_dispatch` con `mode: exact_interval`.
5. En Phase 2, requerir aprobación humana explícita del entorno `production-worker`.

Estado: implementación local completada y probada. No se ha realizado push, merge, dispatch ni despliegue. Supabase y Cloudflare permanecen inalterados.
