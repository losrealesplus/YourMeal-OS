# P34 — Remediación de seguridad P2.1 / integración UI

## Alcance autorizado

PR #513 conserva base apilada P34.1. Nuevo commit de UI corrige únicamente borradores/revisión y expone la recuperación auditada autorizada. No merge de PR, deploy, proveedor, OAuth, A5/A4b ni cambio de contrato. La integración de la rama #512 es un merge ordinario que preserva historia.

## P2.1

El editor de perfil captura customer ID, revisión y sesión al abrir. El editor de direcciones captura esos valores al abrir una edición o comenzar el nuevo borrador. Refetch no cambia ese snapshot. Los comandos usan la revisión original; cambio de tenant/actor/customer bloquea el envío. STALE_REVISION conserva los campos y bloquea un segundo guardado hasta descartar explícitamente el borrador y volver a editar con los datos actuales. No hay rebase automático de formulario ni force-enable. La selección de sustituta permanece bloqueada mientras termina la operación previa.

## Recuperación P2.3

Tras STALE_REVISION al confirmar una asociación, la UI permite cerrar explícitamente esa solicitud. SQL vuelve a verificar el conflicto y al propietario. Después el usuario debe solicitar otra y personal debe verificarla nuevamente; jamás se copia la aprobación. Resultado incierto mantiene la sesión original y reconciliación/exact retry existentes.

## Evidencia local

17 escenarios browser/SQL PASS: refetch concurrente del CRM durante perfil y dirección (borrador preservado, writer rechaza, CRM concurrente intacto, descarte explícito); A→B invalida verificación; cierre conflictivo libera una nueva solicitud unapproved; nueva doble confirmación; archivado con sustituta; pérdida de respuesta sin segundo write.

50 SQL/RLS PASS, incluyendo replay/cross-tenant con membresía válida/races/auditoría única; 405 CRM/orders PASS; 25 governance PASS; typecheck, lint del alcance, builds de ambas ramas PASS. CLI start/reset/ledger local: 67/67. Migración nueva documentada en `P34_SECURITY_BACKEND_REMEDIATION.md`.

Harness local con actores sintéticos y PostgreSQL Docker sin red; no certifica OAuth/JWT/provider ni UX visual productiva. Logs y JSON exactos en reports/eatclean-sprint-02 fuera de los commits de producto. CI remoto se registra tras publicación.

## Pendiente

Nueva revisión independiente de seguridad + decisión humana antes de merge. OAuth bloqueado por auto-aprobación legacy. Ninguna migración de proveedor autorizada. A5 HARD_DISABLED, sin activación A4b.
