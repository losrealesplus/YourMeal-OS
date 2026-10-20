# Gate 7 — Preparación de Conciliación de Gobernanza EatClean Operational Evolution (#545)

Baseline publicado: `14c168ccc7e50067e57204b236725b450a1a238d` (deploymentId 7176894333, versionId `6cb4f6b5-ba78-434f-9497-4a9257dc6f1f`).
Candidato de producto: `cc5206d4047c2f2321e55805875816bfe6c7b1dc` (merge de PR #545 en `main`).

Alcance sellado: 21 archivos netos de producto correspondientes a:
1. Calendario mensual de Cocina integrado con turnos operacionales.
2. Acciones masivas sobre pedidos (avanzar estados intermedios y cancelación agrupada con motivo obligatorio).
3. Hoja de producción modular e interactiva con previsualización CSS/PDF de cuatro secciones.
4. Etiquetas adhesivas por porción con borde de marca y validación visible de alérgenos.
5. Aislamiento total de «Marcha atrás» (`operational rollback`), desactivado en frontend (`FEATURE_OPERATIONAL_ROLLBACK_ENABLED = false`), protegido en capa de aplicación (`OrderLifecycleService`) y fachada (`OrderFacade`), y con setter restringido a entornos de prueba (`HARD_DISABLED`).

Clasificación de las 2 rutas SPECIAL:
1. `.gitignore` — Reglas de exclusión para directorios locales temporales y reportes intermedios.
2. `src/auth/google-oauth-flow.spec.ts` — Test unitario de autenticación social con fijación explícita de variable de entorno para aislamiento determinista.

Estado de Base de Datos:
NO se introducen ni ejecutan migraciones SQL (`productionSqlAuthorized: false`, `migrationExecutionAuthorized: false`). El procedimiento almacenado atómico `cr_order_rollback_v1` queda expresamente pospuesto para un ciclo de cambio posterior con migración autorizada. El esquema actual de PostgreSQL permanece intacto.

Preservaciones críticas verificadas:
- Calendario mensual de Cocina y filtros operacionales.
- Acciones masivas de avance y cancelación.
- Selector modular para exportación PDF de producción.
- Renderizado de etiquetas de empaque para impresión.
- Aislamiento absoluto de marcha atrás (`HARD_DISABLED`).
- `orderCreation: true`, `staffOrderCapture: true`, `crmIdentityMutations: false`.

Mecanismo de Publicación:
Se habilita la reconciliación acotada mediante `mode: exact_interval`, seleccionada exclusivamente cuando el baseline publicado es `14c168ccc7e50067e57204b236725b450a1a238d`. Exige la secuencia canónica del commit de producto en `main` (`cc5206d4` PR #545) y un único PR de gobernanza desde la rama `codex/gate7-operational-evolution-545-reconciliation`. Verifica procedencia humana por el revisor `@losrealesplus` (ID: 292604102).

El comando CLI `--operations-545-payload` genera exclusivamente la propuesta de lectura (read-only) tras el merge de gobernanza; no otorga autorización productiva por sí mismo.

Paso posterior, estrictamente condicionado a autorización soberana:
1. Crear PR de gobernanza desde `codex/gate7-operational-evolution-545-reconciliation` hacia `main`.
2. Autorizar y ejecutar merge soberano en `main` por `@losrealesplus`.
3. Ejecutar `--operations-545-payload` contra el nuevo `main` para obtener scope identity e intervalo exacto.
4. Despachar `deploy-production.yml` vía `workflow_dispatch` con `mode: exact_interval`.
5. En Phase 2, requerir aprobación humana explícita del entorno `production-worker`.

Estado: implementación local completada y validada con pruebas unitarias de gobernanza. Supabase y Cloudflare permanecen inalterados.
