# Gate 7 post-merge — contrato de preparación y publicación

Fecha: 2026-10-04. Clasificación: HIGH / PRIVILEGED. Estado: IMPLEMENTED / LOCAL_VERIFIED; pendiente de PR y revisión humana. Autoridad de alcance: solicitud explícita de Alexander para implementación + branch/commit/push/PR. **No autoriza merge, dispatch, Gate 7 real ni mutaciones de proveedores.**

## Scope y contexto

El contrato previo de #483 publica mediante Wrangler 4.86.0 `versions upload --no-bundle` y `versions deploy <UUID>@100% --yes`. Phase 1 construye; Phase 2 verifica y extrae. Este cambio automatiza la preparación posterior al merge y refuerza identidad, clasificación y evidencia. No cambia las configs Wrangler, rutas, dominios, permisos Cloudflare, Node 20, secretos ni protecciones. #486/#487 siguen su ciclo operativo anterior, independientemente de este PR.

# DOCUMENT CONTEXT CHECK

- FOUNDATION.md y AGENTS.md: CONSULTED; sin reapertura de Foundation.
- FOPEBA / CR-GOV-02: CONSULTED mediante contrato y suite existente del gatekeeper/broker; no se atribuye autoridad productiva a CI.
- Strategic Context / Filosofía de Producto / CONTEXTO_CTO: CONSULTED; inversión operativa justificada por reducir preparación manual.
- Relevant ADRs: CONSULTED, 0097 y nueva decisión operativa 0101; no modifica dominio.
- Domain Contracts: N/A, ningún cambio de producto/datos.
- Capability Contract: esta autorización y contrato Gate 7 existente de #483.
- Provider Runbooks: workflow actual y código fijado de Wrangler 4.86.0 CONSULTED; APIs GitHub/Cloudflare solo documentadas/lectura.

## Arquitectura actual e implementada

Antes: PR → revisión/merge humano → dispatch manual → build/digest/artifact → `production-worker` → aprobación OOB → extracción/verificación → upload/version exacta → despliegue.

Después: push a main → clasificación del intervalo pendiente → build/digest/artifact → **AWAITING_PRODUCTION_APPROVAL** → aprobación OOB → revalidación → publicación exacta → lectura del deployment → GET de asset estático → informe. La clasificación y el build no reciben secretos Cloudflare. El job protegido conserva la frontera existente.

