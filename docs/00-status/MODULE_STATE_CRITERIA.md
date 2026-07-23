# Criterios de Estado de Módulo

Escala objetiva para clasificar cada módulo/Capability de YourMeal OS.
Aplica a informes de sprint, PRs y actualizaciones de roadmap.
**Sin interpretación:** si no se cumplen todos los criterios de un estado, el módulo permanece en el anterior.

## Escala

| Estado | Criterio objetivo |
|--------|-------------------|
| **Scaffold** | UI construida con datos mock. Sin conexión a infraestructura real. Navegación y layout presentes. |
| **Connected** | UI conectada a infraestructura real (Supabase, Services, Auth, i18n, useFmt, auditService, featureFlagService). Lectura real. La lógica de negocio puede estar incompleta. |
| **Operational** | Happy Path funcional de extremo a extremo. Mutaciones reales persistidas. Auditoría emitida. Multi-tenant respetado. Errores y estados vacíos gestionados. |
| **Field Validated** | Evidencia FOV suficiente: uso real en EatClean documentado en Mission Brief con métricas, incidencias registradas y aprendizajes incorporados. |

## Checklist por transición

### Scaffold → Connected
- [ ] Datos provienen de Supabase / Service real (no `mock-*`)
- [ ] `useAuth()` / tenant activo respetado en queries
- [ ] Textos vía `useTranslation` (6 idiomas)
- [ ] Formatos vía `useFmt()`
- [ ] Sin lógica de negocio nueva fuera de Services existentes

### Connected → Operational
- [ ] Happy Path completo (crear, leer, actualizar, cerrar el flujo)
- [ ] Escrituras persistidas con RLS multi-tenant
- [ ] `auditService` emite Who/What/When/Old/New/Tenant en cada mutación
- [ ] Soft delete respetado (`archive` / `restore`)
- [ ] Estados: loading, empty, error, offline cubiertos
- [ ] Accesibilidad mínima (foco, aria, contraste)

### Operational → Field Validated
- [ ] Uso real registrado en Mission Brief FOV
- [ ] Métricas capturadas (frecuencia, éxito, latencia percibida)
- [ ] Incidencias catalogadas y priorizadas
- [ ] Aprendizajes reflejados en OM o ADR si procede

## Uso en informes de sprint

Cada informe de módulo cierra con:

```
Estado: <anterior> → <nuevo>
Criterio cumplido: <lista de checks verificados>
```

Si un check falla, el módulo no cambia de estado. No hay estados intermedios.
