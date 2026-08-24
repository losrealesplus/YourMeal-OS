# PROTOCOLO OPERATIVO PERMANENTE DE INGENIERÍA · YOURMEAL OS
## GOBERNANZA TÉCNICA, JERARQUÍA DOCUMENTAL, COMPUERTAS DE CONTEXTO Y CERTIFICACIÓN MULTIPROVEEDOR

---

## 0. Principio Fundamental & Regla de Oro

> **"Nunca optimices por velocidad sobre verificabilidad."**  
> **"Nunca certifiques por intención. CERTIFICA POR EVIDENCIA."**

El estándar inmutable de ingeniería de YourMeal OS exige la siguiente secuencia canónica para cualquier desarrollo, infraestructura, inquilino (tenant), seguridad o despliegue:

```text
INSPECT (Auditoría de estado real)
  ↓
DOCUMENT CONTEXT GATE (Verificación documental obligatoria)
  ↓
CONTRACT GATE (Strict Read-Only)
  ↓
IMPLEMENT (Mínimo canónico)
  ↓
TEST (Typecheck, Lint, Vitest, Build, Diff)
  ↓
ADVERSARIAL RED TEAM
  ↓
HARDEN (Resolución P0/P1)
  ↓
FOUNDATION UPDATE (Invariantes permanentes y ADRs)
  ↓
PR CREATION (Branch aislada)
  ↓
HUMAN REVIEW GATE (Strict Stop)
  ↓
MERGE (Solo tras aprobación humana explícita)
  ↓
MAIN VERIFY (Sincronización ff-only)
  ↓
PROVIDER RECONCILIATION GATE (GitHub + Supabase + Cloudflare)
  ↓
DEPLOY (Despliegue controlado)
  ↓
LIVE BREAK TEST (Ataques en caliente y huella de bundles)
  ↓
CERTIFY (Emisión del Block Report)
  ↓
FREEZE (Bloque formalmente congelado)
```

Ninguna etapa puede ser omitida silenciosamente.

---

## 1. Jerarquía de Autoridad Documental (`Document Authority Model`)

En caso de conflicto o ambigüedad, el nivel superior prevalece siempre:

```text
L0 — FOUNDATION (FOUNDATION.md)
     Constitución arquitectónica y principios inmutables. Prevalece sobre todo.

L1 — GOVERNANCE & FRAMEWORKS (AGENTS.md, FOPEBA, ENGINEERING_OPERATING_PROTOCOL.md)
     Metodología de trabajo, ciclo de compuertas y marcos de razonamiento.

L2 — ARCHITECTURE & ADRs (docs/05-architecture/*)
     Decisiones arquitectónicas formales y contratos técnicos de plataforma.

L3 — DOMAIN CONTRACTS (docs/12-domain-model/*, Facades, Services)
     Contratos específicos del modelo de negocio e invariantes de dominio.

L4 — CAPABILITY & BLOCK CONTRACTS (Contracts de Bloque / Módulos)
     Especificaciones concretas de bloques de implementación.

L5 — RUNBOOKS & OPERATIONAL (docs/runbooks/*, Deployment, Disaster Recovery)
     Procedimientos operativos y manuales de ejecución de infraestructura.
```

> **Regla de Conflicto:** Si existe contradicción en el mismo nivel de autoridad: **STRICT STOP**. Detenerse y solicitar resolución al propietario humano. Nunca reconciliar silenciosamente documentos canónicos en conflicto.

---

## 2. Matriz Canónica de Consulta de Documentos por Tipo de Trabajo

Antes de iniciar cualquier tarea, el agente debe verificar la documentación requerida:

| Tipo de Trabajo | Foundation | AGENTS | FOPEBA | Contexto Estratégico | ADRs / Arq. | Contratos Dominio | Runbooks / Prov. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Nueva Capability** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| **Bug Puntual** | ✅ | ✅ | — | — | ✅ (si toca arq.) | ✅ | — |
| **Refactor** | ✅ | ✅ | — | — | ✅ | ✅ | — |
| **Nuevo Tenant** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Supabase / BD** | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| **Cloudflare / Edge** | ✅ | ✅ | — | — | ✅ | — | ✅ |
| **Onboarding Datos** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cambio Estratégico**| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| **Adversarial Red Team**| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Deploy / Release** | ✅ | ✅ | — | — | ✅ | — | ✅ |

---

## 3. Gobernanza de FOPEBA (Del Fenómeno Observado al Software)

FOPEBA es el marco de razonamiento permanente para transformar observaciones operativas en capacidades de software fiables:

```text
OPERACIÓN OBSERVADA
        ↓
      FOPEBA (Validación, Reproducibilidad e Identificación de Invariantes)
        ↓
CONOCIMIENTO OPERATIVO VERIFICADO
        ↓
CONTRATO DE DOMINIO
        ↓
SOFTWARE IMPLEMENTADO
```

