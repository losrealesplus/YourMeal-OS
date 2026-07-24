# ORS-001 · Operational Reference Scenario

**ID:** ORS-001  
**DICT:** [DICT-076 · Operational Reference Scenario](../99-reference/PROJECT_DICTIONARY.md#operational-reference-scenario)  
**Tipo:** Prueba operacional de referencia (activo principal de RI-001)  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md)  
**Gate:** [RI-001 Certification Gate](./RI001_CERTIFICATION_GATE.md)  
**Board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md)

> No es “un recorrido E2E más”.  
> Es la **prueba operacional de referencia**. Si ORS-001 falla, **RI-001 no puede certificarse**.

---

## Objetivo

```text
ORS-001
Operational Reference Scenario

Objetivo:
Demostrar que un tenant puede operar una jornada completa
utilizando YourMeal OS sin intervención del equipo de ingeniería.
```

---

## Flujo de referencia

```text
Cliente
    │
    ▼
Pedido
    │
    ▼
Kitchen Queue
    │
    ▼
Hoja de Producción
    │
    ▼
Kitchen Execution
    │
    ▼
Reparto
    │
    ▼
Entrega
    │
    ▼
Historial
```

Todo E2E futuro es una **variación** de este escenario, no un flujo distinto.

---

## Criterios de aceptación (explícitos)

| # | Criterio | ☐ |
|---|----------|:-:|
| 1 | SaaS Admin aprovisiona el tenant | ☐ |
| 2 | Company Admin configura la organización | ☐ |
| 3 | Se crean los actores operativos | ☐ |
| 4 | El cliente realiza un pedido | ☐ |
| 5 | La cocina lo procesa | ☐ |
| 6 | El reparto lo entrega | ☐ |
| 7 | El cliente visualiza el resultado (historial / repetir / favoritos según alcance) | ☐ |
| 8 | Toda la operación queda registrada y es **observable** | ☐ |

PASS ORS-001 = los 8 criterios con evidencia (sesión real · roles reales · datos reales · auditoría).

Ejecutor preferido: **no** el equipo de desarrollo (ops / producto / FOPEBA).

---

## Timeline operativo (EatClean)

```text
1. Cliente          T − X días     Pedido (menú semanal → confirma)
2. Cocina           Día −1 mañana  Kitchen Queue
3. Producción       Día −1 tarde   Hoja de Producción
4. Cocina (ejec.)   Día 0 mañana   Kitchen Execution → Finalizado
5. Reparto          Día 0 mediodía Entrega confirmada
6. Cliente          Día 0 tarde    Resultado visible · datos a Finanzas / Auditoría
```

---

## Observability acoplada

Durante la ejecución, las 7 preguntas de [Operational Observability](./EP_OPS_001_RELEASE_BOARD.md#-condición-transversal--operational-observability) deben poder responderse **con el sistema**.  
Fallar Observability ⇒ fallar criterio 8 ⇒ ORS-001 no PASS.

---

## Relación con Day-0

[Day-0 Provisioning](./EP_OPS_001_RELEASE_BOARD.md#day-0-provisioning-scenario) es la demostración pública que **incluye** ORS-001 (pasos 1–3 de aceptación + jornada 4–8).

---

## Regla de certificación

```text
ORS-001 FAIL  →  RI-001 no certificable
ORS-001 PASS  →  evidencia central del Certification Gate
```
