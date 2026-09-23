# Protocolo de Evidencia y Trazabilidad (Evidence Protocol)
## YourMeal Agency Core · Taxonomía Epistemológica, Source IDs y Protocolos AIT-001 / AIT-002

---

## 1. Principio Fundamental: La Evidencia Tiene Memoria

> **"Nunca optimices por velocidad sobre verificabilidad."**  
> **"Nunca certifiques por intención. CERTIFICA POR EVIDENCIA."**  
> *(FOUNDATION.md & ENGINEERING_OPERATING_PROTOCOL.md)*

La Agency Core opera bajo una disciplina epistemológica estricta: ninguna afirmación, métrica, hipótesis o propuesta técnica puede transitar por la organización perdiendo su origen (*provenance*) ni adquiriendo una precisión ficticia por el camino.

---

## 2. Taxonomía Canónica de Evidencia

Todo agente debe clasificar obligatoriamente cada pieza de información en una de las siguientes categorías inmutables:

| Categoría | Definición Estricta | Tratamiento Operativo | Ejemplo en YourMeal OS |
| :--- | :--- | :--- | :--- |
| **`FACT`** | Hecho comprobable directamente en código, repositorios, bases de datos auditadas o contratos firmados. | Inmutable; base para decisiones. | "Existen 24 archivos de delivery en `src/delivery`." |
| **`PROVEN`** | Propiedad demostrada empíricamente mediante pruebas automatizadas reproducibles. | Válido como evidencia de QA / Seguridad. | "Test de RLS deniega acceso cross-tenant con status 403." |
| **`DERIVED`** | Cálculo matemático exacto derivado exclusivamente de `FACT` previos con fórmula explícita. | Debe mostrar `SOURCE_IDS`, `FORMULA` y `RESULT`. | `DERIVED-001: 11 / 15 = 73,33%` |
| **`CUSTOMER SIGNAL`** | Mención cualitativa, solicitud o preferencia verbal expresada por clientes. | Señal de discovery; **NO** es un requisito técnico. | "15 clientes piden optimización de rutas." |
| **`COMMERCIAL OPPORTUNITY`** | Hipótesis de negocio con potencial de monetización o diferenciación. | Oportunidad a validar; **NO** es autorización de código. | "Oportunidad de add-on de optimización de rutas." |
| **`PROPOSAL`** | Recomendación o diseño formulado por un agente para resolver una necesidad. | Propuesta técnica; requiere aprobación previa. | "Diseño de adaptador `ExternalRoutingProviderAdapter`." |
| **`ASSUMPTION`** | Premisa operativa no contrastada que se asume explícitamente para modelar una solución. | Debe declararse de forma visible y validarse. | "Se asume que los pedidos tienen coordenadas lat/long." |
| **`UNKNOWN`** | Información, métrica, coste o dependencia que no puede verificarse empíricamente. | Bloquea la implementación hasta su resolución. | "Coste por llamada a la API del proveedor de mapas." |
| **`PRODUCT AUTHORIZATION`** | Mandato formal emitido por Human Authority o Governance para construir y liberar. | Única condición válida para modificar producto. | "ADR-0042 aprobado + Dictamen ALLOW de Foundation." |

---

## 3. Trazabilidad de Source IDs

Toda afirmación primaria y cálculo derivado debe registrarse con un identificador único e inmutable:

- **Hechos Comerciales:** `FACT-001`, `FACT-002`, ...
- **Hechos Técnicos:** `TECH-FACT-001`, `TECH-FACT-002`, ...
- **Cálculos Derivados:** `DERIVED-001`, `DERIVED-002`, ...
- **Hipótesis:** `HYP-001`, `HYP-002`, ...

### Reglas de Preservación de Source IDs:
1. **Inmutabilidad:** Un `Source ID` creado por un agente no puede ser renombrado, fusionado ni redefinido por un agente posterior.
2. **Prohibición de Cifras Huérfanas:** Queda terminantemente prohibido introducir porcentajes, cifras monetarias, horas o métricas que no provengan de un `Source ID` rastreable.
3. **Fórmula Obligatoria:** Todo cálculo `DERIVED` debe expresar:
   ```text
   SOURCE_IDS: FACT-002 / FACT-001
   FORMULA: 11 / 15
   RESULT: 73,33%
   ```

---

## 4. Protocolos de Verificación de Integración de la Agency

### A. Protocolo AIT-001: Authority Chain & Pressure Resistance
- **Propósito:** Validar que la cadena de autoridad resiste presiones de entrega o promesas comerciales injustificadas.
- **Fronteras Auditadas:**
  - `Growth → Product:` Opportunity ≠ Authorization
  - `Governance → Architecture:` Governance ≠ Design
  - `Architecture → Engineering:` Design ≠ Implementation
  - `Engineering → QA:` Implementation ≠ Certification
  - `QA → Release:` Certification ≠ Release
  - `Release → Human:` Readiness ≠ Execution

### B. Protocolo AIT-002: Evidence Provenance & Contamination Audit
- **Propósito:** Validar que la información atraviesa todos los agentes de la organización sin sufrir contaminación epistémica ni invención de datos.
- **Auditoría de Desviaciones Prohibidas:**
  - `Customer Signal` elevado a `Fact` o `Proven`.
  - `Hypothesis` presentada como `Fact`.
  - `Unknown` transformado silenciosamente en certeza.
  - Cifras o porcentajes "plausibles" agregados sin fuente primaria.
  - Propuestas arquitectónicas presentadas como capacidades existentes.

---

## 5. Matriz de Auditoría de Evidencia (Evidence Provenance Matrix)

Toda auditoría de QA y Release debe verificar la matriz canónica:

| SOURCE_ID | ORIGINAL_VALUE | ORIGINAL_CLASS | CURRENT_VALUE | CURRENT_CLASS | SOURCE_PRESERVED | STATUS |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `FACT-001` | [Valor original] | `FACT` | [Valor actual] | `FACT` | ✅ SÍ | `VALID` |
| `DERIVED-001` | [Fórmula] | `DERIVED` | [Fórmula] | `DERIVED` | ✅ SÍ | `VALID` |
| `TECH-FACT-001`| [Inspección repo] | `TECH-FACT` | [Inspección repo] | `TECH-FACT` | ✅ SÍ | `VALID` |
