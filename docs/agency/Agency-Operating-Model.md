# YourMeal Agency Operating Model (v1.0.0)
## Sistema Operativo de Gobernanza, Decisión y Control Multi-Agente

---

## 1. Misión y Propósito

El **YourMeal Agency Operating Model** es el marco operativo y metodológico que gobierna la colaboración, toma de decisiones, diseño técnico, implementación, aseguramiento de calidad y preparación para entrega de software entre agentes de inteligencia artificial y la autoridad humana en **YourMeal OS** y sus instancias operativas (ej. **YourMeal-EatClean**).

La Agency no opera como una colección de prompts desconectados, sino como un **sistema de decisión gobernada y distribuida** donde:
- Toda acción tiene una autoridad formalmente delimitada.
- Toda afirmación crítica está respaldada por evidencia empírica.
- Toda compuerta de calidad y seguridad se verifica mediante pruebas reproducibles.
- La soberanía estratégica y la autorización final de despliegue a producción residen incondicionalmente en la **Human Product Authority**.

---

## 2. Jerarquía de Autoridad y Subordinación (L0–L5)

El modelo operativo se estructura sobre la **Pirámide de Autoridad Documental** definida en [`FOUNDATION.md`](../../FOUNDATION.md) y [`AGENTS.md`](../../AGENTS.md). En caso de cualquier conflicto, ambigüedad o tensión, el nivel superior prevalece de manera absoluta:

```text
┌─────────────────────────────────────────────────────────────┐
│ L0 — FOUNDATION.md (Constitución Inmutable)                 │
│      Zero Compromises, Human First, Architecture Before Code │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ L1 — AGENTS.md / AGENCY OPERATING MODEL                     │
│      docs/agency/*, agency-governance.md, boundary docs     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ L2 — CONTEXTO ESTRATÉGICO / ADRs                            │
│      Decisiones arquitectónicas formales y contratos L2     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ L3 — MODELO DE DOMINIO / DICCIONARIO                        │
│      Bounded contexts, invariantes de negocio y entidades   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ L4 — CAPABILITIES, JOURNEYS & ACCEPTANCE CRITERIA           │
│      Catálogo de capabilities can('...'), journeys y specs   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ L5 — IMPLEMENTACIÓN, RUNTIME, TESTS & EVIDENCIA             │
│      Código en src/, migraciones, suites de prueba, git     │
└─────────────────────────────────────────────────────────────┘
```

> **Regla de Soberanía:** `docs/agency/` actúa como el marco operativo de nivel L1. Ningún documento de la Agency puede pretender tener una jerarquía superior a `FOUNDATION.md`.

---

## 3. Principios Fundacionales del Modelo

1. **Human Product Authority:** La autoridad estratégica, la definición final de pricing, la resolución de disyuntivas éticas y la aprobación de despliegues a entornos productivos pertenecen en exclusiva a los responsables humanos.
2. **Opportunity ≠ Authorization:** Una oportunidad comercial o una petición repetida de clientes (*Customer Signal*) no constituye autorización técnica de producto ni orden de desarrollo para ingeniería.
3. **Governance ≠ Design:** La compuerta de gobernanza (*Foundation Guardian*) dictamina la conformidad con L0/L1, pero no diseña la solución técnica ni usurpa el rol de arquitectura.
4. **Design ≠ Implementation:** Un diseño técnico o propuesta arquitectónica (*Software Architect*) no es código productivo ni autoriza implementaciones especulativas.
5. **Implementation ≠ Certification:** El código escrito por los ingenieros no se considera funcional ni seguro hasta que el área de QA emite un informe formal basado en pruebas reproducibles (*No Evidence → No Certification*).
6. **Readiness ≠ Execution:** Un dictamen de `RELEASE READY` emitido por el Release Manager certifica que el cambio cumple todos los gates técnicos, pero **no autoriza el despliegue automático a producción**.
7. **Evidence Before Strategy:** Toda conclusión debe clasificar estrictamente los datos en hechos (*FACT*), hipótesis (*HYPOTHESIS*), propuestas (*PROPOSAL*), supuestos (*ASSUMPTION*) e incógnitas (*UNKNOWN*).
8. **Core ↔ Instance Boundary:** El Core de YourMeal OS debe permanecer 100% genérico y multi-tenant. Las personalizaciones de cliente pertenecen exclusivamente a los repositorios y esquemas de sus instancias aisladas.
9. **Strict Stop:** Ante cualquier contradicción con Foundation, brecha de seguridad, fallo en pruebas de regresión, ambigüedad de autoridad o contaminación de alcance, el proceso se detiene de forma fulminante.

---

## 4. Ciclo Operativo Canónico de 10 Etapas

Todo cambio, funcionalidad, refactorización o corrección dentro de YourMeal OS sigue el ciclo ininterrumpido de 10 etapas:

```text
  1. REQUEST (Recepción de solicitud o señal de mercado)
        │
        ▼
  2. CLASSIFICATION (Fact vs Signal vs Hypothesis vs Bug)
        │
        ▼
  3. AUTHORITY (Identificación del nivel L0–L5 competente)
        │
        ▼
  4. ARCHITECTURE (Evaluación técnica, viabilidad y ADR)
        │
        ▼
  5. SCOPE (Delimitación exhaustiva de archivos e interfaces)
        │
        ▼
  6. IMPLEMENTATION (Construcción mínima canónica bajo contrato)
        │
        ▼
  7. VERIFICATION (Auditoría de seguridad, RLS, tenant y tests)
        │
        ▼
  8. EVIDENCE (Consolidación de matrices y trazabilidad)
        │
        ▼
  9. RELEASE READINESS (Auditoría de Release Gates G0–G8)
        │
        ▼
 10. POST-RELEASE & HUMAN APPROVAL (Autorización de despliegue)
```

