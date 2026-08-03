# Capacitor · Definition of Ready

**Documento:** `CAPACITOR_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ **DoR DOCUMENT** (este PR) · Spec 🔒 · Runner 🔒 · Gate 🔒 · código 🔒  
**Dominio:** **Distribution**  
**Nivel:** Infraestructura de distribución · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿Qué debe cumplir el proyecto para poder empezar la integración de Capacitor?  
**Metodología:** FOPEBA · [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Precondición:** tag `flow05-pass` · FLOW-05 Gate CLOSED · [FLOW_05_PASS_ACTA](../10-validation/flow-05/FLOW_05_PASS_ACTA.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md)

> Este PR responde **solo**: ¿queda definido el marco Ready del dominio Capacitor / Distribution?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** Gate.  
> **No** instala Capacitor. **No** toca `package.json`. **No** genera código.  
> **No** Android Studio. **No** Xcode. **No** certificados. **No** stores.

---

## 1. Objetivo del dominio Capacitor

Definir y, más adelante, certificar que YourMeal OS puede **distribuirse** como aplicación nativa instalable (Android / iOS) **sin modificar el comportamiento del SaaS certificado**.

Capacitor no es una funcionalidad de negocio.

Capacitor es **infraestructura de distribución**: un *native shell* que carga el mismo Core web ya certificado.

```text
Hasta flow05-pass:  El sistema es correcto.
A partir de aquí:   El sistema puede distribuirse.
```

---

## 2. Qué significa Distribution dentro de YourMeal OS

YourMeal OS se organiza en cuatro dominios permanentes:

| Dominio | Qué es | Ejemplos |
|---------|--------|----------|
| **Platform** | SaaS / identidad / multi-tenant | Auth · tenants · foundation |
| **Business** | Módulos funcionales | Orders · Recipes · Production |
| **Experience** | Recorridos certificados | FLOW-01…FLOW-05 |
| **Distribution** | Cómo se entrega el mismo producto | Capacitor · Appflow · builds nativos |

Capacitor pertenece **exclusivamente** a **Distribution**.

No reabre Platform, Business ni Experience salvo regresión certificada.

```text
Chrome / Web
        │
        ▼
  Core SaaS (React · TanStack · Supabase · Postgres)
        │
        ▼
    Capacitor          ← Distribution (este dominio)
        │
        ├── Shell Android
        └── Shell iOS
```

El usuario instala un icono nativo; el contrato de negocio sigue siendo el de FLOW-05 (y el resto de Flows ya certificados).

---

## 3. Principio arquitectónico (Contract Boundary · ancla)

```text
Core SaaS
    ↓
Capacitor
    ↓
Android / iOS
```

**Nunca al revés.**

| Regla | Significado |
|-------|-------------|
| Core no depende de Capacitor | El SaaS web sigue siendo completo y certificable sin shell nativo |
| Capacitor depende del Core | El shell carga / empaqueta el mismo producto |
| Capacidades nativas son capa | Cámara · GPS · biometría · push = ciclos posteriores, no dependencia estructural |
| UI ≠ contrato | La máquina de estados FLOW-05 no cambia por el canal de distribución |
| Tenant-agnostic | El contrato Distribution no nombra tenants; el branding pertenece al Tenant |

---

## 4. Alcance (marco DoR · no Freeze)

Este DoR define el **marco** para abrir Spec. No congela nombres de tokens ni entregas.

| Incluye (propuesto para el ciclo Capacitor) | Significa |
|---------------------------------------------|-----------|
| Native shell | Contenedor Android / iOS sobre el Core web |
| Integración Capacitor gobernada por FOPEBA | DoR → Spec → Runner → Gate → 001… → PASS |
| Build reproducible (criterio de Spec) | Misma fuente → artefacto verificable |
| Android + iOS como canales de shell | Presencia / empaquetado · no publicación en stores en v1 |
| Evidence before Implementation | Runner / evidencias antes de “ya está instalado” |

**Cadena institucional (igual que Track B · RELEASE-01 · FLOW-05):**

```text
DoR          ← este documento
  ↓
Spec
  ↓
Freeze
  ↓
Runner
  ↓
Gate
  ↓
001 … N
  ↓
PASS
```

**Bloques candidatos (borrador · Spec congela orden y cortes):**

```text
001  Shell Foundation
002  Android
003  iOS
004  Native Bridge (mínimo · sin features de dispositivo)
005  Build Reproducibility
  ↓
