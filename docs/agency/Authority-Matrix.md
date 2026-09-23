# Matriz de Autoridad y Gobernanza (Authority Matrix)
## YourMeal Agency Core · Definición DACV / RACI por Dominio

---

## 1. Definición de Niveles de Participación

Para evitar ambigüedad en la toma de decisiones, la Agency Core utiliza el modelo **DACV** (Decide, Approves, Consulted, Verifies / Executes):

- **`DECIDES` (D):** Rol con la autoridad final y exclusiva para definir, crear o cambiar el elemento.
- **`APPROVES` (A):** Rol con poder de veto que debe emitir un dictamen formal favorable antes de avanzar.
- **`CONSULTED` (C):** Rol que aporta contexto, análisis, requerimientos o evidencia técnica/comercial.
- **`EXECUTES` (E):** Rol responsable de materializar la implementación técnica bajo contrato.
- **`VERIFIES` (V):** Rol independiente responsable de auditar, probar o certificar el cumplimiento de los criterios.

---

## 2. Matriz General de Autoridad por Dominio

| Dominio / Acción de Decisión | Human Authority | Foundation Guardian | Software Architect | Growth Commercial | DB Engineer | BE Engineer | FE Engineer | QA Engineer | Release Manager |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Visión Estratégica & Pricing Final** | **DECIDES** | Consulted | Consulted | Consulted | - | - | - | - | - |
| **Constitución L0 & Reglas L1** | **APPROVES** | **DECIDES** | Consulted | - | - | - | - | - | Consulted |
| **Arquitectura de Sistemas & ADRs** | **APPROVES** | Approves | **DECIDES** | Consulted | Consulted | Consulted | Consulted | Consulted | - |
| **Capabilities & Permissions Catalog** | Approves | Approves | **DECIDES** | Consulted | - | Consulted | - | Verifies | - |
| **Diseño de Schema DB & Políticas RLS** | - | Approves | Approves | - | **DECIDES** | Consulted | - | Verifies | - |
| **Lógica de Dominio Backend & APIs** | - | - | Approves | - | Consulted | **DECIDES** | Consulted | Verifies | - |
| **Diseño UI/UX & Componentes Frontend** | - | - | Approves | Consulted | - | Consulted | **DECIDES** | Verifies | - |
| **Customer Discovery & Hipótesis Comercial**| Approves | - | Consulted | **DECIDES** | - | - | - | - | - |
| **Certificación Técnica & QA Reports** | - | - | - | - | - | - | - | **DECIDES** | Consulted |
| **Auditoría de Release Gates (G0–G8)** | - | Consulted | Consulted | - | - | - | - | Consulted | **DECIDES** |
| **Merge a Main & Deploy a Producción** | **DECIDES** | - | - | - | - | - | - | - | Verifies |

---

## 3. Desglose Detallado por Dominios Críticos

### A. Dominio: Gobernanza y Producto Estratégico
- **Cambios en `FOUNDATION.md` o Principios L0:** Exclusivo de **Human Product Authority** con dictamen técnico de **Foundation Guardian**. Ningún otro agente puede proponer ni alterar este nivel.
- **Frontera Core ↔ Instance:** **Foundation Guardian** decide sobre la pureza del Core; **Software Architect** diseña el aislamiento; **Human Authority** aprueba excepciones de producto.

### B. Dominio: Arquitectura y Modelo de Dominio
- **Creación / Modificación de ADRs:** **Software Architect** redacta y decide el diseño; **Foundation Guardian** aprueba la conformidad con L0/L1; **Human Authority** ratifica decisiones con impacto de negocio.
- **Creación de Nuevas Capabilities (`can('...')`):** Requiere diseño formal de **Software Architect** y validación de seguridad de **Foundation Guardian**.

### C. Dominio: Persistencia y Base de Datos
- **Migraciones PostgreSQL (`supabase/migrations/`):** **Database Engineer** es la única entidad autorizada para crear archivos SQL. **QA Engineer** verifica el aislamiento RLS y el rendimiento de las consultas.
- **Prohibición:** Prohibido alterar migraciones históricas; todo cambio debe ser *forward-only*.

### D. Dominio: Calidad y Certificación
- **Emisión de Dictamen de QA:** **QA Engineer** tiene soberanía absoluta sobre los resultados `CERTIFIED`, `FAILED`, `BLOCKED` o `NOT TESTED`.
- **Inmunidad:** Ningún rol (ni comercial, ni arquitectura, ni ingeniería) puede anular, forzar o suponer un dictamen favorable de QA sin pruebas automatizadas reproducibles.

### E. Dominio: Entrega y Despliegue
- **Declaración de `RELEASE READY`:** Exclusivo de **Release Manager** tras verificar que todos los gates (G0 a G8) están cerrados.
- **Ejecución del Despliegue:** Exclusivo de **Human Product Authority**. El Release Manager audita la preparación; el humano ejecuta o autoriza la publicación a producción.

---

## 4. Reglas de Resolución de Conflictos

1. **Conflicto Gobernanza vs. Negocio:** Si una oportunidad comercial exige violar un principio de `FOUNDATION.md` o un ADR, **prevalece la Gobernanza** (`STRICT STOP`).
2. **Conflicto Arquitectura vs. Implementación:** Si un ingeniero detecta una inconsistencia en el diseño de un ADR, no puede modificar la arquitectura silenciosamente; debe emitir un handoff a **Software Architect**.
3. **Conflicto QA vs. Presión de Entrega:** Si los tests fallan o falta evidencia reproducible, **la entrega queda bloqueada automáticamente** sin excepción posible.
