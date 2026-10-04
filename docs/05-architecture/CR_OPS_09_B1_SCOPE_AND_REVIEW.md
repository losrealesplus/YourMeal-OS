# CR_OPS_09_B1 — Fechas civiles visibles en Captura Universal

OBJECTIVE: Fechas civiles visibles en Captura Universal.
CURRENT STATE: main 752234f406366bdf2fcec18750092b6f0fd44039, base independiente.
CLASSIFICATION: Bug Fix / semántica de presentación.
AUTHORIZED NOW: implementación, tests, commit, push de rama y PR; autorización humana adjunta del 04/10/2026.
NOT AUTHORIZED: merge, Gate 7, dispatch, deploy, producción, migraciones, OAuth, B2 o Responsive Clientes.
PLAN: trazar → implementar mínimo → validar → red team → PR.
STOP CONDITION: PR OPEN / READY FOR HUMAN REVIEW.

# DOCUMENT CONTEXT CHECK
FOUNDATION y AGENTS: CONSULTED. Estrategia, Filosofía y CTO: CONSULTED. ENGINEERING_OPERATING_PROTOCOL y ADR de review: CONSULTED. Contratos relevantes: fechas/Weekly Menu/Orders en B1; Dish/allergens y operaciones en DIET. Provider runbooks: N/A, sin ejecución de proveedor. Discovery y contrato humano: ACCEPTED. No se reabre Foundation.

## Contrato autorizado
B1 únicamente: weekday + fecha civil + cantidad independiente. Horizonte futuro N/N+1 y un pedido por semana son decisiones humanas; este PR no implementa B2 ni modifica DTO, persistencia o selección.

## Archivos esperados
Drawer y sus pruebas; pruebas de week-dates. El formatter canónico no cambia.

## Validación
PASS: 23 pruebas dirigidas, typecheck, governance y build Nitro; git diff --check. PASS visual local: 1440/1280/1024/768/390, siete fechas sin desbordamiento nuevo; teclado ArrowRight selecciona martes; siguiente semana muestra 5–11 oct; texto de fechas duplicado a 390 conserva espacio y scroll nativo. Pruebas incluyen lunes/domingo, mes/año y misma fecha civil con TZ Canarias.
FAIL — PRE-EXISTING: lint del drawer/test conserva 12 diagnósticos contra 15 de la base; cero nuevos.
NOT TESTED: certificación en producción/Safari y zoom nativo real; expansión local de texto no equivale a certificar zoom de navegador.

## Red team / límites
No reutiliza dash/cantidad para fecha; no cambia handlers, queries, sumas ni submit. Aria-label incluye weekday, día, mes, año y cantidad. Formatter numérico UTC evita parse ambiguo. No se toca el defecto #485 ni se añade un pedido multi-semana. Riesgo bajo, añade altura a tabs; comprobado scroll móvil.

## Valor operativo
Evita consultar otra vista para saber la fecha del día seleccionado. Ahorro esperado, no cronometrado; medición futura por captura real. No inventar segundos.

## Estado de revisión
READY FOR HUMAN REVIEW. No merge ni despliegue autorizados.

## PR REVIEW REPORT
Base: 752234f406366bdf2fcec18750092b6f0fd44039. Reviewer: Codex. Fecha: 2026-10-04.
Arquitectura/contratos/tests/TypeScript/governance/build: PASS. Lint: WARN (preexistente, cero nuevos). Android/APK/ADB: N/A, no se certifica dispositivo. Regresión: PASS local; producción NOT TESTED. Evidencias: fixture local, no observación de pedidos reales. Laws: consumo Core, no redefine autoridad; tiempo ahorrado no medido. Riesgo: LOW en B1, MEDIUM de presentación transversal en DIET.
Veredicto técnico: READY WITH WARNINGS. Estado autorizado: READY FOR HUMAN REVIEW; no recomendación de merge/despliegue automático.

![Evidencia local a 390 px](evidence/CR_OPS_09_B1_390.jpg)

Cantidad local: añadir una ración mantiene “Lun / 28 sep / 1” y aria-label “Lunes, 28 sep 2026; 1 ración”. Sin guardar el pedido. Canarias: 12 pruebas de fechas PASS con TZ=Atlantic/Canary.
