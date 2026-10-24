# Marcha atrás v1 — intervalo exacto preparado, publicación pendiente

Intención: reconocer únicamente #548, #550 y #549, ya revisados y fusionados, sin reclasificar SPECIAL ni
confundir instalación SQL con publicación del Worker. No cambia producto, SQL, flags, secretos o protecciones.

Baseline publicado: be4f3a6c6bfd9801180488dce7e23337590f28a4, deployment 7258525945,
version 6c4d9331-deb9-4ad7-a324-53f4b1c8bab2. Candidate: 8634cd1a42cc278e1a7419e01e55cbed503a6feb.
El manifiesto release-rollback-v1.json sella los tres merges, padres, HEAD de PR y hashes antes/después de
cada ruta; no se amplían autorizaciones históricas. Exige un único merge posterior de esta rama, con las
rutas de reconciliación exactas. Su SHA futuro y cada hash quedan dentro del scope humano canónico.

Se verifica de nuevo por API el run SQL 40089701179, primer intento exitoso desde c64300ce, aprobación
production-db del propietario y artefacto 12558233788, con digest y bytes del reporte INSTALLED_AND_VERIFIED.
La recepción no autoriza otras migraciones ni ejecuta SQL. Artefacto ausente/expirado o divergencia bloquean.

Se reutiliza mode=exact_interval, pero un validador específico comprueba exclusivamente este intervalo;
no usa el scope histórico de #506–513. Push/normal sigue REQUIRES_SEPARATE_AUTHORIZATION. Tras un merge
humano independiente, `node scripts/governance/release-plan.mjs --rollback-v1-payload` solo propone en lectura
el scope y authorizationId para revisión; no despacha ni aprueba nada. Preparación futura exige dispatch
nuevo del propietario y coincidencia canónica exacta de SHA/PRs/scope; publicación requiere otra aprobación
de production-worker y conserva digests y comprobaciones Phase 1/2 existentes. Sin activación del flag.

## Validación y límites

Pruebas positivas y negativas de linaje, contenido, autoridad, receipt y manifest; se ejecutan también las
regresiones existentes de release: 349 tests PASS. Baseline, linaje y recibo real se verifican por lectura
con el nuevo recolector: PASS. Se adapta la fixture de release-json para copiar el nuevo módulo.
El workflow solo añade la nueva suite al paso de validación existente; no cambia triggers ni job protegido.

STAGING_BLOCKED: la URL eatclean-staging.yourmealos.com responde HTTP 200 y su bundle público referencia
`djangucecsphnejplvic` (proyecto compartido YourMeal-OS), no un backend acreditado con fixtures sintéticas.
El archivo versionado wrangler.staging.json aún declara STAGING_UNCONFIGURED: hay divergencia entre código
y web existente. GitHub devuelve cero deployments staging-worker y metadatos de variables HTTP 403;
Supabase EatClean solo lista main, no una rama aislada de staging. La consulta exclusivamente de lectura
al proyecto compartido para verificar RPC/counts falla con 28P01 de autenticación del conector; no se
obtienen filas ni se infiere ausencia del RPC. El laboratorio local anterior fue descartado y no corre.
Se necesita identificar y acreditar el backend/tenant de staging aislado y datos sintéticos, con acceso
válido para verificar RPC/auditoría, antes de usar el navegador. No se reutilizan pedidos compartidos ni
productivos; los cuatro flujos quedan BLOCKED, no FAIL ni PASS. No se modifican credenciales.

## Decisión pendiente

Revisar este PR sin merge ni ejecución. Resolver staging antes de considerar publicación/activación.
La reconciliación no otorga aprobación productiva ni activa VITE_OPERATIONAL_ROLLBACK_ENABLED.
