# Knowledge Coverage

Métrica que conecta FOPEBA con la ingeniería: **cuánto del conocimiento certificado ya está materializado en código**.

No mide pantallas. Mide cobertura OM → implementación por Capability.

---

## Tabla viva (Happy Path)

| Capability | OM | Código (lectura del alcance actual) | Estado módulo | Etapa 2 Level |
|------------|----|--------------------------------------|---------------|---------------|
| CAP-001 Auth & User Context | 100% | ~100% (alcance infra) | Connected | L1 |
| CAP-002 Dish Catalog | 100% | ~0% → objetivo lectura ~35% Connected | Scaffold | L2 |
| CAP-003 Weekly Menu | 100% | 0% | Scaffold | L2 |
| CAP-004 Order Programming | 100% | 0% | Scaffold | L2 |
| CAP-005 Order Summary | 100% | 0% | Scaffold | L2 |
| CAP-006 Order Confirmation | 100% | 0% | Scaffold | L3 |
| CAP-007 Order History | 100% | 0% | Scaffold | L3 |

**Notas**

- **OM 100%** = el conocimiento de esa capability está Table-Validated / citado en el modelo (no implica Field Validated).  
- **Código %** = fracción del alcance *declarado* de la CAP que ya está conectado (p. ej. CAP-002 Connected ≈ lectura únicamente → ~35% del dominio Dish completo; el resto queda fuera de alcance a propósito).  
- Actualizar esta tabla al cerrar cada CAP PR.

---

## Cómo leer el indicador

| Señal | Interpretación |
|-------|----------------|
| OM alto · Código bajo | Conocimiento listo; falta materialización (trabajo Etapa 2) |
| OM alto · Código alto · Connected | Capacidad materializada en su alcance |
| Código sin cita OM | **STOP** — riesgo de inventar reglas |

---

## Knowledge → Capability Matrix (planificado)

Cuando existan **~10–15 capabilities Connected**, generar (no antes, para no documentar ruido):

```text
Operational Model
        ↓
Capability
        ↓
Repository
        ↓
Service
        ↓
Screen
        ↓
Route
        ↓
Evidence
```

**Propósito:** demostrar que cada pieza de software tiene origen explícito en el conocimiento operacional — no documentar el código por el código.

Ubicación prevista: `docs/22-implementation/KNOWLEDGE_CAPABILITY_MATRIX.md` (crear solo al umbral).

---

## Relacionado

- [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md)  
- [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md)  
- [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)
