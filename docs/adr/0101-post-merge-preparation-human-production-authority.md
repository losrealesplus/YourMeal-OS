# ADR 0101 — Preparación post-merge con autoridad productiva humana

Fecha: 2026-10-04. Estado: Proposed / implementación autorizada para revisión en PR; no autoriza merge ni producción.

## Contexto

Gate 7 exige iniciar manualmente tareas mecánicas después de cada merge. Alexander autorizó automatizar la preparación conservando CR-GOV-02, el environment protegido y el contrato exact-version de #483. Es una decisión de arquitectura operativa; no reabre Foundation/Auth/Identity.

## Decisión

Usar push a main para clasificar el intervalo completo aún no publicado y preparar únicamente cambios elegibles. Separar concurrencia reemplazable de build y concurrencia no cancelable de publicación. Solo la aprobación OOB de Alexander en `production-worker` autoriza el job productivo, con revalidación de identidad y fuente. Registrar una publicación exacta y su smoke por separado; jamás rollback implícito.

El contrato detallado y evidencia tienen una sola fuente: [Gate 7 post-merge](../05-architecture/GATE7_POST_MERGE_AUTOMATION.md). El comportamiento permanente de Codex se incorpora al protocolo de ingeniería existente mediante un pointer breve en AGENTS.

## Consecuencias

Menos dispatch manual para merges normales elegibles, sin convertir merge/CI en permiso productivo. Casos especiales, bases desconocidas y publicaciones parciales bloquean hasta una autorización/reconciliación separada. Este propio cambio privilegiado necesita activación posterior; no incluye bypass. Aceptación remota y producción quedan fuera de la validación local.
