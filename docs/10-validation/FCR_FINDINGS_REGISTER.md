# Functional Completeness Review · Findings Register

**Modo:** Functional Review Mode (Bootstrap / Development Identity Adapter)  
**Identity source:** `BootstrapIdentityProvider`  
**Auth producción:** **NO** certificada en esta pasada  
**Metodología:** certificar el sistema → corregir por dominios. No «arreglar lo que encuentro».  
**Cadena:** RI → KC → SPEC → **[Construcción]** → FCR → ORR → RELEASE (FCR/ORR = certificación, no construcción).

| Artefacto | Uso |
|-----------|-----|
| [OPERATIONAL_READINESS_CERTIFICATION](./OPERATIONAL_READINESS_CERTIFICATION.md) | Niveles Surface + Flow · ORR READY |
| [FCR_SESSION_LOG](./FCR_SESSION_LOG.md) | Evidencia Nivel 1 · Pasada 2 |
| [FLOW_CERTIFICATION](./FLOW_CERTIFICATION.md) | Nivel 2 · plantilla (vacía hasta superficies CERTIFIED) |
| [RBAC_MATRIX_V1](./RBAC_MATRIX_V1.md) | Autorización por superficie |
| [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) | Dónde empieza cada rol (≠ RBAC; candidato ADR) |
| [FCR002](./FCR002_FLICKER_INVESTIGATION.md) | Render Stability Regression |
| [platform-stabilization/](./platform-stabilization/PLATFORM_STABILIZATION_REPORT.md) | Platform Stabilization v1 · Pre-Flow |
| [BOOTSTRAP_FCR_CHECKLIST](./BOOTSTRAP_FCR_CHECKLIST.md) | Checklist 7 perfiles |

**Regla de evidencia:** nunca registrar un síntoma como si fuera la causa.  
**Pasada 2 (Nivel 1):** jornadas → si no → **Surface Gap** / brecha operacional.  
**Después:** flujos A/B/C → **Flow Gap** si el traspaso falla.  
**Categorías a observar** (sin SPEC): Acceso · Ejecución · Información · Cierre. Escenarios límite.

---

## Dos ejes (no mezclar)

| Eje | Pregunta | Artefacto |
|-----|----------|-----------|
| **Autorización** | ¿Qué puede hacer? | RBAC · capabilities · guards |
| **Landing** | ¿Dónde empieza a trabajar? | Workspace Entry Policy |

| Superficie | Ruta raíz | Quién administra |
|------------|-----------|------------------|
| **Tenant Surface** | `/admin` | Responsable del tenant (p. ej. EatClean) |
| **Platform Surface** | `/saas` | Plataforma YourMeal OS |
| **Customer Surface** | `/app` | Cliente final |

El problema de FCR-001 no es «el usuario Company vs SaaS».  
Es **qué superficie** está administrando cada menú.

---

## Severidad

| | |
|--|--|
| **P0** | Bloquea la operación |
| **P1** | Existe / accesible pero incorrecto o incompleto |
| **P2** | UX / fricción operacional |
| **P3** | Visual / detalle |

---

## Registro

| ID | Hallazgo | Severidad | Tema | Estado | Notas |
|----|----------|-----------|------|--------|-------|
| **FCR-001** | Ajustes de Tenant Surface muestran el mismo hub para quien también opera Platform — separación insuficiente Tenant vs Platform Surface | **P1** | Superficies | ✅ **CERTIFIED** (EP-OPS-002) | Hub = Tenant business settings; Platform = `/saas`. [RBAC_SURFACE_CERTIFICATION](./RBAC_SURFACE_CERTIFICATION.md) |
| **FCR-002** | **Render Stability Regression** (síntoma: titileo/parpadeo en Ops) | **P1** | Render stability | ✅ **CLOSED** (PS-001 PASS) | Fix #99 + gate [PS-001](./platform-stabilization/PS-001.md) · acta [COMPLETE](./platform-stabilization/PLATFORM_STABILIZATION_COMPLETE.md) |
| **FCR-003** | Superficie Ops (departamentos) validada visualmente | ✅ | Producto | Validado | Experiencia operacional coherente |
| **FCR-004** | Workspace Entry Kitchen: esperado `/admin/kitchen-execution`; código → `/admin/kitchen` | **P2** | Workspace Entry | ✅ **CERTIFIED** (EP-OPS-002) | Canónico = `/admin/kitchen`; execution = pantalla secundaria |
| **FCR-005** | Workspace Entry Support / Accounting → hoy `/admin` | **P2** | Workspace Entry | ✅ **CERTIFIED** (EP-OPS-002) | `/admin/support` · `/admin/accounting` |
| **FCR-006** | SaaS Admin Bootstrap aterriza en Tenant Surface (`/admin`); política Entry → `/saas` | ⚠ | Workspace Entry | ✅ **CERTIFIED** (EP-OPS-002) | Puro `saas_admin` → `/saas`; híbrido → tenant-first `/admin` |

---

## RBAC-001 · Tenant Surface ⊄ Platform Surface

```text
/admin  →  Tenant Surface
/saas   →  Platform Surface
```

| Dominio | Tenant Surface | Platform Surface |
|---------|----------------|------------------|
| Business Branding (logo/colores/nombre del tenant) | ✅ | — |
| Platform Branding (YourMeal OS / white-label global) | ❌ | ✅ |
| Tenants · Licencias · Platform Owners · flags globales | ❌ | ✅ |
| Cocina · Reparto · Clientes · Usuarios tenant · Producción | ✅ | ❌ (salvo tools de plataforma distintos) |

Roles mapean a superficies; **no** al revés.  
SaaS Admin puede *acceder* a un tenant cuando el producto lo permita, pero su **superficie nativa** es `/saas`.

---

## Plan de bloques (tras cerrar pasada FCR)

1. **Superficies** — FCR-001 (Tenant vs Platform en Ajustes / nav)
2. **Render stability** — FCR-002
3. **Workspace Entry Policy** — FCR-004, FCR-005, FCR-006
4. Revertir smoke force; `VITE_BOOTSTRAP_MODE` explícito

---

## Cierre de sesión de evidencia

```text
Identity source: BootstrapIdentityProvider
Banner visible: sí
Auth producción: NO certificada
```

Fecha · revisor · commit tip:
