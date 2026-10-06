# CR-ORDER A4b — Implementación para revisión humana

Estado: **A4B_IMPLEMENTATION_COMPLETE_READY_FOR_HUMAN_REVIEW**.

Autoridad: Alexander Hernandez, autorización adjunta de 2026-10-06. Base aprobada y origin/main verificado: `b51bbf02fa963489b4f40d33856598faee29a366`. Rama `codex/cr-order-a4b-custom-capture`; worktree aislado reutilizado `work/a4b-discovery`. No merge, dispatch, despliegue, proveedor ni activación.

## Contexto documental

FOUNDATION, AGENTS, FOPEBA/protocolo, estrategia/filosofía/CTO: consultados. ADR 0007, contratos CR_ORDER_R1 y OFFER_PRICING_R2, implementación A4a y discovery A4b: consultados. El alcance humano fija nombre obligatorio/descripción opcional, individual, custom-only/mixed, identidad nativa, confirmación de cero/repetición y ambas gates CLOSED. Runbooks de ejecución productiva: no aplicables a esta implementación local. La operación que se facilita es registrar peticiones manuales sin contaminar catálogo; la decisión comercial, el merge y la activación siguen siendo humanos.

## Slices implementados

**A4b-1:** borrador discriminado y editor nativo dentro del drawer. Claves locales `draft-custom:<UUID>` no se envían como identidad persistida. Homónimos independientes; precio string decimal explícito, cantidad entera, nombre requerido, descripción opcional, siete fechas de semana, cero confirmado. UNKNOWN no se representa como ausencia de alérgenos; NOT_AVAILABLE no crea receta. El flag de presentación `orders_custom_capture` usa FeatureFlagService con consulta exacta por tenant, sin fallback global, missing/error/loading CLOSED y rol staff + orders.write + individual.

**A4b-2:** adaptador de aplicación y resumen revisable. Pure-custom consume commitCustomOrder. Mixed consume quoteOfferOrder y después commitOfferOrder con quoteId, requestId y comando exactos. Los precios de platos y total del resumen mixto proceden de la quote SSR; etiquetas de platos son presentación. No INSERT/RPC custom en navegador ni writer alternativo. Campos bloqueados durante revisión/envío; no doble-submit. Fallo incierto conserva el request y solo permite reintentar el mismo; rechazos tipados que prueban rollback permiten volver a corregir. Respuesta canónica validada antes de éxito.

**A4b-3:** panel canónico staff en detalle de pedidos v2/custom, edición con UUID y expectedRevision, retirada por omisión al núcleo que archiva, nunca hard-delete. El lector operacional añade solamente write_contract_version existente para conservar el editor correcto aun tras retirar la última custom. No se redirigen órdenes históricas al editor canónico. Repetición usa preview existente, precio custom vacío, provenance y reconfirmaciones actuales de disponibilidad, preparación/intención y precio. No usa execute legacy ni rebaja sus protecciones. Lecturas muestran nombre snapshot y estado custom/UNKNOWN/NOT_AVAILABLE en escritorio y móvil.

**A4b-4:** tests de borrador, transporte, flags, rol/carga SSR, lector v2 y navegador local; scroll/footer preservados. Foco al resumen y tras retirar una línea. Edición de intención invalida confirmaciones de cero/repetición. El camino dish-only conserva su servicio y botones existentes cuando no hay custom.

## Arquitectura y autoridad

Drawer → borrador/validación → adaptador → funciones SSR A4a existentes → verificación de tenant/membresía/rol → gate SQL privada → único núcleo transaccional. La UI no concede autoridad. La flag es presentación: no se toca custom_activation ni se permite global fallback. Company/site/org-unit y override manual de Dish en mixed se rechazan antes de transporte; SQL sigue siendo autoridad. La creación de cliente nuevo forma parte del comando canónico, no de una escritura previa.

No cambios en esquema, contratos backend congelados, RPCs, ACL, writer, writer legacy, guards, commercial.json, M3, OP08, Extras, menú, workflows, Wrangler, entornos/rulesets/secrets. No semillas ni operaciones de apertura de flags.

## Validación exacta

- Vitest completo: **308 archivos / 1935 pruebas PASS**. Incluye A4a, lectura custom, financial quote, writer, regresiones existentes y 47 pruebas nuevas de A4b.
- PostgreSQL aislado local: A3 `cr-order-v2` **19 PASS**, M2 **22 PASS**, A4a **20 PASS**: **61 PASS**, con roles reales del fixture, UUID/archivo/revisión, rollback, mixed y repeat. No URL/key/CLI de proveedor. Se requirió ejecución fuera del sandbox exclusivamente por memoria compartida local.
- Governance gatekeeper/broker: **25 PASS**.
- Typecheck: **PASS**, sin errores.
- Build Nitro/Cloudflare local con Node **20.20.2**: **PASS**, únicamente URL/key públicos ficticios `127.0.0.1:9`; sin credenciales Cloudflare ni secretos de proveedor. No deploy.
- Browser local Chromium: **20 PASS**; flags closed/missing/error/loading/global-only, roles incompatibles, custom-only, mixed quote antes de un solo commit, rechazo de override, precio inválido, UUID/revisión/archivo en request, repeat confirmado, retry exacto, teclado/foco, 320/375/768/1440px y zoom200%. Fixtures/servicios simulados, red bloqueada salvo localhost; no certifican UX productiva ni sustituyen pruebas SQL/SSR.
- Lint de archivos nuevos y servicio de flag: **0 errores / 0 warnings**. Comparación sobre archivos existentes: drawer baseline/current 2/2 errores preexistentes de any; ruta baseline 36 errores/1 warning y actual 34/1; repositorio operacional 0/0. No incremento de deuda en esos archivos.
- Lint global permanece fallando por deuda existente; ejecución registrada: **13206 errores / 44 warnings**. No se presenta como PASS ni se reformatea código ajeno para ocultarlo.
- Doctor unit: **55/57 PASS**, fallan `PASS against example.com probe URL` (conectividad) y `PASS on real repository with soft-android + skip-network` (configuración local del diagnóstico). Fuentes doctor sin modificaciones. No se atribuye certificación de proveedor.
- Preflight estático de cadena: **62 migraciones / 133 políticas**, sin colisiones, PASS. Esto no aplica migraciones.
- git diff --check: PASS. Fixtures de navegador no aparecen en assets productivos.

