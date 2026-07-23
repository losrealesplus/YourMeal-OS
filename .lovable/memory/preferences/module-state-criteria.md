---
name: Module state criteria
description: Objective checklist to transition modules between Scaffold, Connected, Operational, Field Validated
type: preference
---
Estados de módulo con criterios objetivos (no interpretativos):
- **Scaffold**: UI con mocks
- **Connected**: UI conectada a infraestructura real (Supabase/Services/auth/i18n/useFmt), lógica puede estar incompleta
- **Operational**: Happy Path E2E funcional, mutaciones reales persistidas, auditoría emitida, multi-tenant respetado, estados vacío/error/offline cubiertos
- **Field Validated**: evidencia FOV suficiente documentada en Mission Brief con métricas e incidencias

**How to apply:** cada informe de sprint cierra con `Estado: X → Y` + checks verificados. Si algún check del checklist falla, el módulo no cambia de estado. Sin estados intermedios. Detalle completo en `docs/00-status/MODULE_STATE_CRITERIA.md`.
