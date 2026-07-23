# PR Technical Checklist — Capability (desde CAP-003)

Obligatorio al cerrar cada PR de Capability.

## Checklist técnico

- [ ] TypeScript (`npx tsc --noEmit`) limpio  
- [ ] Tests existentes pasan (`npm test`)  
- [ ] Sin warnings nuevos relevantes  
- [ ] Sin deuda técnica introducida a propósito  
- [ ] Sin cambios de UX  
- [ ] Sin cambios de navegación  
- [ ] Sin nuevas reglas operacionales  
- [ ] Sin nuevos Core Objects  
- [ ] Trazabilidad OM documentada (CAP doc · pre/postcondiciones)  
- [ ] Indicadores Mock / Real / Happy Path actualizados en backlog  

## Si hay mutaciones (CAP-004+)

- [ ] Persistencia Supabase verificada  
- [ ] `audit_log` escrito donde el OM lo exige  
- [ ] `tenantId` aislado  
- [ ] RBAC / capabilities respetadas  
- [ ] Feature flags respetadas (si aplica)  

## Anti-patrón

Prohibido «ya que estamos…» (filtros, rediseño, dashboard, etc.).

Ver [PR_CHANGE_LEVELS](./PR_CHANGE_LEVELS.md) · [CAPABILITY_CONNECTION_PATTERN](./CAPABILITY_CONNECTION_PATTERN.md).
