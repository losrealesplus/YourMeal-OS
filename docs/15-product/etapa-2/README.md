# Etapa 2 / Carril B — YourMeal OS

**Estado:** 🟢 **ABIERTO** (en paralelo a FOV · Carril A)  
**Premisa:** el modelo está **Table-Validated**. El código / UI materializan; no inventan.

**Objetivo (desde CAP-002):** demostrar que FOPEBA puede producir software operacional de alta calidad — no acumular features.

Regla dual track: [DUAL_TRACK_ANTECAMARA](../../00-status/DUAL_TRACK_ANTECAMARA.md).  
Materialización: [docs/21-product-materialization](../../21-product-materialization/README.md).  
Niveles: [ETAPA_2_LEVELS](../../22-implementation/ETAPA_2_LEVELS.md).

---

## Regla de la Etapa 2

> **¿En qué parte del Operational Model Table-Validated está basada esta decisión?**

Sin respuesta documental → no se implementa.  
Pasa por evidencia (FOV → FER → KU).

---

## Cuatro niveles (operativa Cursor)

| Level | Nombre | Qué se conecta |
|-------|--------|----------------|
| **1** | Infrastructure Connection | Auth · Tenant · Repo · Query (CAP-001) |
| **2** | Capability Connection | CAP-002…005 individuales |
| **3** | Operational Workflow | Flujos Dish→Menu→Order→Confirm |
| **4** | Operational Verification | Happy Path real → EatClean → FOV |

**Hito:** [Primer Happy Path sin mocks](../../22-implementation/HAPPY_PATH_E2E.md).

---

## Flujo (invertido)

```text
Operational Knowledge → Operational Model → UX Skeleton → Frontend connected → Backend
```

Lovable = arquitecto visual (skeleton ✅).  
**Cursor = ingeniero de materialización** — [22-implementation](../../22-implementation/README.md).

> FOPEBA certifica · Lovable materializa UX · Cursor conecta capacidades certificadas.

### Orden de arranque (Cursor)

1. [ETAPA_2_LEVELS](../../22-implementation/ETAPA_2_LEVELS.md)  
2. [IMPLEMENTATION_RULES](../../22-implementation/IMPLEMENTATION_RULES.md)  
3. [Happy Path E2E](../../22-implementation/HAPPY_PATH_E2E.md)  
4. [Backlog](../../22-implementation/IMPLEMENTATION_BACKLOG.md)  

PM UI (histórico): [21](../../21-product-materialization/README.md).

---

## Fases de producto (contexto histórico)

| Fase | Nombre | Notas |
|------|--------|-------|
| **A** | Product Experience | Journeys · nav · pantallas base vía **Lovable** · DS |
| **B** | Arquitectura Técnica | Repo · auth · RBAC · CI · DI… |
| **C** | Materialización del Modelo | Lógica con [Knowledge Traceability](./knowledge-traceability.md) |
| **D** | Dependiente de FOV | 🔒 heurísticas · automatizaciones de campo |

Las fases A–D describen el producto; los **Levels 1–4** gobiernan la ejecución Cursor.

---

## Relación con Carril A

Carril B **no** acelera G-01.  
Happy Path E2E conectado = puente natural a FOV (evidencia de campo · Level 4).
