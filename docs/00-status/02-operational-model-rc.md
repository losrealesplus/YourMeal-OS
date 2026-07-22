# Operational Model Release Candidate (RC)

**Paso 3** de la [campaña de certificación](./01-certification-campaign.md).

RC **no** significa «está perfecto».

Significa:

> **No conocemos razones suficientemente fuertes para modificarlo antes del trabajo de campo.**

Nombre completo tras IOV-003:

> **Operational Model Release Candidate (Knowledge Certified)**

Ha superado: validación conceptual · transferencia (IOV-001) · resistencia (IOV-002) · interpretación independiente (IOV-003).

Publicar junto al acta: [Known Limitations RC](./03-known-limitations-rc.md).

---

## Prerrequisitos

- ✅ IOV-001 (IVR-001)  
- ✅ IOV-002 (IVR-002) — hallazgos clasificados · sin Forced concession abierta  
- ✅ IOV-003 (IVR-003) — equivalencia conceptual aceptable  

---

## Qué se congela

| Artefacto | Carpeta |
|-----------|---------|
| Ubiquitous Language | `17/01` |
| Core · Supporting · Config | `17/02` |
| Dependencies | `17/03` |
| Lifecycles · Dynamics | `17/04` · `17/07` |
| Invariants | `17/05` |
| Operational Checks (en modelo) | `17/04` · `17/07/03` |
| Capability Mapping (marco) | `17/06` |

**KCM-RC** + tag git `operational-model-rc-v0.x`.

---

## Qué ya no cambia

Nada del corpus congelado **hasta terminar FOV** (salvo hotfix de errata tipográfica documentada).

MC solo vía FOV → Knowledge Update (4+6 preguntas).

---

## Acta (plantilla)

```markdown
# Operational Model RC

**Fecha:** …
**Tag:** operational-model-rc-v…
**Commit:** …
**IVR:** 001 · 002 · 003

## Declaración

No conocemos razones suficientemente fuertes para modificar el Operational Model
antes del trabajo de campo (FOV).

## Firmas / sesión
…
```

**Estado:** ⏳ Pendiente IOV-002/003.
