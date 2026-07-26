# Operational Readiness Certification · metodología FCR→ORR

**Estado:** Accepted as working method (Functional Review Mode)  
**No sustituye** el ORR binario de producto ([ORR](../22-implementation/ORR.md) · PASSED / BLOCKED).  
**Complementa:** permite certificar **superficies** antes de que todo el producto esté perfecto.

---

## Cadena (FOPEBA · lectura operacional)

```text
RI   Raw Insight              → observar
KC   Knowledge Consolidation  → convertir observación en conocimiento
SPEC                          → definir principios / superficies / políticas
FCR  Functional Completeness  → verificar experiencia operacional
ORR  Operational Readiness    → certificar que una unidad está lista para operar
```

FCR no es QA de bugs.  
Es la fase que produce evidencia operacional reutilizable para ORR (por superficie o por capacidad).

---

## Lenguaje consolidado (no negociable en FCR)

| Concepto | Significado | No es |
|----------|-------------|--------|
| **Tenant Surface** `/admin` | Opera un negocio (tenant) | «pantalla de Company Admin» |
| **Platform Surface** `/saas` | Opera la plataforma | «pantalla de SaaS Admin» |
| **Workspace Entry Policy** | Dónde empieza a trabajar | Autorización RBAC |
| **Render Stability Regression** | Clase de defecto de render | El síntoma «titileo» |

Roles futuros (Platform Support, Platform Billing, Platform Operations, Platform Owner) trabajan sobre **Platform Surface** sin redefinir la superficie.

---

## Regla de evidencia · síntoma ≠ causa

> **Nunca registrar un síntoma como si fuera la causa.**

| Incorrecto | Correcto |
|------------|----------|
| Hallazgo: «Titileo» | Clase: Render Stability Regression · Síntoma: titileo · Hipótesis: render loop |

Aplica a FCR-002 y a cualquier hallazgo futuro.

---

## Surface Certified

Una **superficie** (Tenant / Platform / Customer) queda **CERTIFIED** cuando:

1. Todas sus pantallas del alcance FCR fueron recorridas.
2. Los botones / CTAs del flujo operativo fueron accionados (no solo «vistos»).
3. No quedan **P0**.
4. No quedan **P1** abiertos (o están aceptados explícitamente con waiver).
5. Los **P2** están listados y **aceptados** (o corregidos).
6. Existe evidencia en el [FCR Session Log](./FCR_SESSION_LOG.md).

Estados por superficie:

| Estado | Significado |
|--------|-------------|
| **NOT STARTED** | Sin recorrido FCR |
| **IN REVIEW** | Pasada en curso / hallazgos abiertos P0–P1 |
| **CERTIFIED** | Criterios arriba cumplidos |
| **REGRESSED** | Hallazgo nuevo P0/P1 tras CERTIFIED |

Ejemplo de lenguaje ORR-prep:

```text
Tenant Surface     → IN REVIEW / CERTIFIED
Platform Surface   → IN REVIEW
Customer Surface   → NOT STARTED
```

**ORR de producto** (HP-001 / piloto) sigue siendo binario PASSED|BLOCKED.  
Surface Certified alimenta esa puerta; no la reemplaza.

---

## Anotación · Operational Journey (aún no SPEC)

**No documentar como política todavía.** Anotar para formación / onboarding:

Además de *qué puede* (RBAC) y *dónde aterriza* (Entry Policy), importa el **recorrido operativo**:

```text
Kitchen:  Login → Kitchen Workspace → Producción → Finalizar lote → Packaging
Support:  Login → Customer Support → Cliente → Pedido → Incidencia
```

Cuando FCR lo necesite, abrir SPEC / ADR de **Operational Journey** (después de Entry Policy).

---

## Pasada 2 · siete perfiles (formato)

Evaluación **operacional**, no solo visual.

| Perfil | Landing | Navegación | Permisos | Resultado |
|--------|---------|------------|----------|-----------|
| Customer | | | | □ |
| Kitchen | | | | □ |
| Delivery | | | | □ |
| Support | | | | □ |
| Accounting | | | | □ |
| Company Admin | | | | □ |
| SaaS Admin | | | | □ |

Criterios por columna:

| Columna | Pregunta |
|---------|----------|
| Landing | ¿Cumple Workspace Entry Policy? |
| Navegación | ¿Llega a su workspace y recorre el flujo sin callejones? |
| Permisos | ¿Ve solo su superficie / capabilities? ¿Nada de Platform desde Tenant-only? |
| Resultado | ✅ / ⚠+ID / ❌+ID |

Plantilla viva: [FCR_SESSION_LOG · Pasada 2](./FCR_SESSION_LOG.md#pasada-2--siete-perfiles).

---

## Relación con artefactos

| Artefacto | Rol en la cadena |
|-----------|------------------|
| [FCR_FINDINGS_REGISTER](./FCR_FINDINGS_REGISTER.md) | Hallazgos clasificados |
| [FCR_SESSION_LOG](./FCR_SESSION_LOG.md) | Evidencia de cobertura |
| [RBAC_MATRIX_V1](./RBAC_MATRIX_V1.md) | Autorización por superficie |
| [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) | Landings (candidato ADR) |
| [Development Identity Adapter](../20-evidence-framework/11-development-identity-adapter.md) | Cómo se obtiene identidad en FCR |
| [ORR](../22-implementation/ORR.md) | Puerta binaria de readiness de producto |
