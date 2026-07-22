# IVR-002 — IOV-002 Adversarial (piloto IA)

**Nivel:** IOV-002  
**Evaluador:** Piloto IA ciego (oposición)  
**KCM:** [KCM-002](../kcm/KCM-002-iov002-adversarial.md) · commit `3c4adb0`  
**Fecha:** 2026-07-22  
**Autores:** silencio  
**Mentalidad:** certificar  

**Readiness Review:** descubrir por qué podría fallar (no demostrar que funciona).

---

## Pregunta

> ¿Puede un tercero obligarnos a cambiar la estructura del modelo?

---

## Ataques recibidos (6)

| SF | Objetivo | Veredicto atacante | Clasificación certificación |
|----|----------|--------------------|-----------------------------|
| SF-001 | Core inbound finished | Forced Core | **Extended** docs · Core **rechazado** |
| SF-002 | INV-011 Batch→Plans | Unclear/Forced | **Resisted** |
| SF-003 | Lifecycle servery | Forced Lifecycle | **Clarified** |
| SF-004 | INV-015 dual Account | Forced INV | **Extended** docs |
| SF-005 | Core DietPrescription | Forced Core | **Resisted** (Core) |
| SF-006 | Dependency regenerate | Forced Dependency | **Resisted** · Clarified |

Detalle: [structural-findings](../04-findings/structural-findings.md).

---

## Resultado ejecutivo

| Métrica | Valor |
|---------|-------|
| Propuestas | 6 |
| Clasificadas | **6/6** |
| Hallazgos abiertos | **0** |
| Contradicted | **0** |
| Core Object nuevo forzado | **0** |
| Invariant roto sin steelman | **0** |

El atacante encontró la «parte blanda» (Batch→Packaging lineal, INV-015, dietas clínicas) pero **no obligó** a un Core de espina nuevo. Steelmans con Kitchen/Location/Stock/Label/Checks/Dynamics bastan; Extended = precisión documental hacia RC.

---

## Criterio de salida IOV-002

✅ Todas las propuestas: Resisted · Clarified · Extended · Contradicted  
✅ Ningún hallazgo abierto  
✅ Sin Contradicted que bloquee RC  

**IOV-002 cerrado.**

---

## Decisión de campaña

| Siguiente | Acción |
|-----------|--------|
| Ahora | **IOV-003** Independent Implementation |
| Docs opcionales pre-RC | Notas servery · funding Account · receive-and-portion (SF-001/003/004) |
| FOV | Sigue **cerrado** hasta IOV-003 + RC |

---

## Relacionado

- Narrativa atacante: agente `0cbece64-a403-471f-986a-f4fa213e1d36`  
- [01 Certification Campaign](../../00-status/01-certification-campaign.md)
