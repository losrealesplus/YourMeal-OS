# FCR Session Log · formato de certificación

**Modo:** Functional Review Mode  
**Uso:** evidencia de cobertura hacia Surface Certified → ORR READY.  
**Metodología:** [OPERATIONAL_READINESS_CERTIFICATION](./OPERATIONAL_READINESS_CERTIFICATION.md)  
**Nivel actual:** 1 · Surface Certification · Pasada 2  
**Siguiente (no aún):** [FLOW_CERTIFICATION](./FLOW_CERTIFICATION.md) · Nivel 2

Leyenda resultado: ✅ verificado · ⚠ hallazgo · ❌ bloqueado · □ pendiente  
**Operación completada:** sí / no / n/a — ¿pudo terminar el trabajo, no solo abrir la UI?  
**Tipo de brecha:** Surface Gap (jornada) · Flow Gap (solo en Nivel 2)

### Surface Status (Nivel 1 · ≠ ORR)

| Superficie | Surface Status |
|------------|----------------|
| Tenant Surface `/admin` | **IN REVIEW** |
| Platform Surface `/saas` | **NOT STARTED** |
| Customer Surface `/app` | **NOT STARTED** |

```text
Surfaces CERTIFIED + Flow Certification PASS + sin P0/P1
        ↓
ORR READY
```

---

## Sesión 1 · 2026-07-26 · Bootstrap Identity

| Pantalla / flujo | Resultado | Evidencia | Acción | Operación completada |
|------------------|-----------|-----------|--------|----------------------|
| Bootstrap selector / banner | ✅ | Identity Source BootstrapIdentityProvider | Ninguna | n/a |
| Centro Operaciones `/admin` (estructura departamentos) | ✅ | Recorrido visual — departamentos | FCR-003 | n/a (estructura) |
| Ajustes `/admin/settings` | ⚠ | Tiles Tenant ≡ perfil con Platform | FCR-001 | no (superficie mezclada) |
| Ops Home / dashboard | ⚠ | Titileo — clase Render Stability | FCR-002 | no (regresión render) |
| Cocina (presencia en nav) | ✅ | Visible como departamento | FCR-004 pending landing | n/a |
| Customer jornada | □ | — | Pasada 2 | □ |
| Kitchen jornada | □ | — | Pasada 2 · FCR-004 | □ |
| Delivery jornada | □ | — | Pasada 2 | □ |
| Support jornada | □ | — | Pasada 2 · FCR-005 | □ |
| Accounting jornada | □ | — | Pasada 2 · FCR-005 | □ |
| Company Admin jornada (Tenant only) | □ | — | RBAC-001 | □ |
| SaaS Admin jornada (Platform) | □ | — | FCR-006 · Entry `/saas` | □ |
| Business vs Platform Branding | □ | — | FCR-001 | □ |

---

## Cómo rellenar

1. Preferir **jornadas** a pantallas sueltas.
2. Pregunta maestra: *¿Puede terminar su jornada laboral solo con YourMeal OS?*
3. Si la UI funciona pero el trabajo no se cierra → **Operación completada = no** → brecha operacional (no «bug menor»).
4. Referenciar IDs del [registro](./FCR_FINDINGS_REGISTER.md) en Acción.
5. Nunca registrar síntoma como causa.

---

## Pasada 2 · siete perfiles · jornadas

**No recorrer pantallas. Recorrer jornadas de trabajo.**  
**No solo camino feliz** — incluir vacío de datos, ya completado, superficie incorrecta.

Pregunta por perfil: *¿Puede este usuario terminar su jornada laboral utilizando únicamente YourMeal OS?*

Si no: **brecha operacional**. Anotar categoría observada (sin SPEC): Acceso · Ejecución · Información · Cierre.

| Perfil | Landing | Navegación | Permisos | Operación completada | Categoría brecha (si no) | Resultado |
|--------|---------|------------|----------|----------------------|--------------------------|-----------|
| Customer | | | | □ | | □ |
| Kitchen | | | | □ | | □ |
| Delivery | | | | □ | | □ |
| Support | | | | □ | | □ |
| Accounting | | | | □ | | □ |
| Company Admin | | | | □ | | □ |
| SaaS Admin | | | | □ | | □ |

### Guías de jornada

| Perfil | Jornada mínima |
|--------|----------------|
| Kitchen | Llego → veo qué cocinar → cambio estados → finalizo → salgo |
| Delivery | Entro → veo rutas → marco entrega → salgo |
| Support | Entro → busco cliente → abro pedido → registro incidencia → salgo |
| Customer | Home → menú → pedido → (historial/favoritos según alcance) |
| Company Admin | Ops home → áreas tenant → ajustes tenant (sin Platform) |
| SaaS Admin | Entry Platform `/saas` → tenants / PO / roles según alcance |
| Accounting | Entry accounting → flujo contable mínimo del alcance |

### Anotación · Operational Journey (modelo futuro, no oficial)

```text
Entry → Workspace → Actions → Completion → Exit
```

Anotar en Evidencia si la jornada encaja; no abrir SPEC/ADR aún.
