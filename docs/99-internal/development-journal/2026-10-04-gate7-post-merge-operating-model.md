# Preparación automática de Gate 7 y modelo operativo Codex

Fecha: 2026-10-04. Versión: 1. Módulo: ingeniería/gobierno. Estado: LOCAL_VERIFIED; cierre en PR para revisión humana.

## ¿Qué es?

Automatización de preparación posterior al merge, manteniendo aprobación soberana productiva.

## ¿Cómo es?

Clasificación conservadora del intervalo pendiente, artifact exacto con digest externo, publicador protegido con versión exacta, ledger y smoke estático. Contrato y evidencia: [Gate 7 post-merge](../../05-architecture/GATE7_POST_MERGE_AUTOMATION.md).

## ¿Por qué existe?

Alexander pidió reducir pasos mecánicos y mantener una forma predecible de trabajar con Codex, sin conceder autoridad de producción a agentes o CI.

## ¿Para qué sirve?

Un merge normal elegible prepara Gate 7; Alexander interviene en la aprobación protegida y verificación humana pertinente.

## Objetivos

Build Once → Deploy Exactly That; no ocultar cambios sensibles; evidencia de publicación distinta de evidencia UX.

## Reglas

Autonomía dentro del alcance; parada después del PR. Sin merge, dispatch, Gate 7 real, mutaciones proveedor ni rollback automático. #486/#487 no dependen de esta automatización.

## Dependencias

Contrato previo de #483, GitHub environment existente, APIs de lectura, Node 20 y Wrangler 4.86. Modelo Codex canónico en ENGINEERING_OPERATING_PROTOCOL, referenciado por AGENTS.

## Futuro

Revisión humana; activación privilegiada separada y validación remota cuando se autoricen. La deuda de lint previa se comunica, no se mezcla con este cambio.

## Decisiones tomadas

ADR 0101. La cola protegida no cancela publicaciones por nuevos merges; un SHA obsoleto no reutiliza otro artifact. El NDJSON 4.86 no demuestra tráfico por sí solo; el futuro publicador hará read-back de deployment. Si smoke falla después de publicar, se conserva DEPLOYED y se exige juicio humano. Este propio PR es SPECIAL y no se autoautoriza.
