# KCM-001 — IOV-001 piloto (corpus congelable)

**IOV nivel:** 001 · Comprehension  
**Propósito:** primera sesión (recomendado: **piloto IA ciego** antes de humano)  
**Corpus label:** Operational Model Beta (mesa)  
**Fecha de congelación:** *(rellenar al ejecutar)*  
**Commit ancla:** *(rellenar — ej. tras push de protocolo)*  
**Autores en silencio:** Sí  

---

## Archivos incluidos (exhaustivo)

Todo bajo `docs/17-operational-model/` en el commit ancla:

### Raíz
- `docs/17-operational-model/README.md`

### 01 Ubiquitous Language
- `01-ubiquitous-language/README.md`
- `01-ubiquitous-language/actors.md`
- `01-ubiquitous-language/commercial.md`
- `01-ubiquitous-language/operations.md`
- `01-ubiquitous-language/logistics.md`
- `01-ubiquitous-language/finance.md`

### 02 Core / Supporting / Config
- `02-core-objects/README.md`
- `02-core-objects/level-1-core.md`
- `02-core-objects/level-2-supporting.md`
- `02-core-objects/level-3-configuration.md`
- `02-core-objects/consistency-review.md`

### 03 Dependencies
- `03-relationships/README.md`
- `03-relationships/verbs.md`
- `03-relationships/spine-flow.md`
- `03-relationships/support-dependencies.md`
- `03-relationships/checks-at-edges.md`

### 04 Lifecycles
- `04-lifecycles/README.md`
- `04-lifecycles/spine-transitions.md`
- `04-lifecycles/support-transitions.md`
- `04-lifecycles/checks-on-transitions.md`
- `04-lifecycles/state-index.md`
- `04-lifecycles/transition-template.md`

### 05 Invariants
- `05-invariants/README.md`
- `05-invariants/constitution-index.md`
- `05-invariants/identity.md`
- `05-invariants/integrity.md`
- `05-invariants/temporal.md`
- `05-invariants/consistency.md`
- `05-invariants/property.md`
- `05-invariants/operation.md`

### 06 Capability Mapping *(incluido en Beta corpus)*
- `06-capability-mapping/README.md`
- `06-capability-mapping/capability-index.md`
- `06-capability-mapping/dish-management.md`
- `06-capability-mapping/traceability-template.md`

### 07 Operational Dynamics v0.2
- `07-operational-dynamics/README.md`
- `07-operational-dynamics/01-operational-lifecycles-2.0.md`
- `07-operational-dynamics/02-supporting-objects-taxonomy.md`
- `07-operational-dynamics/03-operational-checks-2.0.md`

---

## Explicitamente EXCLUIDO

| Excluido | Motivo |
|----------|--------|
| `docs/16-operational-discovery/**` | Discovery ≠ modelo |
| `docs/18-operational-validation/**` | VS/VR/MC sesgan al evaluador |
| `docs/19-independent-operational-validation/**` | Protocolo IOV — solo facilitadores |
| `docs/20-evidence-framework/**` | FOV/EC/G-01 fuera de IOV-001 |
| `docs/15-product/**` | Blueprint / Checks de producto (salvo lo ya reflejado en 17) |
| Diario · PRs · CHANGELOG · `AGENTS.md` · código | Conocimiento de autores / implementación |
| Cualquier explicación oral o chat de autores | Viola silencio |

---

## Checklist de entrega

- [ ] Commit ancla anotado  
- [ ] Carpeta/zip solo con rutas incluidas  
- [ ] Escenario cotidiano por escrito (fuera del zip de modelo)  
- [ ] Hoja de tiempos + formulario de confianza  
- [ ] Facilitador conoce [05 Experimental Protocol](../05-experimental-protocol.md)

**Estado:** 📝 Listo para congelar al lanzar piloto.
