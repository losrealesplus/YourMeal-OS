# Knowledge Corpus Manifest — KCM

**P0 · Reproducibilidad experimental de IOV.**

Antes de cualquier IOV-001 (piloto o humano) debe existir un KCM cerrado.

> **¿Qué documentación recibió exactamente el evaluador?**

Sin KCM, el experimento no es comparable dentro de seis meses.

---

## Regla

1. Congelar corpus **antes** de entregar el escenario.  
2. El evaluador recibe **solo** lo listado (rutas + versión/commit).  
3. Cualquier archivo fuera del manifesto = contaminación.  
4. Un IOV repetido usa el mismo KCM o un KCM nuevo explícitamente versionado.

---

## Plantilla

```markdown
# KCM-xxx — [Nombre de sesión IOV]

**IOV nivel:** 001 · 002 · 003  
**Fecha de congelación:** YYYY-MM-DD  
**Commit / tag:** …  
**Corpus label:** Operational Model Beta · …  
**Evaluador:** piloto IA · humano independiente  
**Autores en silencio:** Sí

## Archivos incluidos (exhaustivo)

| Ruta | Nota de versión / rol |
|------|------------------------|
| docs/17-operational-model/README.md | Índice |
| … | … |

## Explicitamente EXCLUIDO

- docs/16-operational-discovery/**
- docs/18-operational-validation/** (VS, VR, MC, gap)
- docs/19-independent-operational-validation/** (excepto este KCM si se entrega)
- docs/20-evidence-framework/**
- Diario · PRs · CHANGELOG · AGENTS.md · código
- Explicaciones orales / chat de autores

## Hash / commit ancla

`…`

## Entrega

- [ ] Zip / carpeta con solo rutas incluidas
- [ ] Escenario por escrito (separado)
- [ ] Reloj / hoja de tiempos
- [ ] Formulario de confianza post-sesión
```

---

## Índice de manifests

| ID | Sesión | Commit | Estado |
|----|--------|--------|--------|
| [KCM-001](./KCM-001-iov001-pilot.md) | IOV-001 piloto IA | `357833e` | 🔒 Congelado |

---

## Relacionado

- [05 Experimental Protocol](./05-experimental-protocol.md)  
- [IOV-001](./01-comprehension-validation.md)
