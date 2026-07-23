# PM-003 — Production

**Sprint:** 2.3  
**Estado:** 🔒 Tras PM-002  
**Depende de:** [PM-002](./PM-002-Admin-Suite.md)

---

## 1. Objetivo

Materializar la experiencia de **cocina / producción**: planificar y ejecutar el día sin inventar reglas Batch/Plan.

---

## 2. Alcance

**Incluye (UI):** Planning del día · Batch · Packaging · Labels · Kitchen views  

**Excluye:** Motor Batch/Plan real · optimizaciones · recall avanzado no Table-Validated como UI inventada · Fase D

---

## 3. Actores

Producción / cocina / envasado.

---

## 4. Capacidades

Ver plan del día · seguir lotes · identidad de unidad (etiqueta) · checks visibles como presentación de decisión (sin inventar PASS/BLOCK nuevos).

---

## 5. Objetos operacionales

Plan · Batch · Stock / Lot · Packaging · Label · Checks (presentación).

---

## 6. Restricciones

No inventar lifecycles.  
Estados completos.  
Reutilizar i18n / shell operativo que exista.  
Sin automatizaciones.

---

## 7. Referencias OM

`docs/17` Plan · Batch · Packaging · Label · Dynamics/Checks · matriz Producción.

---

## 8. Criterios de aceptación

- [ ] Flujos Planning → Batch → Packaging/Labels navegables  
- [ ] Checks como UI de decisión, no motor nuevo  
- [ ] Matriz actualizada · sin Fase D  

---

## 9. Entregables

Production UI revisable · sync repo.

---

## 10. Prompt Lovable

```text
PM-003 — Production
Materializa UI de Planning, Batch, Packaging, Labels y Kitchen
según Operational Model Table-Validated.
Experiencias completas. No inventes reglas ni motores Batch/Plan.
No Fase D. Incremento revisable tras PM-002.
```
