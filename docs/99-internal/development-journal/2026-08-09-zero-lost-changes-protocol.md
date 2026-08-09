# Zero Lost Changes — Source of Truth & Change Persistence

Fecha: 2026-08-09
Versión: n/a (regla de trabajo en `AGENTS.md`)
Módulo: Metodología / Gobierno de agentes
Estado: Accepted (documentación)

---

## ¿Qué es?

Protocolo permanente en `AGENTS.md` que fija el Mac local como fuente física de verdad para device validation, y obliga a cerrar cada unidad de trabajo con revisión de diff → commit → push → PR (sin merge automático a `main`).

## ¿Cómo es?

Niveles: Autosave local → Checkpoint al cerrar unidad → PR → Merge humano → Device build solo desde commit identificable (Git SHA + artifact SHA256).

Cloud / worktrees / Background Agents son trabajadores aislados; el puente es GitHub. Nada se considera device-ready si solo existe en VM, artifact remoto o conversación.

## ¿Por qué existe?

Incidente Customer Forensic 002: instrumentación en cloud/working tree sin commit → Mac construyó otro APK → SHA distinto → horas perdidas persiguiendo el artefacto correcto. Si no está en Git, no existe para la cadena.

## ¿Para qué sirve?

Evitar pérdida de cambios, APKs no trazables y desincronización LOCAL ↔ CLOUD antes de validar en OPPO / iPhone. Preservar Observation → Evidence → Decision → Implementation → Validation → Review → PR → Certification.

## Objetivos

- Cero cambios importantes solo en working tree al cerrar una unidad.
- Mismo commit trazable en Android e iOS cuando se compare comportamiento.
- Merge a `main` siempre decisión explícita.

## Reglas

Ver sección **SOURCE OF TRUTH & CHANGE PERSISTENCE** en [`AGENTS.md`](../../../AGENTS.md).

## Dependencias

- Git / GitHub como puente LOCAL ↔ CLOUD
- [PR_CHANGE_LEVELS](../../22-implementation/PR_CHANGE_LEVELS.md)

## Futuro

Aplicar en la siguiente unidad Customer Forensic 002 (branch + commit + rebuild APK desde SHA) y en la cadena iPhone.

## Decisiones tomadas

- Sí a checkpoint automático al **cerrar** unidad (con revisión de diff).
- No a commit/push en cada edición parcial.
- Documentación en `AGENTS.md` primero; sin cambio de código de producto en este hito.