PASS
```

---

## 5. Fuera de alcance (explícito)

En este DoR y en el **primer ciclo Capacitor** (hasta PASS) **no** entran:

| Fuera | Motivo |
|-------|--------|
| App Store / Google Play publicación | Ciclo posterior (Distribution · stores) |
| Push Notifications | Capacidad nativa posterior |
| Deep Links | Capacidad nativa posterior |
| Biometría | Capacidad nativa posterior |
| Cámara · GPS · Background Tasks | Capacidad nativa posterior |
| Reescritura del Core / segunda app React | Viola Core → Capacitor |
| Nueva lógica de negocio “porque es móvil” | Pertenece a Business / Experience |
| Re-certificar FLOW-05 / RELEASE-01 / Track B | Ya cerrados; solo regresión |
| Spec · Runner · Gate · scripts · `package.json` · installs | Fuera de **este** PR (DoR only) |
| Certificados de firma · perfiles de provisioning · CI Appflow ejecutable | Spec / entregas posteriores · no DoR |

**Regla anti-crecimiento:** si no es shell / empaquetado / bridge mínimo / build reproducible, **no entra** en el primer ciclo sin renegociar Spec Freeze.

---

## 6. Dependencias

| Dependencia | Estado | Rol |
|-------------|--------|-----|
| Foundation / Platform | ✅ | Core SaaS operable |
| `release-01-pass` | ✅ | Producto SaaS certificado |
| `flow05-pass` | ✅ | Primer recorrido funcional completo certificado |
| FLOW-05 Gate CLOSED | ✅ | Experience lista para canal adicional |
| Appflow / proyecto Capacitor (infra externa) | ◐ puede existir | **No** sustituye FOPEBA; debe gobernarse por Spec/Runner |
| Spec Capacitor | 🔒 | Siguiente artefacto tras merge de este DoR |
| Runner / Gate Capacitor | 🔒 | Tras Spec FROZEN |

Capacitor **consume** el Core ya certificado.  
No lo reimplementa ni lo condiciona.

---

## 7. Riesgos

| Riesgo | Mitigación (DoR) |
|--------|------------------|
| Tratar Capacitor como feature de producto | Dominio **Distribution** · principio Core → Capacitor |
| Acoplar el Core a APIs nativas | Prohibido en v1; native features = ciclos posteriores |
| Empezar por stores / certificados | Fuera de alcance hasta PASS de shell/build |
| Tenant coupling (nombre de cliente en el contrato) | Contrato tenant-agnostic · brand en Tenant |
| Saltar DoR → instalación directa | FOPEBA obligatorio · Land Check desde `main` |
| Duplicar app (“versión móvil” distinta) | Un solo Core · shell solo empaqueta / carga |
| Confundir “abre en dispositivo” con CERTIFIED | Runner + evidencias + PASS tag |

---

## 8. Criterios para abrir el Spec

Abrir **Capacitor Spec** solo cuando:

```text
1. Este DoR esté mergeado en main (DoR CERTIFIED vía Land Check documental)
2. La pregunta única no cambie de nivel
   (distribución del SaaS · no negocio · no stores)
3. El Spec proponga contrato por bloques (shell · Android · iOS · bridge · build)
   sin incluir Push / Deep Links / Biometría / Cámara / GPS / Background
4. El Spec respete el Contract Boundary:
   Core SaaS → Capacitor → Android / iOS
5. El Spec declare PASS / BLOCKED esperados y paths de evidencia
   (docs/10-validation/… · sin inventar dominio Business)
6. No se instale Capacitor ni se modifique package.json
   hasta Gate READY + apertura de 001 (igual que Flows / RELEASE)
```

Cumplido el DoR en `main`:

```text
READY TO OPEN
Capacitor Spec only
No Runner · No Gate · No 001 · No install · No stores
```

---

## 9. Contract Boundary (resumen)

### Dónde empieza Distribution / Capacitor

```text
START = Core SaaS ya certificado (flow05-pass · release-01-pass)
        y se decide empaquetar / cargar ese Core en un native shell
```

No empieza en un módulo de negocio.  
No empieza en una store listing.  
No empieza reescribiendo React.

### Dónde termina el primer ciclo (propuesto)

```text
END = Shell nativo + builds Android/iOS reproducibles certificados
      (PASS del dominio Capacitor · tag a definir en Spec)
```

No termina en “publicado en stores”.  
No termina en push / biometría / cámara.  
No termina en un FLOW de negocio nuevo.

### Qué certifica (más adelante · Spec)

- Presencia del shell sobre el Core.
- Integridad: el comportamiento de negocio no se redefine en Distribution.
- Canales Android e iOS como empaquetado.
- Reproducibilidad de build (criterio Spec).

### Qué no certifica

- Experiencia FLOW-05 (ya `flow05-pass`).
- Producto RELEASE-01 (ya `release-01-pass`).
- Publicación en stores.
- Capacidades nativas de dispositivo.

---

## Definition of Ready (checklist de apertura)

Para el dominio Capacitor / Distribution:

```text
CAPACITOR
☑ Precondición flow05-pass                 ✅
☑ DoR documental                           ▶ este PR · CAPACITOR_DOR.md
□ Spec congelada                           → siguiente PR
□ Contrato de evidencias definido          → Spec
□ Runner creado                            → tras Spec FROZEN
□ Gate READY                               → tras Runner en main
□ PASS / BLOCKED esperados                 → Spec
□ Acta / evidence paths                    → Spec · docs/10-validation/
```

Sin Spec FROZEN + Runner en `main` + Gate READY → ❌ no abrir `001` ni instalar Capacitor.

---

## Next

```text
Merge este DoR
    ↓
Land Check (documento en main)
    ↓
Capacitor Spec only
    ↓
Freeze → Runner → Gate → 001 Shell Foundation …
```

---

## End of Capacitor DoR
