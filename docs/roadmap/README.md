# Roadmap Maestro — YourMeal OS

## Hitos históricos

| Milestone | Estado |
|-----------|--------|
| Blueprint | ✅ |
| Foundation | ✅ *(documento vivo)* |
| Foundation Lock | ✅ |
| Product Philosophy | ✅ |
| Ubiquitous Language | ✅ |
| ACTORS | ✅ |
| ENTITY_GUIDELINES | ✅ |
| DOMAIN_DONE | ✅ |
| Primera entidad (`Dish`) | ✅ Domain Done |
| **Foundation Validation** | ✅ |

> **Foundation Validation ✅** — hito histórico: donde dejó de construirse la metodología y empezó a construirse el producto.  
> Acta: [MILESTONE_VALIDACION_DOMINIO_DISH.md](../00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md)

A partir de este hito, el foco pasa del **metamodelo** al **dominio del negocio** (qué necesita una cocina), heredando la forma de construir ya validada.

---

## Estado actual

```text
FASE 0 — FUNDACIÓN
────────────────────────────────
Blueprint                     ✅
Foundation                    ✅  (vivo)
Foundation Lock               ✅
Foundation Validation         ✅  ← hito histórico cerrado

ESTADO FASE 0 (metodología):
🟢 Validada
```

A partir de aquí no rediseñamos la forma de construir salvo ADR. Foundation sigue evolucionando como documento vivo.

---

## FASE 1 — Core v0.1 (EatClean)

> **Objetivo:** entregar una aplicación que resuelva al 100 % las necesidades reales de EatClean y, al mismo tiempo, fortalezca el Core para futuros clientes.

### Module 01 · Dish Library

```text
1. Dominio (documentado)          ✅
2. Lenguaje del dominio           ✅
3. Entidad Dish (Domain Done)     ✅
4. Repository Guidelines          ✅
5. DishRepository.md (contrato)   ✅
6. DishRepository.ts (interface)  ✅
7. Application Layer Guidelines   ✅
8. DishApplication.md (casos de uso) ✅
9. DishApplicationService / Use Cases ⏳  ← siguiente
10. Application Tests
11. Infrastructure Adapter (Supabase…)
12. Infrastructure Tests
13. Primera integración
14. UI MVP
15. Ingredient Library
16. Recipe Builder
```

**Meta de la fase:** terminar un catálogo de platos sólido, no una pantalla bonita.

**Orden Application (misma disciplina):**

```text
Dish Management Application ✅ → Infrastructure Validation ✅ → Integration / UI ⏳
```

> Core independiente de la tecnología. Supabase = primer adaptador, no una decisión de negocio.

> Planificación: Platform → Capabilities → Use Cases → Domain → Infrastructure.  
> Primero evidencia; después abstracción.

**Segundo gran principio a validar:** Integration Validation con EatClean como profesor del Core.
Luego: **Segunda Capability** cuando el producto lo pida.

### Module 02 · Weekly Planning

Capacidades:

- Calendario semanal
- Planificación
- Producción prevista
- Personas
- Turnos
- Carga de cocina

### Module 03 · Orders

Capacidades:

- Clientes
- Suscripciones
- Pedidos
- Cambios
- Cancelaciones
- Historial

### Module 04 · Kitchen Production

Capacidades:

- Producción diaria
- Lotes
- Estados
- Tareas
- Trazabilidad

### Module 05 · Inventory

Capacidades:

- Stock
- Entradas
- Salidas
- Mermas
- Caducidades

### Module 06 · Purchasing

Capacidades:

- Proveedores
- Compras
- Recepciones
- Costes

### Module 07 · Logistics

*Dormido para EatClean si no es necesario.*

Capacidades:

- Rutas
- Repartidores
- Vehículos
- Entregas
- Seguimiento

### Module 08 · Consumer Portal

Capacidades:

- App del Consumidor / Beneficiario
- Pedidos
- Seguimiento
- Notificaciones

### Module 09 · Reports

Capacidades:

- KPIs
- Costes
- Producción
- Ventas
- Rentabilidad

### Module 10 · AI

Capacidades:

- Predicción de demanda
- Optimización
- Recomendaciones
- Automatizaciones

---

## Evolución del Core

Cada módulo debe cumplir esta regla:

```text
Problema real de EatClean

↓

Nueva capacidad

↓

Se incorpora al Core

↓

Disponible para futuras Organizaciones
```

Nunca desarrollaremos algo porque “algún día podría hacer falta”. Solo cuando un caso real lo justifique.

## Evolución empresarial

Mientras el Core madura:

```text
Organización 001
EatClean

↓

Organización 002

↓

Organización 003

↓

Organización 010

↓

Organización 050

↓

Organización 100
```

Con cada implantación:

- mejora el Core;
- mejora la documentación;
- mejora FOUNDATION;
- mejora la experiencia de implantación.

## El verdadero KPI del proyecto

No mediremos el éxito por el número de pantallas. Lo mediremos por cuatro indicadores:

1. **Valor para la Organización**  
   ¿Cuánto tiempo, dinero o esfuerzo ahorra EatClean?

2. **Fortaleza del Core**  
   ¿Cuántas capacidades reutilizables hemos incorporado sin romper la arquitectura?

3. **Reutilización**  
   ¿Qué porcentaje de lo construido puede aprovechar la siguiente Organización sin modificaciones?

4. **Aprendizaje**  
   ¿Qué conocimiento nuevo hemos obtenido y documentado para mejorar el siguiente despliegue?

## Principio rector del roadmap

> **Cada línea de código debe cumplir al menos una de estas dos condiciones:**
>
> 1. Aportar valor directo a la Organización actual.
> 2. Fortalecer el Core para las futuras Organizaciones.
>
> Si no cumple una de ellas, no debe implementarse.

## Misión v0.1

```text
Construir la mejor plataforma posible para EatClean.

No para impresionar.
No para vender.
No para escalar.

Sino para resolver perfectamente el problema real del primer cliente.

Todo lo que aprendamos durante esa implantación pasará a formar parte del Core
y hará que el segundo cliente reciba una plataforma mejor que la del primero.
```

## Regla desde v0.1.0

La arquitectura es estable. No se rediseña la base: se construye sobre ella. Todo cambio estructural → **nuevo ADR**.

## Mentalidad

| Antes | Ahora |
|-------|--------|
| Construir la empresa | **Construir el producto** |
| Infrastructure Driven | **Domain Driven** |
| Pensar en pantallas | Pensar en entidades |
| Pensar en CRUD | Pensar en negocio |

## Relacionado

- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
- [Estado](../00-status/README.md)
- [Foundation Lock](../05-architecture/FOUNDATION_LOCK.md)
- [Contexto estratégico](../05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md)
