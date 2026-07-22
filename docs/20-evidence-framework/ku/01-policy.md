# KU-01 · Knowledge Update Policy

**Gobierno del conocimiento certificado** (Operational Model RC y posteriores).

---

## Pregunta que responde la política

> ¿Qué evidencia, bajo qué autoridad, puede alterar el conocimiento que ya declaramos Knowledge Certified?

---

## 1. Qué puede actualizar conocimiento

| Puede | Condición |
|-------|-----------|
| FO-E / FO-C que el [FER](../fov/04-field-evidence-review.md) envió a KU | Obligatorias |
| VR de mesa con evidencia estructural (pre-RC residual / hotfix tipográfico documentado) | Excepción estrecha |
| Repetición empírica que eleva ECL / Stability **sin** cambiar estructura | KUR de consolidación (sin MC) |

---

## 2. Qué no puede

| No puede | Por qué |
|----------|---------|
| Opinión de autor / «mejora obvia» sin FO/FER | Salta la evidencia |
| FO-V sola | Solo refuerza; no cambia |
| FO-U | Insuficiente |
| Chat, README ad hoc, demos, ventas | Contaminación |
| Editar Core / Aggregates / Dependencies / Lifecycles **en caliente** en campo | Salta Impact Analysis + MC |
| Carril B (UX/código) como «prueba» de dominio | Producto ≠ conocimiento |

---

## 3. Evidencia mínima

Para abrir un **Knowledge Candidate**:

1. Al menos una **FO** clasificada FO-E o FO-C (o paquete FER que las cite).  
2. **FER** con decisión «Abrir Knowledge Update» (o KUR-null si no hay candidatos).  
3. Respuesta a las **6 preguntas** de certificación (ver workflow).  
4. Si se propone MC: Impact Analysis escrito (objetos, invariants, capabilities tocadas).

Umbral material:

- **Repetible**, o  
- **Materialmente crítica** (seguridad alimentaria, cobro, identidad de unidad, legal), aunque sea un solo caso — documentar por qué.

---

## 4. Quién autoriza

| Rol | Autoridad |
|-----|-----------|
| Observador de campo | Emite FO; **no** autoriza KU |
| Sesión FER | Filtra candidatos; **no** edita `17` |
| Owner del Knowledge Update (CTO / Cursor en YourMeal OS) | Emite KUR · decide Archive vs MC |
| Model Change (gobierno VR→MC) | Único camino para alterar corpus `docs/17` |
| Gate G-01 | **No** inventa KU; consume KUR ya cerrados |

Conflicto con `.lovable/plan.md` u otras fuentes → gana `docs/` + esta política.

---

## 5. Principios

1. **Primero evidencia, luego decisión.**  
2. Carga de la prueba sobre el **cambio**, no sobre el RC.  
3. El modelo se defiende con rigor; **nunca** se protege de la evidencia.  
4. Toda decisión KU deja un **KUR** (incluido «sin cambios»).  
5. EC y G-01 no arrancan con FO-C estructural abierto sin KUR.

---

## Relacionado

- [02 Workflow](./02-workflow.md)  
- [03 KUR](./03-kur.md)
