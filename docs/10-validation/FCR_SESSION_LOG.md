# FCR Session Log · formato de certificación

**Modo:** Functional Review Mode  
**Uso:** una fila por pantalla / flujo recorrido. Demuestra qué está verificado para ORR.  
**Metodología:** [OPERATIONAL_READINESS_CERTIFICATION](./OPERATIONAL_READINESS_CERTIFICATION.md) · Surface Certified

Leyenda resultado: ✅ verificado · ⚠ hallazgo · ❌ bloqueado · □ pendiente

### Estado de superficies (ORR-prep)

| Superficie | Estado |
|------------|--------|
| Tenant Surface `/admin` | **IN REVIEW** |
| Platform Surface `/saas` | **NOT STARTED** |
| Customer Surface `/app` | **NOT STARTED** |

---

## Sesión 1 · 2026-07-26 · Bootstrap Identity

| Pantalla / flujo | Resultado | Evidencia | Acción |
|------------------|-----------|-----------|--------|
| Bootstrap selector / banner | ✅ | Captura — Identity Source BootstrapIdentityProvider | Ninguna |
| Centro Operaciones `/admin` (estructura departamentos) | ✅ | Recorrido visual — Cocina, Reparto, Atención, Comercial | FCR-003 validado |
| Ajustes `/admin/settings` | ⚠ | Company Admin tiles ≡ SaaS Admin (Marca, Comercial, Clientes, Soporte, Usuarios, Auditoría) | FCR-001 · Tenant vs Platform Surface |
| Ops Home / dashboard | ⚠ | Titileo / parpadeo al navegar | FCR-002 · Render Stability Regression |
| Cocina (presencia en nav / área) | ✅ | Visible en Ops como departamento | Ninguna (landing Kitchen = FCR-004) |
| Customer Home / Menú / Pedido / Historial / Favoritos | □ | — | Recorrer perfil Customer |
| Kitchen landing → workspace | □ | — | FCR-004 · Workspace Entry Policy |
| Delivery `/admin/delivery` | □ | — | Recorrer + Entry Policy |
| Support `/admin/support` | □ | — | FCR-005 |
| Accounting `/admin/accounting` | □ | — | FCR-005 |
| Company Admin — sin acceso Platform (`/saas`) | □ | — | Confirmar RBAC-001 |
| Platform Surface `/saas` (Tenants, PO, Roles, Audit, Flags) | □ | — | Recorrer perfil SaaS Admin |
| Business Branding vs Platform Branding | □ | — | Separar conceptos en FCR-001 |

---

## Cómo rellenar

1. Un perfil Bootstrap por bloque de filas (anotar perfil en Evidencia).
2. No mezclar severidades en «Acción» — referenciar ID del [registro](./FCR_FINDINGS_REGISTER.md).
3. ✅ solo si el recorrido operativo del flujo se completó (no solo «se ve el menú»).
4. Al cerrar ORR: este log + registro de hallazgos = evidencia de cobertura.

---

## Pasada 2 · siete perfiles

Evaluación **operacional** (no solo visual). Metodología: [ORC](./OPERATIONAL_READINESS_CERTIFICATION.md).

| Perfil | Landing | Navegación | Permisos | Resultado |
|--------|---------|------------|----------|-----------|
| Customer | | | | □ |
| Kitchen | | | | □ |
| Delivery | | | | □ |
| Support | | | | □ |
| Accounting | | | | □ |
| Company Admin | | | | □ |
| SaaS Admin | | | | □ |

Al cerrar cada perfil: actualizar filas de Sesión 1 / nuevas filas con evidencia, IDs FCR, y el estado de superficie (CERTIFIED solo si cumple criterios Surface Certified).

### Anotación (no SPEC) · Operational Journey

Cuando un perfil se recorra end-to-end, anotar en Evidencia el **recorrido operativo** (p. ej. Kitchen: Workspace → Producción → lote → Packaging). No abrir documento de política hasta que Entry Policy esté estable.
