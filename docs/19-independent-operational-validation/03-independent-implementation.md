# IOV-003 · Independent Implementation

**Paso 2 · Campaña de certificación** — [01](../00-status/01-certification-campaign.md)

> **No es un test de arquitectura.**  
> Es un test de **determinismo del conocimiento**.

---

## Pregunta correcta

No:

> ¿Las dos arquitecturas son iguales?

Sí:

> **¿El Operational Model restringe suficientemente el espacio de diseño para que dos personas independientes lleguen a soluciones conceptualmente equivalentes?**

---

## Hipótesis

> Si el conocimiento operacional está suficientemente formalizado, dos implementadores independientes producirán arquitecturas **conceptualmente equivalentes**.

---

## Evidencia previa (contexto de campaña)

| Fase | Estado | Confianza |
|------|--------|-----------:|
| Operational Validation | ✅ | Muy alto |
| IOV-001 transferible | ✅ | Alto |
| IOV-002 resistente | ✅ | Muy alto |
| **IOV-003 interpretable** | ✅ | Alto — [IVR-003](./ivr/IVR-003-iov003-independent-implementation.md) |
| Operational Model RC | ✅ | Knowledge Certified |

Tras IOV-002, el riesgo principal ya no era el dominio.  
Era la **interpretabilidad** — lo que midió este paso.

---

## Material

Exactamente el [KCM](./kcm/README.md) congelado (KCM-003).

**Nada más.** Sin conversaciones · README extra · explicaciones · reuniones.

---

## Participantes

Dos implementadores independientes (personas, IAs en conversaciones separadas, o mix).  
**Sin contexto compartido.**

---

## Entregables (no código)

Cada uno produce únicamente:

1. **Bounded Contexts** — ¿cuáles identifica?  
2. **Aggregate Roots** — ¿qué considera agregados?  
3. **Casos de uso** — ¿qué operaciones existen?  
4. **Repositorios** — ¿qué persiste?  
5. **Servicios de dominio** — ¿qué lógica no pertenece a entidades?  
6. **Dependencias** — ¿cómo se relacionan los módulos?

---

## Comparar conceptos, no nombres

`Planning Service` vs `Scheduling Engine` no son distintos si resuelven la **misma responsabilidad**.

---

## Matriz de comparación

| Aspecto | Coincide | Parcial | No coincide |
|---------|----------|---------|-------------|
| Core Objects | | | |
| Aggregate Roots | | | |
| Lifecycles | | | |
| Checks | | | |
| Dependencias | | | |
| Servicios | | | |

---

## Findings IOV-003 (clasificación específica)

No todos son «IF» genéricos:

| Código | Significado |
|--------|-------------|
| **IF-A** | Arquitectura diferente, **mismo** modelo |
| **IF-R** | Responsabilidad ambigua |
| **IF-D** | Dependencia interpretada de forma distinta |
| **IF-L** | Lifecycle interpretado de forma distinta |

Registro: [interpretation-findings](./04-findings/interpretation-findings.md).

---

## Criterios de aprobación

No exigimos identidad absoluta.

- Ningún **Core Object** divergente.  
- Ningún **Aggregate Root** incompatible.  
- Ninguna **Dependency** estructural contradictoria.  
- Ningún **Lifecycle** reinterpretado completamente.  
- Diferencias restantes justificables como **decisiones técnicas**, no como interpretaciones distintas del dominio.

---

## Tras IOV-003 satisfactorio

```text
Operational Model Beta (Table Validated)
        ↓
Operational Model Release Candidate (Knowledge Certified)
```

Ha superado: validación conceptual · transferencia · resistencia estructural · interpretación independiente.  
Siguiente juez: la **operación real** (FOV).

Antes de FOV: [Known Limitations RC](../00-status/03-known-limitations-rc.md).

---

## Estado

✅ **APROBADO** — [IVR-003](./ivr/IVR-003-iov003-independent-implementation.md) · IF solo IF-A · RC declarado.

---

## Relacionado

- [IOV-002](./02-adversarial-validation.md)  
- [RC](../00-status/02-operational-model-rc.md)
