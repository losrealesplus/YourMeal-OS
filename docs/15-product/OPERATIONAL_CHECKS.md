# OPERATIONAL_CHECKS — Unidad mínima de inteligencia de YourMeal OS

**Tipo:** concepto transversal del Product Blueprint  
**Ubicación:** `docs/15-product/` (identidad de producto)  
**No es:** un cuarto pilar · Discovery · Foundation · una Capability · una capa de arquitectura  
**Sí es:** la **unidad mínima de valor operativo** del producto — y el mecanismo que transforma datos en acciones recomendadas

```text
FOUNDATION              → cómo construir
PRODUCT BLUEPRINT       → qué construir
OPERATIONAL DISCOVERY   → por qué evolucionar (evidencia)
Operational Checks      → unidad mínima de valor operativo (transversal)
```

| Mundo | Unidad mínima |
|-------|----------------|
| Técnica | Entity · Repository · Use Case |
| Producto / operación | **Operational Check** |

Igual que los Use Cases son un concepto transversal de la arquitectura, los Operational Checks son un concepto transversal del **producto**.

No crecen la documentación como un pilar nuevo. Viven dentro del Blueprint.

---

## Dos arquitecturas, un idioma

### Técnica

```text
Capability
    ↓
Use Cases
    ↓
Domain
    ↓
Infrastructure
```

### Producto

```text
Operational Discovery
        ↓
Operational Check
        ↓
Operative Assistant
        ↓
Capability
```

### Trazabilidad (ejemplo)

```text
Observación
        ↓
OF-017  «Se olvidó descongelar el pollo»
        ↓
Operational Check  «¿Hay que descongelar pollo hoy?»
        ↓
Production Assistant
        ↓
Production Preparation Capability
        ↓
Use Cases → Implementación
```

El backlog sale de la cocina, no de un brainstorming.

---

## Gate mecánico (toda propuesta nueva)

Antes de debatir una funcionalidad:

1. **¿Existe evidencia en Operational Discovery?** → Si no, observar primero.  
2. **¿Qué pregunta elimina?** → Si ninguna, probablemente no pertenece.  
3. **¿Puede resolverse mediante un Operational Check?** → Si sí, definir el Check.  
4. **¿Qué Capabilities necesita ese Check?** → Solo entonces entra en el Core.

Evita desarrollo por intuición y exceso de abstracción.

---

## Definición

> **Un Operational Check es una validación lógica ejecutada automáticamente por YourMeal OS para comprobar que una operación puede continuar con seguridad, eficiencia y sin depender de la memoria humana.**

No genera informes.

No muestra métricas.

No toma decisiones.

**Comprueba.**

Y cuando encuentra una desviación:

- explica el motivo;
- indica el riesgo;
- propone una acción.

La decisión final sigue siendo de la persona.

Un Check **no** implica que exista un error. Implica que algo necesita atención — o que está en orden.

---

## Filosofía

> **YourMeal OS no intenta ser más inteligente que el usuario. Intenta recordar todo aquello que el usuario no debería tener que recordar.**

Y el lema operativo:

> **No mostramos datos. Confirmamos que la operación puede continuar.**

Los Checks no son avisos, no son widgets y no son IA.

Son la manera en que YourMeal OS demuestra, de forma transparente y explicable, que una cocina puede seguir trabajando con confianza porque las comprobaciones importantes ya se han hecho.

---

## Por qué existen

> **El primer reto no es automatizar. Es conseguir que la gente confíe en el sistema.**

La confianza no la genera una IA.

La genera que, durante semanas, el sistema **acierte siempre en cosas sencillas**.

Los Checks son esas cosas sencillas.

---

## Principios

### 1. Todo Check protege una operación

Nunca existe un Check porque sí.

Siempre protege un proceso real: producción · compras · packaging · reparto · facturación · cierre · menú.

### 2. Todo Check elimina una pregunta

❌ «¿Queda suficiente pollo?»  
✔ El sistema ya lo comprobó.

### 3. Todo Check termina en una acción

Nunca solo:

```text
Stock insuficiente.
```

Siempre:

```text
Comprar 12 kg de pollo antes de las 17:00.
```

(O la confirmación útil: «todo en orden — no hace falta actuar».)

### 4. Todo Check debe poder explicarse

El usuario siempre puede preguntar **¿Por qué?** y ver los datos y la regla:

```text
Pedidos confirmados: 104
Consumo por ración: 220 g
Merma: 8 %
Necesario: 24,7 kg
Disponible: 18 kg
```

La confianza nace de la transparencia.

### 5. El usuario decide

Nunca:

```text
Se ha generado automáticamente una compra.
```

Siempre:

```text
Recomendación: Comprar.
[Aceptar]  [Posponer]  [Ignorar]
```

### 6. Los Checks viven en las transiciones

Validan el **paso** de un estado a otro — no el estado en sí.

❌ Check «Order Confirmed»  
✔ ¿**Puede confirmarse** este Order?

Detalle: [Lifecycles · transiciones](../17-operational-model/04-lifecycles/checks-on-transitions.md).

