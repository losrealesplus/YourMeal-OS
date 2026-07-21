# Product Era — el Core deja de ser el protagonista

Fecha: 2026-07-21  
Versión: v0.1.0  
Ámbito: Transversal (estado del proyecto)  
Estado: Canónico

---

## ¿Qué es?

Cierre oficial de la **Foundation Era** (validación arquitectónica) y apertura de la **Product Era**.

No es un cambio en Foundation.  
Es un cambio de **etapa** y de preguntas.

## ¿Cómo es?

### Foundation Era ✅ — tres exámenes

1. **Domain Validation** — el negocio puede definirse antes que el código.
2. **Repository Validation** — la persistencia puede definirse desde el dominio.
3. **Infrastructure Validation** — la tecnología puede adaptarse al Core sin modificar el Core.

Dirección de la dependencia demostrada:

```text
Negocio → Core → Infrastructure → Base de datos
```

### Product Era ⏳

```text
Integration → UI MVP → EatClean Pilot → Operational Feedback
        → Capability 2 → Capability 3 → Platform Evolution
```

## ¿Por qué existe?

Hasta ahora el profesor fue la metodología.  
A partir del piloto, el profesor es la **realidad operativa**.

## ¿Para qué sirve?

Orientar el desarrollo hacia evidencia de cocina real, no hacia más capas.

## Objetivos

- Registrar el cambio de etapa en el estado del proyecto.
- Cambiar el tipo de preguntas (operación > arquitectura).
- Exigir evidencia multi-capability / multi-organización antes de nuevas estructuras.

## Reglas

- No tocar Foundation «por completitud».
- Primero evidencia; después abstracción.
- El Core evoluciona cuando EatClean (u otra Organización) demuestra la necesidad.

## Dependencias

- Infrastructure Validation ✅
- Dish Management Core listo para Integration / UI

## Futuro

EatClean Pilot = primera familia en la casa.  
Las siguientes plantas se mejoran con lo que esa familia enseña.

## Decisiones tomadas

1. Fin oficial de la etapa de Validación Arquitectónica.
2. Inicio de Product Era / Product Validation.
3. Cita histórica preservada: infra se adapta al dominio, no al revés.