### Detalle de las Etapas:

| Etapa | Responsable Principal | Participantes | Inputs | Outputs | Evidencia Requerida | Condición PASS | Condición BLOCK / Strict Stop |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Request** | Growth / Human / Eng | Stakeholders | Solicitud verbal, ticket o señal de cliente | Registro formal del requerimiento | Contexto y origen del requerimiento | Solicitud estructurada | Solicitud ambigua o anónima |
| **2. Classification** | Growth / Architect | Foundation Guardian | Requerimiento registrado | Evidence Ledger clasificado | Trazabilidad de Source IDs | Clasificación epistemológica nítida | Confusión entre hipótesis y hecho |
| **3. Authority** | Foundation Guardian | Human Authority | Requerimiento clasificado | Dictamen de Gobernanza (Gate 0) | Evaluación contra L0/L1 | Dictamen `ALLOW` / `ALLOW WITH CONDITIONS` | Conflicto con Foundation o falta de autoridad |
| **4. Architecture** | Software Architect | Engineers / Guardian | Requerimiento autorizado | Diseño técnico / ADR (Gate 1) | Architecture Assessment & Evidence Matrix | ADR aprobado y dependencias resueltas | Dependencias críticas `UNKNOWN` |
| **5. Scope** | Software Architect | Engineers | ADR aprobado | Inventario de archivos y contratos | Lista exhaustiva de módulos y capabilities | Alcance delimitado y cerrado | Modificaciones no justificadas |
| **6. Implementation** | DB / BE / FE Engineers | Architect | Contratos y especificaciones | Código fuente en branch aislada (Gate 2) | Diff limpio y trazable al diseño | Código completado bajo contrato | Fallo de build o intento de bypass |
| **7. Verification** | QA Engineer | Engineers | Código y acceptance criteria | Ejecución de suite de pruebas (Gate 6) | Logs de pruebas unitarias/integración/E2E | 100% tests verdes sin tautologías | Tests fallidos o no ejecutados |
| **8. Evidence** | QA Engineer | Release Manager | Resultados de pruebas | `QA Certification Report` (Gate 3) | Evidence Provenance Matrix auditada | Dictamen `CERTIFIED` de QA | Fuga de tenant, brecha RLS o QA FAILED |
| **9. Release Readiness** | Release Manager | QA / Architect | Reporte de QA y diff de branch | `Release Readiness Report` (Gate 7) | Auditoría de Gates G0 a G8 | Dictamen `RELEASE READY` | Cualquier Release Gate fallido o bloqueado |
| **10. Human Approval** | Human Product Authority | Release Manager | Reporte de Release Readiness | Aprobación de despliegue / Tagging | Firma / confirmación humana explícita | Despliegue ejecutado por humano | Intento de deploy automático por agentes |

---

## 5. Frontera Core vs. Instancias (Core ↔ Instance Boundary)

Conforme a [`docs/05-architecture/INSTANCE_RUNTIME_BOUNDARY.md`](../05-architecture/INSTANCE_RUNTIME_BOUNDARY.md):

```text
                                  YOURMEAL AGENCY
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     YOURMEAL OS (CORE GENÉRICO)                    INSTANCIAS (EJ. EATCLEAN)
  • Repositorio: losrealesplus/YourMeal-OS       • Repositorio: losrealesplus/YourMeal-EatClean
  • Dominio 100% genérico y multi-tenant        • Configuración de tenant dedicada
  • Cero lógica, precios o marcas ad-hoc        • Reglas de negocio e integraciones locales
  • Base de datos Demo Oficial                  • Base de datos de producción aislada
```

### Regla de Oro del Boundary:
> Si un cambio introduce una regla de negocio que solo aplica a una marca o tenant específico (e.g. EatClean), **está terminantemente prohibido introducirlo en el Core de YourMeal OS**. Debe encapsularse en la configuración de la instancia o en un repositorio cliente.

---

## 6. Documentos del Sistema Agency

Este modelo operativo se complementa y ejecuta a través de los siguientes instrumentos normativos:

- [`Agent-Roles.md`](./Agent-Roles.md): Responsabilidades, límites y contratos de los 7 agentes especializados y el rol humano.
- [`Authority-Matrix.md`](./Authority-Matrix.md): Matriz de decisión y gobernanza por dominio funcional.
- [`Decision-Protocol.md`](./Decision-Protocol.md): Protocolo de transición estructurado para solicitudes y handoffs.
- [`Evidence-Protocol.md`](./Evidence-Protocol.md): Taxonomía de evidencia, trazabilidad y protocolos AIT-001 y AIT-002.
- [`Change-Gates.md`](./Change-Gates.md): Compuertas obligatorias de cambio (G0 a G8).
- [`Strict-Stop-Protocol.md`](./Strict-Stop-Protocol.md): Condiciones de detención fatal inmediata y recuperación controlada.