**Dynamics v0.2 — resultados del Check:** PASS · WARNING · BLOCKED · **MANUAL DECISION**  
→ Next Transition. Ver [Operational Checks 2.0](../17-operational-model/07-operational-dynamics/03-operational-checks-2.0.md).

### 7. Los Invariants gobiernan

Un Check puede **bloquear** una transición.  
Nunca puede **autorizar** lo que un [Invariant](../17-operational-model/05-invariants/README.md) prohíbe.

```text
Invariant → Lifecycle → Operational Check → Capability
```

Los Checks ayudan. Los Invariants gobiernan.

---

## Anatomía estándar

Todos los Operational Checks comparten la misma estructura:

| Campo | Qué responde |
|-------|----------------|
| **Nombre** | Identidad del Check |
| **Objetivo** | Qué operación protege |
| **Momento operativo** | Cuándo se ejecuta / se muestra |
| **Pregunta que elimina** | Qué deja de depender de la memoria |
| **Datos necesarios** | Qué sabemos |
| **Regla lógica** | Qué se comprueba |
| **Resultado posible** | ✓ / ⚠️ / ❌ (y variantes) |
| **Acción sugerida** | Qué hacer si hay desviación |
| **Capabilities implicadas** | De dónde salen los datos |
| **Nivel de criticidad** | Info · Atención · Bloqueante |

Filtro de diseño (además de *¿qué pregunta elimina?*):

> **¿Qué comprueba, por qué lo comprueba y qué acción permite tomar?**

---

## Patrón universal (toda Capability)

| # | Pregunta | Qué es |
|---|----------|--------|
| 1 | **¿Qué sabemos?** | Datos |
| 2 | **¿Qué debemos comprobar?** | Checks |
| 3 | **¿Qué necesita atención?** | Acciones |

---

## Ciclo de vida

```text
Operational Discovery
        ↓
Patrón validado
        ↓
Nuevo Operational Check
        ↓
Capability (si hace falta)
        ↓
Producción
        ↓
Nueva evidencia
        ↓
Refinamiento
```

No nacen de ideas.

Nacen de observaciones.

---

## Relación con Operational Discovery

Discovery aporta **evidencia**: preguntas, pérdidas de tiempo, workarounds, incidentes.

Un Check nuevo solo entra cuando hay un patrón validado detrás.

Discovery **nunca** contiene la solución. El Blueprint (este documento + Asistentes + Roadmap) define el Check.

---

## Relación con Operative Assistants

Los Asistentes dejan de ser pantallas.

Se convierten en **orquestadores de comprobaciones**.

| Asistente | Operational Checks (ejemplos) |
|-----------|-------------------------------|
| Production | Stock · Descongelación · Producción |
| Packaging | Etiquetas · Bolsas · Alergias |
| Delivery / Route | Ruta · Entrega · Pago |
| Purchasing | Stock mínimo · Compras |
| Closing | Descongelación · Compras · Incidencias |
| Menu | Repetición · Nutrición |

Superficie: [Centro de Control](./OPERATIONS_DASHBOARD.md) — estado de la operación, no vanity KPIs.

---

## Relación con Capabilities

| | |
|--|--|
| **Check** | Qué se comprueba y qué acción se propone |
| **Capability** | Dominio / datos / reglas que hacen posible el Check |
| **Use Case** | Cómo se ejecuta una acción concreta en Application |

Un Check puede orquestar **varias** Capabilities (p. ej. Stock + Recipe + Orders).

Una Capability sin Check asociado aún no guía la operación: solo guarda datos.

---

## Evolución hacia IA

### Regla permanente

```text
Operational Check
        ↓
Regla de negocio
        ↓
Confianza
        ↓
Histórico
        ↓
IA (opcional)
```

**Nunca al revés.**

### Unidad mínima de inteligencia

Los Operational Checks son la **unidad mínima de inteligencia** de YourMeal OS.

No necesitan IA: ya convierten datos en conocimiento accionable.

| | |
|--|--|
| **Checks** | El sistema piensa con lógica |
| **IA** | El sistema aprende con experiencia |

La IA no sustituye a los Checks. Los mejora cuando exista suficiente evidencia.

### Etapas de adopción

1. **Digitalizar** — sustituir el papel; el usuario decide todo.  
2. **Validar** — comprobar y detectar; sin recomendar aún.  
3. **Recomendar** — proponer acción; la persona decide.  
4. **Optimizar** — patrones aprendidos (multi-org / cientos de jornadas).

No saltar de la etapa 1 a la 4.

---

## Ejemplos EatClean (cinco Checks canónicos)

Hipótesis de producto basadas en la operación de EatClean.  
No son implementación. Validar y refinar con Discovery.

---

### CHECK-001 — Stock suficiente para producción

