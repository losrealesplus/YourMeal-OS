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

**Activación inicial:** #488 sigue siendo SPECIAL. El carril explícito descrito abajo permite preparar exclusivamente el intervalo inicial autorizado; su merge no autoriza producción. Después de la publicación real, los merges normales elegibles no requieren dispatch manual. No se inventa una base ni se omiten protecciones.

## Carril INITIAL_ACTIVATION — remediación acotada

Scope de este PR: únicamente workflow/helpers/specs Gate 7, esta sección y diario. HIGH / PRIVILEGED; autorizado para implementación + commit/push/PR, sin merge, dispatch, aprobación o producción. FOUNDATION/AGENTS/protocolo/CR-GOV-02/ADR 0101 consultados/reutilizados; no se modifica modelo operativo ni producto. Base de implementación: `edc14825d4a513880df9542b29f89e5a04f2234c`.

La clasificación por paths no cambia. `workflow_dispatch` incorpora `mode=initial_activation`, `expected_base_sha`, `expected_target_sha`, `authorized_prs` (array JSON ordenado) y `authorization_id`. Estos inputs ni `reason` conceden autoridad por sí solos. Se exige run nuevo attempt 1, repo/main/SHA exactos, original actor y triggering_actor Alexander, historial completo con atribución PR única y protecciones existentes. Push no puede activar la excepción; inputs de activación en modo normal tampoco pueden caer al camino normal.

Anclas inmutables: base `752234f406366bdf2fcec18750092b6f0fd44039`, deployment GitHub **6841438048** (no solo mismo SHA), commits first-parent exactos #486 `dd03d2c85da6acf320a1c1d8498133168b68d451` → #487 `820eefb38331026e4e5e70f8ce00294ad6de62d6` → #488 `edc14825d4a513880df9542b29f89e5a04f2234c` → **un solo commit de merge del PR de este carril**. Ese PR debe estar merged por Alexander, venir del repo canónico y de `codex/gate7-initial-activation-lane`; su número se obtiene de GitHub, no se predice. No se acepta otro merge/commit o archivos fuera del conjunto cerrado de remediación. Los paths SPECIAL de #488 deben ser exactamente los del commit aprobado. Esta restricción no es un permiso permanente para esos paths: solo opera dentro de esa cadena/base/deployment únicos.

Después del merge humano, fetch del main exacto y reconciliación READ-ONLY mediante `node scripts/governance/release-plan.mjs --initial-activation-payload` produce el payload canónico y su SHA-256. **Antes del merge no existe un target/certificado real válido**; el comando se bloquea si falta ese PR o main avanzó. No escribe artifact/ledger ni ejecuta workflows. La forma exacta del payload es:

```json
{
  "schema": 1,
  "mode": "initial_activation",
  "repository": "losrealesplus/YourMeal-OS",
  "baselineSha": "752234f406366bdf2fcec18750092b6f0fd44039",
  "baselineDeploymentId": 6841438048,
  "targetSha": "T: merge SHA real del PR de remediación",
  "prs": [486, 487, 488, "N: número real de ese PR"],
  "special": [
    {"commit": "edc14825d4a513880df9542b29f89e5a04f2234c", "pr": 488, "files": "lista ordenada de {path,before,after}"},
    {"commit": "T", "pr": "N", "files": "lista ordenada de {path,before,after}"}
  ]
}
```

Este bloque muestra estructura, **no es un certificado ejecutable**. N es entero y T hexadecimal de 40 caracteres en el payload real. `before`/`after` son SHA-256 de bytes de blobs regulares Git, o null para creación/eliminación. Paths y objetos tienen orden canónico; commits/PRs mantienen orden first-parent. `authorization_id = SHA256(JSON.stringify(payload))`, sin timestamps o selección latest. El hash prueba identidad de alcance, no firma humana. La fuente de verdad del conjunto cerrado está en `release-activation.mjs`, no duplicada en inputs/configs.