El modelo permanente de Codex tiene una sola fuente: [ENGINEERING_OPERATING_PROTOCOL](ENGINEERING_OPERATING_PROTOCOL.md#codex-operating-model--autonomía-con-frontera-de-autoridad). AGENTS contiene un enlace obligatorio corto. Este contrato describe Gate 7, no duplica ese modelo.

## Triggers e identidad

`push` exclusivamente a `main`, sin filtros que omitan cambios sensibles. `workflow_dispatch` se conserva para preparar un run nuevo sobre main; no equivale a aprobación. PRs y ramas no solicitan publicación. Se exige repositorio `losrealesplus/YourMeal-OS`, SHA hexadecimal exacto, ref main, run ID numérico, evento permitido y attempt 1. Los reruns se bloquean; requieren run nuevo y nueva aprobación.

La base se obtiene de deployments de GitHub de `production-worker`, atribuidos al workflow y SHA canónicos. Se recorren todas las páginas. Para runs nuevos se exige el ledger de publicación; para el legado se admite únicamente Gate 7 concluido con éxito. Una actualización parcial, atribución desconocida, ledger ausente/expirado/ambiguo o truncamiento bloquean la preparación/publicación hasta reconciliación separada. No se considera publicación un job aprobado que terminó SUPERSEDED/NON_DEPLOYABLE sin empezar mutaciones. Un smoke fallido tras DEPLOYED sí conserva esa base publicada.

La clasificación incluye el diff final **y cada commit first-parent desde la última publicación**, incluidos archivos renombrados, cambios luego revertidos y merges no publicados. Cada commit pendiente debe corresponder exactamente a un PR merged a main; pushes directos o asociación ambigua se bloquean. No se asume que solo importa el último PR.

## Clasificación determinista

La implementación canónica está en `scripts/governance/release-contract.mjs`; `release-policy.json` fija repositorio, Worker, environment, origen y revisor.

- **DEPLOYABLE:** `src/` y `public/`, excepto sensibilidad indicada abajo.
- **NON_DEPLOYABLE:** documentación sin autoridad y tests reconocibles (incluida evidencia visual y fichas CR no GOV `*_SCOPE_AND_REVIEW.md`), sin cambios runtime ni sensibles en el intervalo completo. Un merge docs-only no oculta runtime pendiente.
- **REQUIRES_SEPARATE_AUTHORIZATION:** workflows, gobierno, Foundation/AGENTS, ADRs/arquitectura, contratos/protocolos/reglas de autoridad, configuraciones de instancia/build/dependencias, infraestructura/migraciones/SQL, auth/tenant/identity/permissions/membership/secrets y código de integraciones/services. Sensibilidad precede a runtime y tests. Paths desconocidos, inválidos o tooling no reconocido se tratan como especiales.

Los hijos UI del directorio de routing `_authenticated/` no se confunden con una modificación de autenticación; el layout `_authenticated.tsx` y rutas/código auth sí son especiales. El intervalo real de #486/#487 se inspeccionó sin ejecutar Gate 7 y se clasifica DEPLOYABLE.

Es una política conservadora: puede bloquear un cambio inocuo antes de conceder autoridad implícita. Ampliar la lista normal es otra modificación privilegiada revisable.

**Activación inicial:** este propio PR es SPECIAL. Su merge no puede publicar silenciosamente sus cambios, y el intervalo pendiente seguirá bloqueado hasta una reconciliación/publicación privilegiada expresamente autorizada por Alexander. Este PR no incorpora un bypass ni inventa una base ya publicada. Esa activación es un paso posterior separado; después, los merges normales elegibles no requieren dispatch manual. La automatización no es requisito para el Gate 7 actual de #486/#487.

## Concurrencia y supersedencia

Solo el build/preparación utiliza `cancel-in-progress: true`; puede sustituirse antes de producción. No hay cancelación a nivel workflow. La publicación usa un grupo global, `cancel-in-progress: false`, `queue: max`: un publicador activo y hasta 100 pendientes; el límite de cola puede rechazar entradas nuevas. GitHub ordena según llegada a la cola, no según SHA/fecha de dispatch. No se depende de esa ordenación para seleccionar código.

Al entrar en el publicador protegido se vuelven a leer main, environment, aprobación, base e intervalo. Si el SHA preparado ya no es main: **SUPERSEDED**, sin upload/deploy y sin usar el artefacto de otro run. Un duplicado ya publicado es NON_DEPLOYABLE. Si otro publicador aparece in-progress o el estado es incierto: bloqueo. Un merge posterior a la última lectura puede ocurrir durante la subida; no modifica el artefacto autorizado. Se registra si main avanzó y se exige aprobación nueva para la siguiente versión. No hay transacción atómica GitHub/Cloudflare ni garantía frente a escritores externos que no usan este grupo.

La cola ampliada evita la sustitución automática del único pending por un merge nuevo. Sigue siendo posible una cancelación humana, timeout, caída del runner o agotamiento del límite; no se reinterpretan como rollback seguro.

## Prueba de autoridad y secretos

Se mantiene `environment: production-worker` en el único job con secretos Cloudflare. GitHub bloquea ese job antes de ejecución hasta aprobación. Además, el publicador exige environment sin bypass administrativo, exactamente Alexander (`losrealesplus`, User ID 292604102) como reviewer y exactamente una aprobación de esa identidad para ese environment/run. Tokens Actions tienen solo contents/actions/deployments/pull-requests **read**, y no hay llamada a APIs de aprobación o modificación.

Lectura del environment en esta sesión: revisor único anterior, `can_admins_bypass=false`, política de ramas protegidas y `prevent_self_review=false` existentes, sin cambios. Esta prueba conserva el control de la cuenta soberana; no puede demostrar la presencia física de quien usa sus credenciales ni fortalecer fuera de alcance la configuración heredada. No se declara anti-self-review activo.

Merge, CI o Codex no generan aprobación. Phase 1 no recibe credenciales productivas. Phase 2 recibe las credenciales ya existentes únicamente dentro del job protegido; nunca se escriben en artifacts/reportes. La frontera de confianza sigue incluyendo código aprobado del repositorio, Actions oficiales, runner y Wrangler fijado. No se añade un broker obligatorio ficticio: su suite se ejecuta, pero las nuevas guardas efectivas son las descritas aquí.

## Build Once → Deploy Exactly That

- Todos los checkouts usan `github.sha`, no main móvil.
- Una sola construcción en Phase 1. Se empaqueta la `.output` original como `worker-dist.tar.gz`.
- Se publica manifest con repo/SHA/run/attempt, SHA-256 del tar y bytes de config, clasificación/base y versiones de herramientas.
- Artifact inmutable v4, nombre único por run/attempt y **artifact ID exacto** transmitido por outputs del job; no selección latest, por otro workflow o por nombre ambiguo.
- Digest/config hash se transmiten fuera del artifact y se comparan con manifest y bytes en Phase 2; se verifica además pertenencia del artifact al run/SHA y expiración.
- Antes de extraer: solo archivos/directorios bajo `.output`, sin traversal, enlaces, paths duplicados o especiales; límites y entrypoint obligatorio; destino nuevo. Compatible con Python 3.9+.
- Phase 2 no instala dependencias del producto, recompila, bundlea ni cambia `.output`. Wrangler conserva `--no-bundle` y configs existentes.
- Un único registro NDJSON `version-upload` schema 1, Worker esperado y UUID válido. Ausencia/ambigüedad/UUID o Worker incorrectos impiden `versions deploy`.
- Se despliega solo ese UUID de la misma invocación a 100%. No logs humanos, latest version ni triggers deploy.
- Wrangler 4.86 serializa el Map `version_traffic` como `{}`; no acredita tráfico. Dos GET Cloudflare verifican el deployment exacto y el actual, ambos con una sola versión esperada al 100%.

La inspección de Wrangler 4.86 muestra que la administración de routes/custom domains no pertenece a estos comandos de versiones. `maybePatchSettings` devuelve sin PATCH si no hay logpush/tail_consumers/streaming_tail_consumers/observability; se rechazan esas claves y env/build/site/legacy_env antes de publicación. No se invoca reconciliación de rutas, dominios, DNS o secretos. Bindings/vars/assets versionados mantienen el contrato existente.

## Smoke e informe

GET anónimo de un asset JS/CSS estático elegido determinísticamente del bundle, sin redirects, cookies, autenticación, ejecución de JS, bootstrap/RPC ni escritura de negocio. Exige HTTP 200 y SHA-256 igual al asset aprobado. No verifica Safari, journeys, clientes, pedidos o Supabase. La UI requiere **HUMAN PRODUCTION VERIFICATION REQUIRED**.

Se inicializa `release-report.json` antes de descargar/verificar el artifact y se escribe antes de cualquier posible publicación y se actualiza por etapas: NOT_DEPLOYED → PUBLICATION_UNKNOWN → VERSION_UPLOADED → DEPLOYMENT_UNKNOWN → DEPLOYED. SUPERSEDED/NON_DEPLOYABLE son no-ops sin mutación. Se conserva como artifact incluso al fallar (90 días) e incluye SHA/run/attempt/artifact/digest/version/deployment/base/smoke y fallo.

DEPLOYED se persiste después de lectura de tráfico y **antes del smoke**. Un smoke fallido hace fallar el job pero mantiene DEPLOYED; jamás rollback automático. Un fallo en upload/deploy/read-back conserva incertidumbre y bloquea futuros intentos automáticos. Si el runner desaparece y no publica ledger, también bloquea. El job protegido no reconstruye ni reelige una versión para “arreglar” un fallo.

## Evidencia local y límites

Base inspeccionada: `820eefb38331026e4e5e70f8ce00294ad6de62d6` (#487). Último deployment GitHub legado exitoso observado: 6841438048, SHA `752234f406366bdf2fcec18750092b6f0fd44039`, run 37204786495. Esto es evidencia GitHub; no se afirma una lectura Cloudflare actual en esta tarea.

- PASS: typecheck, build, 25 tests de gobernanza existentes; Vitest completo: 274 archivos / 1.538 tests. Build/typecheck/Vitest locales usan Node 26.5; contrato/publicador/dry-run se verifican también con Node 20.20.2.
- PASS: 13 tests nuevos de contrato/orquestación, incluidos múltiples escenarios negativos y respuestas simuladas; ningún test llama Cloudflare. También ejecutados en Node 20 fijado.
- PASS: lint de archivos JS nuevos, YAML parseable y nueve bloques shell válidos.
- FAIL — PRE-EXISTING: lint global, 13.208 errores / 44 warnings; mismo resultado en base sin cambios. No se limpia deuda ajena.
- BLOCKED — ENVIRONMENT: actionlint 1.7.12 no reconoce `concurrency.queue`, aunque GitHub lo documenta. Con exclusión **solo de ese diagnóstico conocido**, el resto del workflow pasa. No se elimina la cola para satisfacer un esquema antiguo. Aceptación remota del nuevo workflow: NOT TESTED; no se permite ejecutarlo aquí.
- PASS: empaquetado/extracción del build real en fixture sin credenciales; 573 hashes conservados y tar alterado rechazado antes de extracción. El empaquetador desactiva metadatos AppleDouble de macOS sin cambiar archivos de ejecución.
- PASS: dry-run local Wrangler 4.86 `versions upload --no-bundle --dry-run`, sin credenciales: entrypoint + 282 módulos adicionales, incluido `_libs/h3+rou3+srvx+unenv.mjs`; 283 hashes idénticos y 1.969 imports relativos sin referencias ausentes. Assets y bindings presentes.
- NOT TESTED: Gate 7 real, aprobación real, deploy, publicación de versión, smoke en producción y comprobación humana UX. No se confunden simulación/dry-run con producción.

## Revisión adversarial y riesgos residuales

Sin hallazgos P0/P1 abiertos dentro del contrato local; resultado **READY WITH WARNINGS / READY FOR HUMAN REVIEW**, no autorización de merge.

Se intentó sustituir run/SHA/attempt/digest/Worker/UUID; usar aprobación sintética/duplicada; omitir reviewers; introducir settings no versionados; ocultar special mediante runtime/revert/rename; reutilizar archivos NDJSON; y borrar estado DEPLOYED al fallar smoke. Guardas y pruebas bloquean esas rutas o conservan el estado real. El publicador se prueba como proceso con GitHub/npx/fetch simulados, incluyendo no-op obsoleto, upload inválido, fallo parcial y smoke fallido tras publicación.

Riesgos pendientes explícitos: activación privilegiada separada; verificación remota del workflow y de APIs/permisos GITHUB_TOKEN; conservadurismo de clasificación/asociación PR (rebase o batch ambiguo puede bloquear); API/history/artifact expirados; Node/Actions/runner heredados; escritores externos sin mutex; ventana entre lectura de main y publicación; cola finita; smoke estático limitado; compromiso de cuenta soberana o proveedores; y ausencia de prueba productiva bajo este permiso.

## Archivos y responsabilidades

Workflow: orchestration/trust boundary. `release-policy.json`: identidad fija. `release-contract.mjs`: guardas/clasificación/NDJSON. `release-plan.mjs`: base e intervalo/PRs. `release-artifact.mjs` + `verify-release-tar.py`: tar/digest/manifest/extracción. `release-publish.mjs`: aprobación, publicación y ledger/smoke. Dos suites `.spec.mjs`: contrato y proceso offline. AGENTS + protocolo: modelo operativo. ADR 0101: decisión; diario: motivo y límite de cierre. Ningún archivo de producto o config Wrangler cambia.

## Fuentes primarias

[GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) y [anuncio de queue: max](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/) sustentan el uso de cola ampliada sin cancelación del publicador. [Deployment protection](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments) define la frontera del environment. [Workflow runs API](https://docs.github.com/en/rest/actions/workflow-runs) documenta la lectura de aprobaciones. [Cloudflare deployments API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/) sustenta el read-back. Inspección local del paquete Wrangler 4.86.0 complementa sus salidas NDJSON/settings.

CURRENT STATE: LOCAL_VERIFIED / READY FOR HUMAN REVIEW.
NEXT STEP: revisar PR, especialmente clasificación, cola y activación separada.
WHO: Alexander.
REQUIRES AUTHORIZATION: YES, para merge/activación/producción fuera de esta tarea.
EXPECTED NEXT STATE: PR revisado; cualquier ejecución productiva exige su autorización propia.
