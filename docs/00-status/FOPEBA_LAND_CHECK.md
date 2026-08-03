# FOPEBA · Land Check

**Documento:** `FOPEBA_LAND_CHECK.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **ACTIVE** · Criterio formal antes de cualquier `001`  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) **Regla 9**  
**Complementa:** [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)

> `main` certifica; las ramas solo proponen.  
> Un Gate nunca se cierra porque un PR pase.

---

## Propósito

Antes de abrir cualquier incremento `001` (Flow o Release), comprobar de forma  
**reproducible** que el contrato (Spec + Runner) ha aterrizado en `main`.

Aplica a:

| Nivel | Ejemplos |
|-------|----------|
| Platform | PS / FCR runners |
| Business Flow | `test:flowNN-canonical` |
| Release capability | `test:release-smoke` · futuros crossflow / e2e / deploy / rollback |
| Futuras releases | cualquier runner canónico de producto |

---

## Procedimiento (obligatorio)

```text
FOPEBA Land Check

Antes de cualquier certificación / 001 / tag:

0. (Si hubo Android Studio / Xcode)
   Cerrar IDE si sigue escribiendo archivos · git status
   → restore / limpiar Native Tool Artifacts (FOUNDATION.md)
   → working tree clean

1. git restore docs/**/evidence/*.json   (si aplica)
   git pull origin main

2. git fetch --tags --prune
   (sincroniza anchors -pass remotos; evita falsos negativos
    cuando el tag existe en origin pero no localmente)

3. Ejecutar el runner canónico desde main.

Si ocurre cualquiera de estas dos situaciones:

- Missing script
- Runner inexistente

⇒ El contrato no ha aterrizado en main.
   El Gate permanece NOT READY.

Solo cuando el runner existe y produce exactamente el estado esperado
(normalmente BLOCKED en el primer token / escenario)
puede abrirse el incremento 001.
```

### Native Tool Artifacts (Distribution)

Tras Capacitor (`capacitor-pass`), Android Studio y Xcode pueden dejar diffs locales
(Gradle sync, SwiftPM). Esos archivos **no** bloquean el producto, pero **sí** bloquean
`git pull` y un Land Check limpio hasta evaluarlos.

Ver: [FOUNDATION.md](../../FOUNDATION.md) · **Native Tool Artifacts Rule**.

### Comandos

```bash
git restore docs/**/evidence/*.json 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:<gate-script>
```
### Lectura de resultados

| Resultado desde `main` | Significado | Gate |
|------------------------|-------------|------|
| `npm ERR! Missing script` | Contrato no aterrizado | 🔴 NOT READY |
| Script ausente / archivo runner no existe | Contrato no aterrizado | 🔴 NOT READY |
| Runner → **BLOCKED** en el primer paso esperado · arrays vacíos · exit 2 | Contrato certificado en `main` | 🟢 READY (abrir `001`) |
| Runner → **FAIL** / `blocked_at` incorrecto | Contrato roto o incompleto | 🔴 NOT READY |
| Solo “Merged” en GitHub sin verificación | Insuficiente | 🔴 NOT READY |

---

## Evidencias FOPEBA

Dos señales técnicas sencillas se convierten en criterio de gobernanza:

```text
Missing script
        ⇒  contrato aún no en main · Gate NOT READY

Runner ejecuta y BLOCKED (estado esperado)
        ⇒  contrato certificado en main · puede abrirse 001
```

No sustituyen Spec, Freeze ni acta.  
Son el **land check** obligatorio entre Runner merge y Implementation.

---

## Incidentes de referencia

| Caso | Síntoma | Corrección |
|------|---------|------------|
| FLOW-02 · #149 → #150 | Merged fuera de `main` | Land PR → `main` |
| FLOW-03 · #156 → #157 | Stacking ≠ land | Land PR → `main` |
| RELEASE-SMOKE · #169–#171 → #172 | `Missing script: test:release-smoke` | Land PR #172 → `main` · luego BLOCKED verificado |

---

## Relación con el ciclo

```text
DoR → Spec → Freeze → Runner
        ↓
   FOPEBA Land Check  (este documento · desde main)
        ↓
   Gate READY
        ↓
   001 → 002 → 003 → PASS → Tag
```

Sin Land Check verde → ❌ no abrir `001`.

---

## End of FOPEBA Land Check