Si todos los checks pasan, el plan conserva `originalDecision=REQUIRES_SEPARATE_AUTHORIZATION` y obtiene **AUTHORIZED_INITIAL_ACTIVATION**, con payload/ID/run/attempt. Phase 1 incluye esa misma identidad explícita en el manifest y construye una sola vez. Se permite únicamente llegar al environment `production-worker`; Alexander debe aprobar OOB el run/artifact concretos.

Phase 2 conserva verificación artifact ID/source/run/attempt/digest/config; vuelve a leer base, main, PRs, actor e inputs, reconstruye hashes y payload y exige igualdad exacta con plan/manifest de Phase 1. No hay fallback a DEPLOYABLE. Antes de aplicar la versión se vuelve a comprobar main tras upload; si avanzó, se conserva VERSION_UPLOADED y se bloquea deploy, sin rollback. La ventana restante entre última lectura y escritura distribuida no puede hacerse atómica; el artifact/version nunca cambia de identidad.

La publicación guarda la identidad de activación en el ledger real, solo tras el flujo existente. **Single-use:** el nuevo deployment/baseline deja de ser el deployment legado 6841438048; incluso una publicación/rollback posterior al mismo SHA tiene otro ID y no reabre el carril. Estado parcial/ledger perdido bloquea por el contrato previo. Un duplicado aprobado después del primer éxito falla la ancla; attempts >1 se rechazan. Esta prueba depende de historia GitHub confiable y no borrada; no protege contra reescritura privilegiada del propio contrato/historia. Tras éxito, los merges normales vuelven al clasificador estándar sin excepción.

Validación de esta remediación: 20 tests de activación + 13 anteriores PASS en Node 20.20.2; 25 gobernanza PASS; typecheck/build PASS en Node 20.20.2; YAML/nueve bloques shell/changed-file lint/diff check PASS. Proceso fixture de Phase 1 → package → verify → Phase 2: hash/manifest idénticos; scope/actor/aprobación/run/attempt/input/main divergentes no alcanzan el upload simulado; avance de main durante upload impide versions deploy. No llamadas GitHub/Cloudflare reales en tests; no se fabrica evidencia productiva.

Dry-run local Wrangler 4.86 sin credenciales: 282 módulos adicionales y entrypoint/asset bindings, sin cambios en configs ni comandos de versiones. Lint global previo y limitación local actionlint queue se reutilizan como deuda/evidencia conocida; el queue merged de #488 ya fue aceptado por GitHub. Validación remota de los inputs nuevos, dispatch, aprobación, activación/deploy reales: NOT TESTED. Vitest de producto no se repite: src/dependencias/configs de producto no cambian; la suite completa del bloque anterior quedó PASS. No se consulta inventario de secretos ni se amplían permisos por el 403: las variables se comprueban cuando entre el job protegido.

Revisión adversarial: READY WITH WARNINGS / READY FOR HUMAN REVIEW. Sin ruta encontrada para arbitrary future SPECIAL + inputs: anclas de base/deployment/historial, PR canónico, contenido exacto y aprobación separada lo impiden. Riesgos residuales: nueva reconciliación obligatoria, cambio de main/base antes de activar, metadatos/API/ledger indisponibles, publicación parcial, confianza en GitHub/cuenta soberana, y límite distribuido mencionado. No hay autorización de merge/activación en esta tarea.

## Carril TRACK_B_RECONCILIATION — reconciliación de migraciones de proveedor verificadas

Fecha: 2026-10-06. Clasificación: HIGH / PRIVILEGED.

Cuando un intervalo de publicación contiene deltas `SPECIAL` debido a migraciones de base de datos (`supabase/migrations/`) y documentación/tests asociados, Gate 7 clasifica inicialmente el intervalo como `REQUIRES_SEPARATE_AUTHORIZATION`.

Si la totalidad de las migraciones dentro del intervalo ya fue ejecutada, atomizada y post-verificada en el proveedor de producción bajo un gate soberano independiente previo (Track B: `PROVIDER_MIGRATIONS_VERIFIED` 🟢 en `nhirlpkuvonggctdzzad`), el carril `TRACK_B_RECONCILIATION` permite la preparación determinista de la aplicación:

1. **Ancla inmutable:** `TRACK_B_RECONCILIATION` fija `baselineSha: daa1fc4d945255eea0c6c541538c0162666d37d6`, deployment ID `6846428166`, intervalo de PRs `#492`..`#501`, proveedor `nhirlpkuvonggctdzzad` y estado `PROVIDER_MIGRATIONS_VERIFIED`.
2. **Audit estricto de paths:** Cada migración de base de datos en el diff debe corresponder exactamente por path y digest SHA-256 a las 6 migraciones selladas (A1, M1, A3, M2, A4a, M3). Todo path `SPECIAL` no-migración debe pertenecer al conjunto cerrado y auditado `allowedSpecialPaths`.
3. **Fail-Closed:** Cualquier migración extra, migración faltante, digest alterado, baseline divergente o path `SPECIAL` no catalogado preserva `REQUIRES_SEPARATE_AUTHORIZATION` y bloquea la preparación.
4. **Preservación de barreras:** `READY != APPROVED`. La elegibilidad para preparación (`AUTHORIZED_RECONCILED_RELEASE`) permite a Phase 1 construir y empaquetar el artefacto inmutable, pero el despliegue en `production-worker` exige rigurosamente la aprobación manual Out-Of-Band (OOB) de Alexander Hernandez en GitHub Actions.

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

## Remediación de Phase 1 tras #489

Run 37229919269: clasificación `AUTHORIZED_INITIAL_ACTIVATION` correcta; Phase 1 falla antes del build y Phase 2 queda omitida. El checkout del build heredaba `fetch-depth: 1`; la prueba de activación requiere commits históricos reales y falla al validar ancestralidad `820eef… → edc148…`. Todos los checkouts de Gate 7 pasan ahora `fetch-depth: 0` y conservan `ref: github.sha` / `persist-credentials: false`. No se elimina ni simula la comprobación de ancestralidad.

Un fetch acotado al intervalo de activación resolvería solo este bootstrap: el contrato normal puede necesitar cualquier baseline publicado y los padres/árboles de cada commit intermedio. Un depth fijo o varios SHA sueltos no garantizan ancestralidad completa. Historial completo en Phase 1 es la modificación mínima que cubre ambos contratos, coherente con clasificación y publicación. Aumenta transferencia/tiempo y descarga refs adicionales; no concede permisos, persiste credenciales ni ejecuta código de otras refs. El source ejecutado permanece fijado al SHA y las APIs reconcilian main/baseline.

El segundo fallo es independiente: la prueba de publicación simula `push` pero heredaba `GITHUB_EVENT_PATH` del dispatch inicial. Ahora cada proceso simulado recibe un evento local explícito con inputs vacíos, consistente con su escenario normal. El publicador real sigue leyendo y validando el evento real; no se debilitan guardas ni se evita historia real en activación.

El merge de esta reparación cambia el target. Se admite únicamente un quinto commit después de #489 fijado a `8680099c49d32ddd88c66872f61df3dd483f0f77`, atribuido a un PR humano del repositorio canónico desde `cursor/gate7-phase1-history-fix`. Su conjunto de paths debe coincidir exactamente con `HISTORY_REMEDIATION_FILES`; incluye solo workflow, contrato/pruebas de activación, prueba de publicación, este documento y diario específico. No se admite sexto commit, cambio de policy, otro branch, ni paths adicionales/omitidos. El payload incluye los tres commits SPECIAL con sus hashes reales; se exige un nuevo authorization ID calculado tras merge. El número real del PR se obtiene de su atribución única, no de una entrada libre ni de un supuesto número futuro.

La autorización anterior no es reutilizable. El baseline observado sigue siendo deployment 6841438048 / SHA `752234f406366bdf2fcec18750092b6f0fd44039`; deberá verificarse de nuevo antes de cualquier nueva activación. Esta implementación autoriza únicamente revisión del PR, sin merge, dispatch, rerun ni producción.

## Diagnóstico seguro de JSON tras run #17