Las pruebas de performance existentes regeneran su baseline JSON durante Vitest; ese artefacto local se restaura a HEAD y queda fuera del diff.

## Auditoría pre-commit

Diff de migraciones = **0**. Activación/config productiva = **0**. Mutaciones productivas = **0**. M3/OP08/Extras/menú/catálogo = **0**. Writer/RPC/guards legacy = **0**. Gate7/gobernanza/environments/rulesets = **0**. Cambios de dependencias/lockfiles = **0**.

La auditoría compara rutas prohibidas contra la base y revisa los nuevos caminos de escritura. Los tests locales abren gates solo en bases sintéticas aisladas; no cambian el estado productivo. El nuevo campo operacional es SELECT/proyección sobre columna ya existente y se justifica para evitar enviar un pedido v2 al editor legacy cuando sus custom fueron archivadas.

## Archivos del alcance

- src/components/orders/universal-order-intake-drawer.tsx
- src/components/orders/custom-order-item-editor.tsx y .spec.tsx
- src/components/orders/canonical-order-submit.tsx
- src/components/orders/canonical-order-edit-panel.tsx
- src/hooks/use-custom-order-capture.ts y .spec.tsx
- src/modules/orders/domain/custom-order-capture-draft.ts y .spec.ts
- src/modules/orders/application/custom-order-capture-service.ts y .spec.ts
- src/services/feature-flag-service.ts y feature-flag-service.custom.spec.ts
- src/modules/operations/infrastructure/operations-repository.ts y a4b-order-version.spec.ts
- src/routes/_authenticated/admin.orders.tsx
- tests/a4b/{index.html,fixture.tsx,vite.config.mjs,run.mjs,README.md}
- este informe y diario 2026-10-06-cr-order-a4b.md

Los callers de captura en workspace/companies ignoran el argumento de éxito: el tipo unión permite resultado legacy o canónico sin modificar esas rutas. No se reescribe la experiencia paralela admin.order-capture/OrderEditPanel con Dish sintético.

## Riesgos y límites para la revisión

1. Captura custom conserva borrador **local** hasta el commit confirmado; no expone Guardar Borrador persistido v2. El confirmDraft legacy está protegido contra v2. Añadir ese ciclo exige revisar alcance, sin modificar el contrato backend aquí. Dish-only conserva Guardar Borrador.
2. Retry seguro mientras se conserva la sesión UI. Tras resultado incierto se bloquea cerrar/editar y se advierte antes de recargar. Si el usuario fuerza recarga/cierre, se pierde el borrador en memoria: reconciliar en lectura antes de iniciar otro pedido. No se almacenan comandos/PII en localStorage para aparentar recuperación.
3. Quote vencida, cambio de precio/política o revisión se rigen por errores existentes. Un error genérico de resultado incierto no habilita otro request automáticamente. No se inventan códigos backend.
4. B2B, overrides de Dish en mixed, M3 y Extras siguen fuera. Quitar todas las líneas es inválido: no sustituye cancelar pedido.
5. No se hizo E2E productivo ni se abrió ninguna gate. La configuración del proveedor no se recertifica en esta fase. Cambios de rol/tenant siguen sujetos a verificación SSR y SQL en cada envío.

Rollback inicial: no activar; revertir por PR si fuera necesario. Tras custom reales, conservar lectores y snapshots, cerrar nuevas escrituras mediante gate humana separada; no borrar datos ni restaurar NOT NULL.

Siguiente estado esperado: A4B_IMPLEMENTED + CAPABILITY_CLOSED + READY_FOR_HUMAN_PR_REVIEW. Merge, Gate7 y activación requieren autorización distinta. Detenerse tras abrir PR.

## PR Review Report

Branch: `codex/cr-order-a4b-custom-capture`. Base: `main` / b51bbf02fa963489b4f40d33856598faee29a366. Reviewer: Codex, autoauditoría técnica (no revisión humana independiente). Fecha: 2026-10-06. PR: enlazado al abrirlo.

Architecture / Contracts / Tests / TypeScript / Regression / Evidence / Era2 Laws: PASS local. La lectura del editor pasa por fachada de aplicación; las escrituras consumen exclusivamente servicios SSR existentes. Lint: WARN por deuda previa documentada, sin deuda nueva en archivos nuevos. Android build / APK / ADB: N/A, cambio web responsive sin certificación nativa.

Risk: MEDIUM, incorporación de captura/edición financiera detrás de capability cerrada. Findings: límites de borrador local y recuperación tras cierre forzado descritos arriba. Residual warnings: lint global, doctor 55/57 y validación productiva pendiente. Verdict: **READY WITH WARNINGS** para revisión humana, sin autoridad de merge ni activación.

Categoría: Operational Module; consume contratos Core existentes. Impacto esperado: captura de personalizados sin catálogo ficticio y sin reintroducir precios Dish manuales. Tiempo ahorrado: no medido; requiere observación humana tras activación autorizada, no se atribuyen métricas a fixtures locales.
