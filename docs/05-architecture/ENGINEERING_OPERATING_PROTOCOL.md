# PROTOCOLO OPERATIVO PERMANENTE DE INGENIERÍA · YOURMEAL OS
## GOBERNANZA TÉCNICA, CICLO DE VIDA DE BLOQUES Y PROTOCOLO DE CERTIFICACIÓN MULTIPROVEEDOR

---

## 0. Principio Fundamental & Regla de Oro

> **"Nunca optimices por velocidad sobre verificabilidad."**  
> **"Nunca certifiques por intención. CERTIFICA POR EVIDENCIA."**

El estándar inmutable de ingeniería de YourMeal OS exige la siguiente secuencia canónica para cualquier desarrollo, infraestructura, inquilino (tenant), seguridad o despliegue:

```text
INSPECT
  ↓
CONTRACT GATE (Strict Read-Only)
  ↓
IMPLEMENT
  ↓
TEST (Typecheck, Lint, Vitest, Build, Diff)
  ↓
ADVERSARIAL RED TEAM
  ↓
HARDEN
  ↓
FOUNDATION UPDATE
  ↓
PR (Branch aislada)
  ↓
HUMAN REVIEW GATE (Strict Stop)
  ↓
MERGE (Solo tras aprobación humana)
  ↓
MAIN VERIFY (Sincronización local)
  ↓
PROVIDER RECONCILIATION GATE (GitHub + Supabase + Cloudflare)
  ↓
DEPLOY
  ↓
LIVE BREAK TEST
  ↓
CERTIFY
  ↓
FREEZE
```

Ninguna etapa puede ser omitida silenciosamente.

---

## 1. Definición y Ciclo de Vida de Bloques

Cada tarea de ingeniería debe pertenecer a un **BLOQUE** formalmente definido con:
* Objetivo claro y justificación de negocio.
* Alcance exacto y lista explícita de **NO INCLUIDO** (Non-Goals).
* Dominios de negocio e infraestructura afectados.
* Invariantes de aislamiento, RBAC e idempotencia.
* Criterios de aceptación y tests de regresión.
* Impacto de despliegue y plan de reversión (Rollback).

---

## 2. Compuertas de Control y Parada Estricta (`Strict Stop Rules`)

El agente debe detenerse (`STRICT STOP`) y esperar validación humana explícita en las siguientes compuertas:
1. **Tras Inspección y Contract Gate:** No escribir código sin aprobación del contrato.
2. **Tras Implementación y Red Team:** Presentar resultados antes de crear PR.
3. **Tras Creación de PR:** Detenerse obligatoriamente. No mergear ni desplegar.
4. **Tras Merge:** Sincronizar rama `main` y reconciliar proveedores antes de desplegar.
5. **Tras Live Certification:** Bloque congelado (`FREEZE`). No realizar cambios sin reabrir formalmente el bloque.

---

## 3. Reconciliación Multiproveedor (`Provider Reconciliation Gate`)

Antes de cualquier despliegue o certificación, se deben auditar directamente las APIs/CLI de los tres proveedores:

### A. GitHub (`gh api`)
* Repositorio y rama correctos (`YourMeal-OS` vs `YourMeal-<Tenant>`).
* Commit SHA exacto.
* Cero fugas de código o duplicación indebida.

### B. Supabase (`npx supabase`)
* Proyecto y región exactos (`djangucecsphnejplvic` en Londres vs proyecto dedicado de cliente en Frankfurt, etc.).
* Esquemas, migraciones aplicadas y políticas RLS activas.
* Conteo de filas de base de datos en tiempo real (auditoría de estado vacío o datos autorizados).
* Almacenamiento seguro en Storage buckets privados con RLS.

### C. Cloudflare (`npx wrangler`)
* Worker y versión exacta activa con 100% de tráfico.
* Rutas y Custom Domains asignados.
* **Huella de Bundles Cliente (Client Bundle Fingerprint):** Verificar que los assets JavaScript servidos en el edge no contengan URLs o referencias horneadas a bases de datos equivocadas (prevención de Split-Brain).

---

## 4. Frontera Canónica de Instancias: Demo vs Clientes Reales

```text
====================================================================================================
MODELO PERMANENTE DE INSTANCIAS
====================================================================================================

1. YOURMEAL OS OFICIAL DEMO (`yourmeal-os`):
   • Repositorio:   losrealesplus/YourMeal-OS
   • Supabase:      djangucecsphnejplvic (Región: eu-west-2)
   • Finalidad:     Showcase comercial, demostración interactiva oficial y desarrollo Core.
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

## 5. Formato de Reporte de Certificación Final

Cada bloque completado debe concluir con un **BLOCK REPORT** que detalle:
1. Objetivo y Alcance.
2. Arquitectura e Invariantes.
3. Archivos modificados y documentación de Fundación actualizada.
4. Estado en GitHub, Supabase y Cloudflare con SHAs e IDs auditados.
5. Resultados de Quality Gates y Adversarial Red Team.
6. Estado HTTP en vivo y Live Break Tests.
7. Clasificación final: 🟢 **CERTIFIED** | 🟡 **HARDENING REQUIRED** | 🔴 **BLOCKED**.