Run 37231484647 / source 4ac3fddb: parser y valor malformado **UNKNOWN**. Inputs previstos de PRs `[486,487,488,489,490]`; `AUTHORIZED_INITIAL_ACTIVATION` era la clasificación esperada. No se atribuye el fallo a ese campo: el evento efímero no está disponible y el log imprimió solo el mensaje genérico. No hubo artifacts; Phase 1/2 omitidas.

Inventario de todos los JSON.parse alcanzables desde clasificación antes de esta reparación:

- Policy (`release-plan`, carga de módulo): bytes del repositorio, objeto; control del repositorio; configura autoridad y se trata como información que no debe volcarse. Error nativo sin contexto seguro.
- API (`api`, incluye paginación): respuestas GitHub para environment, main ref, deployments/statuses, runs, artifacts y atribución de PRs; arrays u objetos según endpoint; control API, potencial metadata sensible. Error nativo indistinguible. Las comprobaciones de contenido/provenance posteriores siguen vigentes.
- Evento (`workflowInputs`): archivo del runner, objeto con inputs objeto opcional; envoltura GitHub, inputs humanos; contiene aserciones de autorización. Error nativo sin identificador.
- Ledger (`readReport`, solo baseline con workflow nuevo): archivo descargado del artifact de publicación, objeto; productor workflow/GitHub, evidencia de autoridad productiva. Error nativo sin identificador. La identidad/estado/hash del ledger se valida después.
- PRs (`authorizeActivation`): input humano dentro del evento, array JSON de enteros; aserción comparada con PRs reales, nunca autoridad por sí misma. Error nativo sin identificador. Policy/event/ledger son los únicos archivos JSON en este recorrido; NDJSON Wrangler y manifest pertenecen a etapas posteriores y no se amplía su alcance aquí.

`release-json.mjs` centraliza solo la operación pequeña de parseo/forma, invocada en cada límite responsable. Mensaje determinista: código, source semántico fijo, forma esperada y `result=FAIL_CLOSED`. No incorpora raw, causa nativa, endpoint/query, inputs, dumps de environment ni valores de credenciales. Códigos: RELEASE_POLICY_INVALID, GITHUB_API_RESPONSE_INVALID, EVENT_PAYLOAD_INVALID, RELEASE_REPORT_INVALID y ACTIVATION_INPUT_INVALID. No se añade fallback, normalización, heurística ni cambio de autoridad; el evento sin inputs conserva únicamente la semántica normal previa. JSON válido con forma incompatible falla; la comparación exacta de PRs/hashes/identidad continúa intacta.

La extensión bootstrap admite solo un sexto commit después de #490 fijado a `4ac3fddb0b1fd855beab39dbbcb4d70c81919592`, atribución única, merge humano y branch canónico `cursor/gate7-json-diagnostics`, con exactamente `DIAGNOSTIC_FILES` (ocho paths de esta reparación). No admite séptimo commit ni SPECIAL futuro. Canonicalización incluye los cuatro commits SPECIAL y sus hashes reales; tras merge target y authorization ID anteriores quedan inválidos. No se presume el número futuro del PR: lo deriva la atribución GitHub tras merge. STOP en PR abierto; no se autoriza dispatch/rerun/deploy.

La prueba de proceso del sexto PR detectó truncación local al emitir un payload mayor de 8 KiB y llamar `process.exit(0)` tras `console.log` sobre tubería. La salida canónica se escribe ahora sincrónicamente antes de salir; no cambia el payload ni su hash. La regresión exige salida completa mayor de 8 KiB y parseable. Este hallazgo local no prueba el parser ni la causa del run #17.


## A4b CLOSED release reconciliation — alcance único

Autorización de implementación: Alexander Hernandez, 2026-10-06. Este carril no autoriza producción ni activación; no cambia classifyPath: SPECIAL permanece SPECIAL. Track B conserva su record histórico y verificador.

Anclas A4b: producción b51bbf02fa963489b4f40d33856598faee29a366 / deployment 6884418288 / versión 5a551d76-a041-4878-9989-798087e5bee4. Target de producto sellado f2ef7edddb808b362ee77e6077c0b3971d38ea92 / PR504. Plan rechazado: run 37517576979/1, artifact 11437961392, digest sha256:c324d6c09870428b8861fe04396372e3a45ca05353a87108c611ca9c9928dab0. El record independiente A4B_CLOSED_RECONCILIATION incluye estos valores, los 23 paths exactos y los hashes antes/después de los siete SPECIAL.

