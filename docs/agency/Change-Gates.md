# Compuertas Obligatorias de Cambio (Change Gates)
## YourMeal Agency Core · Sistema de Control y Validación Pre-Entrega (G0 a G8)

---

## 1. Visión General de los Release Gates

Ningún cambio de código, base de datos, arquitectura o configuración puede avanzar a producción sin superar secuencialmente los **9 Change Gates (G0 a G8)**:

```text
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    GATE 0    │──>│    GATE 1    │──>│    GATE 2    │──>│    GATE 3    │
│  Governance  │   │ Architecture │   │Core/Instance │   │Implementation│
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
       │
       ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    GATE 4    │──>│    GATE 5    │──>│    GATE 6    │──>│    GATE 7    │──>│    GATE 8    │
│   Security   │   │   Database   │   │  Regression  │   │ReleaseReady  │   │HumanApproval │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 2. Detalle y Criterios de Validación de los Gates

### 🛡️ GATE 0 — Governance Gate
- **Responsable:** Foundation Guardian (`L1`).
- **Criterios Obligatorios:**
  1. Dictamen explícito `ALLOW` o `ALLOW WITH CONDITIONS`.
  2. Cero contradicciones con `FOUNDATION.md` o principios L0.
  3. Cero bypass de gobernanza.
- **Condición de Fallo:** Dictamen `BLOCKED` o ausencia de revisión.

---

### 🏛️ GATE 1 — Architecture Gate
- **Responsable:** Software Architect (`L2–L3`).
- **Criterios Obligatorios:**
  1. ADR formal redactado y aprobado en `docs/adr/` cuando el cambio afecte modelos de dominio, capabilities o contratos.
  2. Todas las dependencias técnicas externas (`UNKNOWN`) resueltas antes de autorizar la construcción.
  3. Contratos de API e interfaces formalmente especificados.
- **Condición de Fallo:** Ausencia de ADR requerido o dependencias críticas no resueltas.

---

### 🌐 GATE 2 — Core ↔ Instance Boundary Gate
- **Responsables:** Foundation Guardian & Software Architect.
- **Árbol de Decisión Obligatorio:**
  ```text
  ¿El cambio es genérico y aplicable a cualquier tenant de YourMeal OS?
         │
      ┌──┴──┐
     YES    NO
      │      │
     CORE  INSTANCE (Aislar en repo de cliente ej. YourMeal-EatClean)
  ```
- **Criterios Obligatorios:**
  1. El Core de YourMeal OS no contiene precios, slugs, marcas ni reglas de negocio exclusivas de un cliente particular.
  2. Las instancias no comparten bases de datos ni rompen el aislamiento físico.
- **Condición de Fallo:** Duda sobre el boundary o intento de introducir lógica de EatClean en el Core → `STRICT STOP`.

---

### ⚙️ GATE 3 — Implementation & Scope Gate
- **Responsables:** DB, Backend y Frontend Engineers (`L4–L5`).
- **Criterios Obligatorios:**
  1. El código implementado coincide 100% con el diseño técnico aprobado.
  2. Ausencia de cambios no relacionados (*unrelated changes*) o modificaciones accidentales en el diff.
  3. Árbol Git limpio (`git status --short`).
- **Condición de Fallo:** Archivos modificados fuera de alcance sin justificación documentada.

---

### 🔒 GATE 4 — Security & Multi-Tenant Gate
- **Responsables:** QA Engineer & Software Architect.
- **Criterios Obligatorios:**
  1. Aislamiento multi-tenant estricto: toda consulta está vinculada al `tenant_id` de la sesión JWT autenticada.
  2. Cero suplantación de tenant (*no client-supplied tenantId*).
  3. Row Level Security (RLS) activo y enforzado en todas las tablas sin bypass ni elevación a `service_role`.
  4. Modelo de capabilities (`can('...')`) validado sin atajos basados en roles crudos (`ctx.roles.includes('admin')`).
  5. Cero secretos o tokens expuestos en código o historial.
- **Condición de Fallo:** Vulnerabilidad cross-tenant, salto de RLS o bypass de capabilities → `STRICT STOP FATAL`.

---

### 🗄️ GATE 5 — Database Integrity Gate
- **Responsable:** Database Engineer (`L4–L5`).
- **Criterios Obligatorios:**
  1. Migraciones estrictamente *forward-only* con timestamp único en `supabase/migrations/`.
  2. Historial de migraciones preexistentes 100% intacto (cero alteraciones retrospectivas).
  3. Tipos TypeScript generados (`database.types.ts`) sincronizados con el nuevo esquema.
  4. Integridad referencial (FKs), restricciones de unicidad e índices validados.
- **Condición de Fallo:** Modificación de migración histórica o desincronización de tipos.

---

### 🧪 GATE 6 — Regression & QA Certification Gate
- **Responsable:** QA Engineer (`L4–L5`).
- **Criterios Obligatorios:**
  1. Typecheck ejecutado con éxito (`tsc --noEmit`) con exit code 0.
  2. Linter ejecutado con éxito (`npm run lint`) con exit code 0.
  3. Suite de tests unitarios, de integración y E2E pasando con 100% de éxito.
  4. Cero tests tautológicos o vacuos (`expect(true).toBe(true)`).
  5. Emisión formal del `QA Certification Report` con dictamen `CERTIFIED` o `CERTIFIED WITH CONDITIONS`.
- **Condición de Fallo:** Fallo en tests, ausencia de pruebas o dictamen QA `BLOCKED` / `FAILED` / `NOT TESTED`.

---

### 📦 GATE 7 — Release Readiness Gate
- **Responsable:** Release Manager (`L4–L5`).
- **Criterios Obligatorios:**
  1. Cadena de evidencia ininterrumpida verificada (Gates G0 a G6 superados).
  2. Diff de la rama auditado (`git diff --stat`, `git diff --name-only`).
  3. Emisión formal del `Release Readiness Report` con dictamen categórico `RELEASE READY`.
- **Condición de Fallo:** Cualquier gate previo no cumplido o presencia de código no certificado en el branch.

---

### 👤 GATE 8 — Human Approval Gate
- **Responsable:** Human Product Authority (`HUMAN`).
- **Criterios Obligatorios:**
  1. Revisión y ratificación del `Release Readiness Report`.
  2. Autorización explícita, humana y documentada para ejecutar merge a ramas protegidas y despliegue a producción.
- **Condición de Fallo:** Intento de despliegue autónomo o no autorizado por un agente.
