# GOBERNANZA DE LA AGENCY CORE · YOURMEAL OS
## REGLAS DE EJECUCIÓN TÉCNICA Y SUBORDINACIÓN DOCUMENTAL

---

## 1. Principio de Subordinación Arquitectónica

La infraestructura `.agents/` es una **capa de ejecución técnica subordinada** al gobierno documental del proyecto. Ningún agente, skill o regla dentro de `.agents/` tiene autoridad para reinterpretar, omitir o sobrescribir las decisiones de las capas superiores.

```text
L0 — FOUNDATION.md                    → Constitución inmutable (Prevalece siempre sobre todo)
L1 — AGENTS.md / OPERATING PROTOCOL   → Metodología de ingeniería, gobernanza de agentes y compuertas
L2 — CONTEXTO ESTRATÉGICO / ADRs      → Arquitectura permanente y Decision Records (docs/adr/*)
L3 — MODELO DE DOMINIO / DICCIONARIO  → Invariantes operativas y vocabulario canónico (DICT-xxx)
L4 — CAPABILITIES & JOURNEYS          → Contratos de capacidad (CAP-xxx) y Customer Journeys
L5 — RUNBOOKS & PROCEDIMIENTOS        → Operativa de despliegue, aprovisionamiento e infraestructura
─────────────────────────────────────────────────────────────────────────────────────────────
⚙️  .agents/                          → Capa de Ejecución Técnica Asistida (Subordinada a L0-L5)
```

> **Regla de Prevalencia Directa**: Si existe cualquier contradicción o conflicto entre una directiva de `.agents/` y cualquier nivel superior (L0 a L5), **prevalece siempre la directiva superior**.

---

## 2. Jerarquía de Fuentes de Verdad y Navegación Documental

Los agentes deben consultar y respetar las fuentes de verdad documentales antes de cualquier implementación:

1. **L0 — Principios Fundacionales (`FOUNDATION.md`)**:
   - *Human First*, *AI Assists*, *Simplicity Wins*, *Privacy by Design*, *Documentation Driven*, *Architecture Before Code*.
2. **L1 — Gobernanza y Metodología (`AGENTS.md` & `docs/05-architecture/ENGINEERING_OPERATING_PROTOCOL.md`)**:
   - Ciclo formal de compuertas: `INSPECT → CONTRACT GATE → IMPLEMENT → TEST → HUMAN REVIEW → MERGE → CERTIFY`.
   - Idioma (ADR 0010): Razonamiento y documentación en **español**; código y base de datos en **inglés**.
   - Protocolo *Zero Lost Changes*: Prohibido descartar o sobrescribir trabajo previo sin reconciliación explícita.
3. **L2 — Decisiones de Arquitectura (`docs/adr/` & `docs/05-architecture/`)**:
   - Todo cambio arquitectónico o estructural requiere la creación o actualización formal de un **ADR**.
4. **L3 — Dominio y Vocabulario Canónico (`docs/12-domain-model/` & `docs/99-reference/PROJECT_DICTIONARY.md`)**:
   - Uso obligatorio de términos aceptados (`DICT-xxx`).
   - Prohibido inventar entidades, sinónimos o contratos que contradigan o dupliquen el diccionario del proyecto.
5. **L4 — Capacidades y Experiencia (`src/runtime/platform-contracts/` & `docs/07-experience/`)**:
   - Contratos canónicos de capabilities (`CAP-001` a `CAP-008+`) y Customer Journeys certificados.

---

## 3. Límites Operativos Inmutables para Agentes

Todo agente que opere en YourMeal OS debe acatar estrictamente las siguientes reglas operativas:

### A. Gestión de Git y Ramas
- **Prohibido el commit directo en `main`**: Todos los cambios deben desarrollarse en ramas autorizadas (e.g. `feat/*`, `fix/*`, `chore/*`) y promoverse exclusivamente vía Pull Request.
- **Merge controlado**: Ningún agente puede mergear un PR sin revisión y aprobación humana explícita.

### B. Frontera de Base de Datos y Supabase
- **Prohibido modificar migraciones consolidadas**: Las migraciones en `supabase/migrations/` son inmutables.
- **Toda alteración de esquema requiere una nueva migración SQL versionada**, validada mediante CI en base de datos limpia (`migration-bootstrap.yml`).
- **Prohibido realizar mutaciones o escrituras en bases de datos de producción/staging sin autorización explícita**.

### C. Frontera Arquitectónica Core ↔ Instance (Multi-Tenant)
- **Aislamiento Core**: `YourMeal-OS` es una plataforma universal y genérica. Prohibido acoplar o hardcodear reglas de negocio específicas de un tenant (como EatClean) dentro del Core.
- **Configuración de Tenant**: La lógica y ofertas específicas de cada tenant residen en sus configuraciones de instancia (`instances/*` o repositorios de cliente como `YourMeal-EatClean`).
- **Soporte de Modelos Genéricos**: El Core debe mantener soporte para todos los modelos de negocio genéricos (e.g., `per_unit`, `fixed_package`).

### D. Despliegues y Releases
- **Prohibido desplegar**: Ningún agente puede ejecutar `deploy` o publicar versiones sin autorización humana explícita.

---

## 4. Estándar de Verificación y Reporte de Evidencia

1. **Certificación por Evidencia (Nunca por Intención)**:
   - Ninguna tarea se considera completa sin evidencia ejecutable (tests de Vitest, typecheck `tsc --noEmit`, builds limpios, diffs auditados).
2. **Reporte Obligatorio de Impacto**:
   - Todo agente debe listar las **rutas exactas** de los archivos modificados o creados.
   - Todo agente debe especificar la **batería de pruebas y verificaciones** ejecutadas y sus resultados concretos.
3. **Protocolo STRICT STOP**:
   - Ante cualquier contradicción no resuelta, ambigüedad en requisitos, fallo de compuerta o conflicto documental en el mismo nivel de autoridad: **el agente debe detenerse inmediatamente (STRICT STOP)** y solicitar clarificación al operador humano.
