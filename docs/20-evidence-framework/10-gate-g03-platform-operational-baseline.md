# 09 · Gate G-03 · Platform Operational Baseline

Parte del [Evidence Framework](./README.md).

**Instancia de Gate** previa a reanudar el desarrollo de módulos funcionales tras el cutover de infraestructura Supabase (INFRA-002).

Artefacto de ejecución: [G03_PRODUCTION_SMOKE_CHECKLIST](../10-validation/G03_PRODUCTION_SMOKE_CHECKLIST.md).

---

## Qué es (y qué no es)

```text
G-03 · Platform Operational Baseline

Objetivo

Demostrar que el ecosistema completo —base de datos, auth, frontend—
opera como un único sistema coherente sobre el proyecto Supabase oficial,
tras bootstrap limpio + cutover de binding.

No autoriza el piloto (eso es G-02).
No certifica RI-001.
Autoriza continuar el desarrollo de módulos sobre infraestructura unificada.
```

| G-03 **es** | G-03 **no es** |
|-------------|----------------|
| Gate de **baseline operativa de plataforma** | Gate de Pilot Readiness (G-02) |
| Smoke E2E post-cutover | Rediseño de features |
| Evidencia de coherencia DB ↔ App | Cobertura funcional 100 % |
| Cierre de la etapa de estabilización infra | Sustituto de ORR / FOV |

```text
Relación con otros gates

Foundation Lock / IR-001     → arquitectura + integración código
Bootstrap limpio + INFRA-002 → schema + binding oficial
        ↓
G-03 · Platform Operational Baseline   ← AQUÍ
        ↓
Desarrollo de módulos / CAP
        ↓
G-02 · Pilot Readiness → FOV / RI-001
```

---

## Criterios de aceptación (binarios)

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | Bootstrap reproducible (empty → `db push`) | Session 2026-07-25 · Migration Bootstrap CI |
| 2 | Infraestructura unificada (un solo project ref oficial) | `config.toml` · `.env` · Lovable |
| 3 | Entornos sincronizados (local / Lovable / oficial) | Keys publishable alineadas |
| 4 | Aplicación conectada al proyecto oficial | Client init sin error · Network → host oficial |
| 5 | Gestión SaaS operativa (datos visibles / sin error bloqueante) | Smoke §3 + capturas |
| 6 | Gestión Operaciones operativa | Smoke §4 + capturas |
| 7 | Sin referencias de binding al proyecto deprecado | `rg` en `.env` / `config.toml` / clients |
| 8 | Lista para continuar desarrollo de módulos | Acta G-03 PASS |

**Decisión del gate:** `PASS` \| `BLOCKED`  
Si **BLOCKED**, no abrir CAP/feature PRs que dependan del runtime Supabase hasta cerrar el bloqueo.

---

## Prerrequisitos

1. Schema bootstrap en proyecto oficial (hecho).  
2. INFRA-002 cutover de binding en repo (PR cutover).  
3. **Operator:** publishable key en `.env` + Lovable Cloud.  
4. Auth user(s) allowlisted / seeded (Platform Owner como mínimo).

> **Nota de nomenclatura:** el checklist histórico **OP-001 Day-0** (`OP001_DAY0_CHECKLIST`) sigue vigente para seed operativo.  
> El smoke de esta etapa se ejecuta bajo **G-03**, no como un segundo “OP-001”.

---

## Procedimiento

Ejecutar [G03_PRODUCTION_SMOKE_CHECKLIST](../10-validation/G03_PRODUCTION_SMOKE_CHECKLIST.md) de punta a punta.  
Depositar evidencia en `docs/10-validation/evidence/g03/`.

---

## Relacionado

- [INFRA-002 CUTOVER_REPORT](../10-validation/CUTOVER_REPORT.md)  
- [Migration Bootstrap Validation](../10-validation/MIGRATION_BOOTSTRAP_VALIDATION.md)  
- [OP002 Platform Owners](../10-validation/OP002_PLATFORM_OWNER_BOOTSTRAP.md)  
- [G-02 Pilot Readiness](./08-gate-g02-pilot-readiness.md)  