### Preguntas Obligatorias de FOPEBA:
1. ¿Cuál es el fenómeno operativo observado?
2. ¿Cuál es el problema real de raíz?
3. ¿Es la observación reproducible?
4. ¿Qué conocimiento operativo ha sido verificado con certeza?
5. ¿Qué parte debe convertirse en software automatizado?
6. ¿Qué parte debe permanecer bajo control y confirmación humana?
7. ¿Qué evidencia respalda la automatización propuesta?
8. ¿Qué invariantes debe preservar el software sin excepción?

---

## 4. Compuerta de Contexto Pre-Implementación (`# DOCUMENT CONTEXT CHECK`)

Al inicio de **cada nuevo bloque**, es obligatorio generar el cuadro de verificación de contexto antes de escribir código:

```text
# DOCUMENT CONTEXT CHECK

FOUNDATION.md                 🟢 CONSULTED
AGENTS.md                     🟢 CONSULTED
FOPEBA                        🟢 CONSULTED / N/A
Strategic Context             🟢 CONSULTED / N/A
Relevant ADRs                 🟢 CONSULTED
Domain Contracts              🟢 CONSULTED
Capability Contract           🟢 CONSULTED
Provider Runbooks             🟢 CONSULTED / N/A
```

Si falta algún contexto obligatorio: **STRICT STOP**.

---

## 5. Compuertas de Control y Parada Estricta (`Strict Stop Rules`)

1. **Tras Inspección y Contract Gate:** No implementar sin aprobación del contrato.
2. **Tras Red Team & Hardening:** No crear PR si existen fallos P0 o P1.
3. **Tras Creación de PR:** Parar y esperar revisión humana. Prohibido mergear o desplegar.
4. **Tras Merge:** Sincronizar `main` localmente y auditar proveedores antes de desplegar.
5. **Tras Live Certification:** El bloque queda congelado (`FREEZE`).

---

## 6. Reconciliación Multiproveedor (`Provider Reconciliation Gate`)

Antes de cualquier despliegue o certificación:

### A. GitHub (`gh api`)
* Repositorio, rama y commit SHA exacto (`YourMeal-OS` vs `YourMeal-<Tenant>`).

### B. Supabase (`npx supabase`)
* Proyecto y región exactos (`djangucecsphnejplvic` en Londres vs proyecto dedicado de cliente en Frankfurt).
* Conteo de filas de base de datos en tiempo real.
* RLS activo en tablas y Storage buckets privados.

### C. Cloudflare (`npx wrangler`)
* Worker y versión exacta activa con 100% de tráfico.
* **Huella de Bundles Cliente (Client Bundle Fingerprint):** Correlación estricta $\text{Source} \rightarrow \text{Build} \rightarrow \text{Worker} \rightarrow \text{Live Bundle} \rightarrow \text{Supabase} \rightarrow \text{Live URL}$ para garantizar que el navegador jamás conecte a una base de datos errónea.

---

## 7. Frontera Canónica de Instancias: Demo vs Clientes Reales

```text
====================================================================================================
MODELO PERMANENTE DE INSTANCIAS
====================================================================================================

1. YOURMEAL OS OFICIAL DEMO (`yourmeal-os`):
   • Repositorio:   losrealesplus/YourMeal-OS
   • Supabase:      djangucecsphnejplvic (Región: eu-west-2)
   • Finalidad:     Showcase comercial, demo oficial interactiva y desarrollo Core.
   • Datos:         Sintéticos / fluctuantes. 0 datos de clientes reales.

2. INSTANCIA DE CLIENTE REAL (ej. `eatclean`):
   • Repositorio:   losrealesplus/YourMeal-EatClean
   • Supabase:      nhirlpkuvonggctdzzad (Región: eu-central-1)
   • Worker:        yourmeal-instance-eatclean (eatclean.yourmealos.com)
   • Finalidad:     Operación diaria real, aislamiento estricto, esquemas propios.
   • Datos:         100% reales custodiados tras aprobación humana de onboarding.

GUARDAS ANTI-LEAK:
Cualquier intento de conexión cruzada (Demo -> Base de Cliente o Cliente -> Base Demo)
es considerado una SECURITY_VIOLATION y bloquea fatalmente la ejecución.
====================================================================================================
```

---

## 8. Formato de Reporte de Certificación Final

Cada bloque completado concluye con un **BLOCK REPORT** con:
1. Objetivo y Alcance.
2. Arquitectura e Invariantes.
3. Archivos modificados y documentación de Fundación actualizada.
4. Estado en GitHub, Supabase y Cloudflare con SHAs e IDs auditados.
5. Resultados de Quality Gates y Adversarial Red Team.
6. Estado HTTP en vivo y Live Break Tests.
7. Clasificación final: 🟢 **CERTIFIED** | 🟡 **HARDENING REQUIRED** | 🔴 **BLOCKED**.
