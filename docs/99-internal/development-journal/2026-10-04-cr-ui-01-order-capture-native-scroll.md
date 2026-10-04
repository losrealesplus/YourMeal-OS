# CR-UI-01 — Captura Universal: scroll vertical nativo

Fecha: 2026-10-04
Versión: corrección local sobre dd7b25a1 (#484)
Módulo: Captura Universal de Pedido
Estado: LOCAL VERIFIED · CI PENDING · SAFARI PRODUCTION VERIFICATION PENDING · revisión humana pendiente

## ¿Qué es?
Corrección del recorte horizontal del drawer. Disponible ~767 px frente a ~859 px de contenido en producción.

## ¿Cómo es?
Se sustituye exclusivamente ScrollArea en UniversalOrderIntakeDrawer por un div `min-h-0 min-w-0 flex-1 overflow-y-auto`. No se cambia Sheet, ScrollArea global, shell, breakpoints, handlers ni infraestructura. Se elimina el import no usado. El nuevo test SSR no simula ScrollArea y comprueba que no reaparece su wrapper intrínseco.

## ¿Por qué existe?
Radix generaba `display:table; min-width:100%`; el cálculo intrínseco ensanchaba el contenido y overflow-x hidden lo recortaba. La región nativa impone el ancho disponible sin reducir tipografía/zoom ni esconder overflow horizontal.

## ¿Para qué sirve?
Permite al personal ver y usar cliente, contexto, días, cantidades y acciones sin controles recortados; mejora directamente la captura operativa.

## Objetivos
Contenido y documento sin overflow horizontal; scroll vertical real; mantener semántica modal y lógica existente.

## Reglas
Implementación, validación y PR solamente. Sin merge, Gate 7, dispatch, deploy, pedidos reales, React #418, proveedores ni modificaciones de #483/#484.

## Dependencias
Sheet/Dialog actual y estilos actuales. Harness local React con auth/menú/cliente sintéticos, sin acceso a backend y servicio de guardado deshabilitado. No se usa el runner E2E de certificación en vivo para un cambio local.

## Futuro
Certificación Safari nativo en producción por el propietario después del proceso de revisión/despliegue autorizado por separado. No se declara Safari VERIFIED.

## Decisiones tomadas y contexto documental
FOUNDATION, AGENTS, contexto estratégico, filosofía, contexto CTO y protocolo operativo consultados. Contrato aplicable: autorización humana CR-UI-01 y CR_OPS_05_SCOPE_LOCK. ADR estructural nuevo: N/A, se conserva arquitectura. Runbooks de proveedores: N/A, sin ejecución externa. Se añade esta ficha por el registro obligatorio del Diario, además del componente y su test; ningún archivo de infraestructura se modifica.

## Evidencia local
- 1920×900: documento 1920/1920; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 1728×900: documento 1728/1728; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 1512×900: documento 1512/1512; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 1440×900: documento 1440/1440; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 1366×900: documento 1366/1366; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 1280×900: documento 1280/1280; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 1024×900: documento 1024/1024; Sheet 767/767; contenido 767/767; altura 722/1303; controles fuera: 0.
- 768×900: documento 768/768; Sheet 671/671; contenido 671/671; altura 722/1303; controles fuera: 0.

A 1440: producción antes 767/859; React local sintético antes 767/848 (texto/datos/font loading diferentes); mismo React local después 767/767. No se presentan los dos before como mediciones de idéntico fixture. Las ocho medidas después usan el componente React real editado, nueve platos y un nombre largo.

Scroll: scrollHeight 1303 > clientHeight 722; al enfocar notas y avanzar con Tab, scrollTop 651.5. Focus queda en Guardar Borrador; Shift+Tab desde Close lleva a Guardar y Confirmar dentro del modal. Escape cierra y devuelve foco al botón Abrir captura local. Cambio Existente/Nuevo y cantidad 0→1 mantienen 767/767; total cambia a 1 ración/11.90 €. No se pulsa guardar. Capturas locales before/after conservadas en el entregable del chat.

## Quality gates y revisión adversarial
- Typecheck: PASS.
- Build: PASS (Nitro local, no deploy).
- Vitest completo: 273 archivos / 1526 tests PASS.
- Test específico: 5/5 PASS.
- Governance: 25/25 PASS, sin invocar gatekeeper/broker para una ejecución.
- npm test agregado: NO PASS; doctor tiene 55/57. Fallan probe example.com y doctor real por contrato de entorno local; missing VITE_SUPABASE_PUBLISHABLE_KEY observado en el diagnóstico. No se crean ni modifican secrets para forzar PASS.
- Ambos tests del doctor fallan también en un worktree limpio de origin/main, dd7b25a1; comparación ejecutada sin modificar main ni el contrato de entorno.
- Lint de ambos archivos: NO PASS. Main ya tiene 16 errores (13 any + 3 formato); cambio tiene 15 (12 any + 3 formato), sin errores nuevos. No se amplía alcance para arreglar deuda previa de tipos/formato.
- git diff --check: PASS.
- Revisión adversarial local: borde derecho de Sheet/contenido y controles en ocho anchos, nombre largo, nueve filas, cliente nuevo, cantidad/total, scroll al foco, cierre/foco modal. Sin hallazgos nuevos P0/P1 en este diff. Los fallos de entorno/lint se declaran, no se ocultan.

El test persistente protege la estructura que originó la regresión; Vitest SSR no calcula layout. La matriz geométrica procede de navegador integrado contra un harness React local, no de jsdom ni de Safari. No existe una suite visual de componentes aislados configurada; los drivers Playwright presentes corresponden a certificación de flujos live. No se amplía esa infraestructura en este PR.

## Riesgos residuales
Scrollbar nativo con apariencia dependiente del sistema. Pendiente Safari nativo, nombres arbitrarios/B2B complejos, mobile <768 y zoom accesible 200% (fuera de la matriz obligatoria de esta entrega). Sin cambios a guardado, auth o queries. CI debe revisarse por humano antes del merge; no se declara CI VERIFIED mientras no termine.