Estructura final requerida: exactamente dos commits first-parent desde producción: #504 sellado, seguido por UN merge humano de governance desde codex/a4b-closed-release-reconciliation, con padre exacto f2ef7edd. Su número y finalSourceSha se obtienen de Git/GitHub tras merge; no se predicen. Ambos PRs deben estar fusionados contra main del repo canónico y attributed merged_by id292604102/login losrealesplus. Se rechazan commits directos/ambiguos por el mecanismo existente y branch/fork/autor/paths/hash distintos por el nuevo verificador.

El PR governance debe cambiar exactamente estos cinco archivos: release-reconciliation.mjs, release-reconciliation.spec.mjs y release-plan.mjs bajo scripts/governance; este runbook; diario 2026-10-06-a4b-closed-release-authorization.md. Sus hashes Git reales se vinculan al payload. No se acepta otro delta de runtime, proveedor, SQL/migraciones, writers/RPC, activación, M3/OP08/Extras/menú/catálogo ni workflow. La clasificación sensible se conserva como originalDecision REQUIRES_SEPARATE_AUTHORIZATION; solo el record válido produce AUTHORIZED_RECONCILED_RELEASE para preparación.

Phase1 conserva el payload/ID en el manifest existente; Phase2 rehace la comprobación authoritative main/base/PRs/blobs, revalida payloads y source final y exige identidad de reconciliación idéntica antes de upload. Base avanzada, main superseded, API/evidencia ausente o scope divergente bloquean sin fallback. No hay autorización genérica ni inputs libres para este carril. Contratos de artifact/config/tar y aprobación soberana production-worker siguen intactos.

**CLOSED es un compromiso del release, no una certificación live.** El payload declara liveClosure=UNVERIFIED_REQUIRES_SEPARATE_READ_ONLY_CERTIFICATION. Ninguna parte del mecanismo consulta/escribe flags ni gates del proveedor. Antes de certificar A4B_DEPLOYED_CAPABILITY_CLOSED deben verificarse por lectura el tenant exacto EatClean: orders_custom_capture no enabled y cr_order_private.custom_activation no enabled. Si el acceso autorizado no permite la prueba, STOP A4B_LIVE_CLOSURE_UNVERIFIED; no ampliar grants/credenciales. Gate7 técnico exitoso no reemplaza esta evidencia ni la verificación UX humana.

Secuencia tras revisión: merge humano del PR governance → push automático normal → Phase1 (si el carril coincide) → STOP waiting production-worker → aprobación OOB Alexander → mismo run/publicación exacta/smoke → cierre live read-only separado antes de certificar CLOSED. Esta implementación solo llega a Draft PR: no merge, dispatch/rerun, deploy ni activación. Rollback b51/versión previa son referencias, no autorización de ejecutarlo. Replay después de una nueva base productiva queda rechazado.

### PR Review Report — A4b governance

Reviewer: Codex autoauditoría técnica, no aprobación humana independiente. Base: f2ef7edddb808b362ee77e6077c0b3971d38ea92. Branch: codex/a4b-closed-release-reconciliation. Fecha: 2026-10-06. Categoría: Operational Service (governance, sin cambios de Product Core ni certificación de Flow). Impacto: preparación verificable del release cerrado sin ampliar permisos ni recalificar sensibilidad. Tiempos operacionales: N/A; no se inventan métricas.

Arquitectura/contratos: verificador separado, runtime y clasificador intactos. Tests: ver diario con resultados finales. Riesgo MEDIUM: código de elegibilidad de preparación, protegido por historia/paths/hashes y aprobación soberana independiente. Residuales: confianza en GitHub/metadatos y merge humano del propio governance; API inaccesible bloquea; estado live CLOSED aún no certificado. Android/APK/ADB y UX: N/A a este delta governance. Verdict: READY WITH WARNINGS para revisión humana, sin autoridad de merge/deploy.
