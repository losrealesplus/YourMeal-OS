# Marcha atrás v1 — activación compilada preparada, no ejecutada

Decisión humana: preparar un único PR, sin merge, dispatch, SQL ni despliegue. Baseline be4f3a6c y
fuente previa f3d41db6. Conserva #548/#550/#549 y añade #551 con padre, HEAD y hashes reales anteriores.
El siguiente y único merge debe proceder de codex/rollback-build-activation, con seis rutas exactas;
PR/HEAD/SHA final/hashes se obtendrán por GitHub y Git después de un eventual merge humano.

Se reutiliza el resolver existente, con identidad ROLLBACK_V1_ACTIVATION_PREPARATION distinta. La
restricción rollbackFlagActivationAuthorized=true expresa la propuesta que el futuro dispatch deberá
revisar; productionWorkerApprovalGranted=false permanece. No es aprobación de despliegue. El recibo
INSTALLED_AND_VERIFIED de 40089701179 permanece idéntico y se revalida en lectura. Scope b29b13a6…
y sus cuatro PR no sirven para este intervalo ampliado de cinco merges; no se inventa un ID final ahora.

El plan solo emite rollback_enabled=true tras reconciliación exacta autorizada y manual del nuevo scope.
Build exactly once usa ese booleano y vuelve a exigir workflow_dispatch; cualquier otro valor/contexto
compila false. No añade una variable runtime, un nuevo input genérico ni una lista abierta de confianza.
El payload de activación y los hashes del workflow se conservan dentro del manifiesto inmutable actual;
se mantienen digests, revalidación Phase1/2, clasificación SPECIAL y aprobación production-worker.

Pruebas: contexto no autorizado/ambiguo, push, scope/ID anterior, SHA/hash alterados, PR adicional,
procedencia de los cuatro merges, recibo SQL y manifiesto. Vite compila valores calculados false/true en
navegador y SSR, que ignoran el valor runtime contrario. 353 regresiones de release PASS (29 focalizadas) y TypeScript PASS.
No cambia src; los cuatro flujos y 16 casos E2E locales previos conservan el mismo código de aplicación.
Los builds locales completos false/true anteriores corresponden a la misma fuente de aplicación.

Próxima frontera: revisión/merge humano de este PR; regenerar scope y authorization_id desde main exacto
resultante; solicitar después ejecución y aprobación productiva independientes. Producción sigue desactivada.
