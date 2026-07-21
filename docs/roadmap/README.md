# Roadmap Maestro — YourMeal OS

## Estado actual

```text
FASE 0 — FUNDACIÓN
────────────────────────────────

Blueprint                     ✅
Foundation                    ✅
Foundation Lock               ✅
Global Foundation             ✅
Constitución                  ✅
Arquitectura                  ✅
Metodología                   ✅
Contexto Estratégico          ✅

ESTADO:
🟢 Cerrado
```

A partir de aquí no volveremos atrás salvo mediante ADR.

---

## FASE 1 — Core v0.1 (EatClean)

> **Objetivo:** entregar una aplicación que resuelva al 100 % las necesidades reales de EatClean y, al mismo tiempo, fortalezca el Core para futuros clientes.

### Module 01 · Dish Library

```text
1. Dominio (documentado)          ✅
2. Lenguaje del dominio           🚧
3. Entidad Dish                   ⏳
4. Ingredient Library
5. Recipe Builder
6. Repository Interface
7. Domain / Application Services
8. Tests
9. Infrastructure
10. UI
```

**Meta de la fase:** terminar un catálogo de platos sólido, no una pantalla bonita.

**Orden dentro de Dish:**

```text
Language → Value Objects → Errors → State Machine → Entity
```

Luego, con la misma disciplina: **Ingredient** → **Recipe**.

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

### Module 08 · Customer Portal

Capacidades:

- App cliente
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

Disponible para futuros clientes
```

Nunca desarrollaremos algo porque “algún día podría hacer falta”. Solo cuando un caso real lo justifique.

## Evolución empresarial

Mientras el Core madura:

```text
Cliente 001
EatClean

↓

Cliente 002

↓

Cliente 003

↓

Cliente 010

↓

Cliente 050

↓

Cliente 100
```

Con cada implantación:

- mejora el Core;
- mejora la documentación;
- mejora FOUNDATION;
- mejora la experiencia de implantación.

## El verdadero KPI del proyecto

No mediremos el éxito por el número de pantallas. Lo mediremos por cuatro indicadores:

1. **Valor para el cliente**  
   ¿Cuánto tiempo, dinero o esfuerzo ahorra EatClean?

2. **Fortaleza del Core**  
   ¿Cuántas capacidades reutilizables hemos incorporado sin romper la arquitectura?

3. **Reutilización**  
   ¿Qué porcentaje de lo construido puede aprovechar el siguiente cliente sin modificaciones?

4. **Aprendizaje**  
   ¿Qué conocimiento nuevo hemos obtenido y documentado para mejorar el siguiente despliegue?

## Principio rector del roadmap

> **Cada línea de código debe cumplir al menos una de estas dos condiciones:**
>
> 1. Aportar valor directo al cliente actual.
> 2. Fortalecer el Core para los futuros clientes.
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
