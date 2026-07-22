# Dual Track — Antesala de la implementación

> **Estamos en la antesala de la implementación. No crucemos la puerta un día antes de tiempo.**

Hace semanas la respuesta era «todavía no».  
Hoy ya no. Pero **tampoco** es «empezad a programar motores de dominio».

---

## Cuerpo de evidencia (lectura)

| Señal | Estado |
|-------|--------|
| Validation Scenarios | 6/6 |
| Core Objects nuevos | **0** |
| Contradictions estructurales | **0** |
| IOV-001 | ✅ · IFD **0** |
| Findings | Documentación, **no** conocimiento |

Eso ya no es intuición. Es evidencia.

**Escenario B (el nuestro):** intentamos romper el modelo desde múltiples ángulos; las grietas aparecen siempre en el mismo sitio (docs / navegación), no en la espina.

---

## Dos carriles

### Carril A — Certificar Etapa 1 *(no construir más modelo)*

```text
IOV-002 → IOV-003 → Operational Model RC
    → FOV → Knowledge Update → Economic Confirmation → Gate G-01
```

Campaña: [01-certification-campaign](./01-certification-campaign.md).  
Orden fijo. Mentalidad: demostrar que **no hace falta añadir más**.

---

### Carril B — Soñar Etapa 2 *(permitido · con condición)*

> **No escribir lógica de negocio.**

Podéis avanzar sin comprometer el modelo:

| Área | Permitido |
|------|-----------|
| **UX** | Navegación · arquitectura visual · flujos · wireframes · Dashboard · Admin Suite |
| **Design System** | Componentes · tokens · iconografía · estados · responsive · a11y |
| **Arquitectura técnica** | Estructura repo · módulos · convenciones · interfaces · servicios · DI |
| **Infraestructura** | Supabase · auth · RBAC · observabilidad · CI/CD · analytics |

Foundation ya cubre parte de infra; Carril B **extiende** sin implementar espina.

---

## Lo que todavía se evita (Carril B)

No implementar todavía:

- Production Engine  
- Order Engine  
- Route Engine  
- Batch Engine  
- Planning Engine  

Esos motores dependen del conocimiento que IOV + FOV aún van a terminar de validar.

Dish Library / Module 01 ya validado es excepción histórica — no abrir nuevos motores de espina.

---

## YourMeal OS como instrumento

Al principio YourMeal OS era el objetivo.  
Ahora es el **instrumento** con el que se demuestra que FOPEBA funciona.

Si EatClean cambiara o desapareciera, el **proceso que reduce incertidumbre de forma medible** seguiría teniendo valor.

Cuando se abra Etapa 2 (G-01), el código será **consecuencia del conocimiento**, no su sustituto.

---

## Relacionado

- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [Gate G-01](../20-evidence-framework/07-gate-g01-operational-readiness.md)  
- [Estado](./README.md)