| Campo | Contenido |
|-------|-----------|
| **Nombre** | Stock suficiente para producción |
| **Objetivo** | Proteger producción y compras: no empezar el día sin materia prima |
| **Momento operativo** | Tarde / cierre · antes de las 18:00 · Planning de mañana |
| **Pregunta que elimina** | ¿Tenemos suficiente lechuga (u otro ingrediente) para mañana? |
| **Datos necesarios** | Stock · Producción prevista · Recetas · Merma |
| **Regla lógica** | `stock_disponible >= necesidad_prevista` (con merma) |
| **Resultado posible** | 🟢 Todo correcto · 🟡 Comprar antes del cierre · 🔴 Faltante crítico |
| **Acción sugerida** | Comprar N unidades/kg antes de las 18:00 |
| **Capabilities implicadas** | Inventory · Orders · Recipe · Dish |
| **Nivel de criticidad** | Atención → Bloqueante si afecta turno de mañana |

```text
¿Por qué?
Pedidos confirmados / producción prevista → consumo por ración → merma
→ necesario vs disponible.
```

---

### CHECK-002 — Descongelación

| Campo | Contenido |
|-------|-----------|
| **Nombre** | Descongelación para producción de mañana |
| **Objetivo** | Proteger producción: sacar del congelador a tiempo |
| **Momento operativo** | Cierre del día · antes de irse |
| **Pregunta que elimina** | ¿Qué debo sacar del congelador? |
| **Datos necesarios** | Producción de mañana · Ingredientes congelados · Tiempo de descongelación · Merma |
| **Regla lógica** | Si ingrediente congelado requerido mañana y no está en descongelación → avisar |
| **Resultado posible** | 🟢 Nada pendiente · ⚠️ Lista de kilos a sacar |
| **Acción sugerida** | Antes de irte: descongelar 26 kg de pollo |
| **Capabilities implicadas** | Inventory · Recipe · Orders · Production Planning |
| **Nivel de criticidad** | Atención / Bloqueante según lead time |

```text
Antes de irte:
Descongelar: 26 kg de pollo.
```

---

### CHECK-003 — Viabilidad de ruta

| Campo | Contenido |
|-------|-----------|
| **Nombre** | Viabilidad de ruta en ventana horaria |
| **Objetivo** | Proteger reparto: llegar a tiempo |
| **Momento operativo** | Antes del reparto · al cerrar carga |
| **Pregunta que elimina** | ¿Llegará el repartidor a tiempo? |
| **Datos necesarios** | Ruta · Número de pedidos · Tiempo histórico · Ventanas horarias |
| **Regla lógica** | `tiempo_estimado_ruta <= ventana_disponible` |
| **Resultado posible** | 🟢 Ruta viable · ⚠️ Supera tiempo previsto |
| **Acción sugerida** | Adelantar salida **o** reasignar N pedidos |
| **Capabilities implicadas** | Routes · Deliveries · Orders · Drivers |
| **Nivel de criticidad** | Atención |

```text
⚠️ Ruta Norte supera el tiempo previsto.
Adelantar salida  o  Reasignar 7 pedidos.
```

---

### CHECK-004 — Repetición de menú

| Campo | Contenido |
|-------|-----------|
| **Nombre** | Repetición / similitud de menú |
| **Objetivo** | Proteger calidad percibida del menú semanal |
| **Momento operativo** | Planificación de menú |
| **Pregunta que elimina** | ¿Ya ofrecimos este plato (o uno muy similar)? |
| **Datos necesarios** | Historial de menú · Menú actual · (opcional) similitud de platos |
| **Regla lógica** | Si coincidencia / similitud ≥ umbral → avisar |
| **Resultado posible** | 🟢 Diversidad OK · ⚠️ Coincidencia alta |
| **Acción sugerida** | Buscar alternativa / sustituir plato |
| **Capabilities implicadas** | Menu · Dish · Nutrition |
| **Nivel de criticidad** | Info / Atención |

```text
Coincidencia: 82 %
Recomendación: Buscar alternativa.
```

---

### CHECK-005 — Estado de cobro

| Campo | Contenido |
|-------|-----------|
| **Nombre** | Estado de cobro en entrega |
| **Objetivo** | Proteger facturación / caja en ruta |
| **Momento operativo** | Durante / al cerrar cada entrega |
| **Pregunta que elimina** | ¿Debo cobrar este pedido? |
| **Datos necesarios** | Pedido · Estado de pago · Condiciones de la Cuenta / Consumidor |
| **Regla lógica** | Si entrega activa y pago pendiente → señalar cobro |
| **Resultado posible** | 🟢 Cobrado / no aplica · ⚠️ Pendiente de cobro |
| **Acción sugerida** | Cobrar · Registrar pago · Marcar incidencia |
| **Capabilities implicadas** | Orders · Deliveries · Payments |
| **Nivel de criticidad** | Atención |

```text
Pedido #245
Estado: Pendiente de cobro.
[Registrar cobro]
```

---

## Objetivo de validación

Establecer Operational Checks como el mecanismo transversal mediante el cual YourMeal OS guía la operación diaria **sin depender de inteligencia artificial**.

Cuando una funcionalidad nueva no pueda responder *qué comprueba / por qué / qué acción*, aún no está lista para el producto.

---

## Relacionado

- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)
- [OPERATIVE_ASSISTANTS.md](./OPERATIVE_ASSISTANTS.md)
- [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md) — Centro de Control
- [CAPABILITY_ROADMAP.md](./CAPABILITY_ROADMAP.md)
- [Operational Discovery](../16-operational-discovery/README.md)
- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
