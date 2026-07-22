# Filosofía de Producto · YourMeal OS

Documento permanente de propósito y criterio de éxito del producto.  
Complementa el [Contexto Estratégico Permanente](./CONTEXTO_ESTRATEGICO_PERMANENTE.md): la estrategia describe la empresa y el Core; este documento describe **para qué existe el producto** y cómo sabemos que está cumpliendo su misión.

**Idioma:** español (ADR 0010).

---

## Propósito

YourMeal OS no existe para digitalizar una cocina.

Existe para ayudar a que una empresa de alimentación opere mejor cada día.

La aplicación es únicamente el medio.

El verdadero producto es la **mejora operativa** que obtiene la Organización.

---

## Nuestra misión

Cada decisión dentro de YourMeal OS debe contribuir a que una cocina sea:

- más rápida;
- más organizada;
- más rentable;
- más predecible;
- más eficiente;
- más fácil de gestionar.

Si una funcionalidad no mejora alguno de estos aspectos, debemos cuestionar si realmente pertenece al producto.

---

## Qué significa el éxito

El éxito de YourMeal OS **no** se mide por:

- cantidad de módulos;
- complejidad técnica;
- número de pantallas;
- tecnologías utilizadas;
- funcionalidades implementadas.

El éxito se mide por el **impacto** que genera en la operación diaria de la Organización.

Por ejemplo:

- reducir el tiempo necesario para planificar la producción;
- disminuir errores en pedidos;
- reducir desperdicio alimentario;
- mejorar el control del inventario;
- acelerar la incorporación de nuevos empleados;
- facilitar la toma de decisiones.

Cada mejora debe poder relacionarse con un beneficio operativo observable.

---

## El punto de partida siempre es la Organización

Toda nueva capacidad debe seguir este recorrido:

```text
Organización
↓
Problema operativo
↓
Dominio
↓
Core
↓
Implementación
↓
Interfaz
```

Nunca construiremos funcionalidades únicamente porque sean técnicamente interesantes.

Construiremos capacidades que resuelvan problemas reales detectados durante la operación de la Organización.

> En este documento, cuando se habla del «cliente» comercial de YourMeal OS, se entiende **Organización**. Ver [ACTORS.md](../12-domain-model/ACTORS.md).

---

## EatClean es nuestro primer profesor

EatClean no es únicamente la primera Organización.

Es la principal fuente de aprendizaje del Core.

Cada problema descubierto durante su implantación representa una oportunidad para fortalecer YourMeal OS.

El objetivo no es personalizar el sistema para una Organización.

El objetivo es descubrir **capacidades reutilizables** que beneficien a todas las Organizaciones futuras.

---

## Identidad operativa (Product Era)

> **YourMeal OS ayuda a cada persona a tomar la siguiente decisión correcta en el momento adecuado.**

### Misión de la plataforma

> **Reducir la carga cognitiva de la operación diaria.**

### Confianza antes que IA

> El primer reto no es automatizar. Es conseguir que la gente confíe en el sistema.

Eso se logra con **Operational Checks** sencillos y acertados (Digitalizar → Validar → Recomendar → Optimizar).

> **YourMeal OS no intenta ser más inteligente que el usuario. Intenta recordar todo aquello que el usuario no debería tener que recordar.**

### Criterio de éxito

> ¿Cuántas decisiones dejamos de depender de la memoria humana para que el equipo pudiera centrarse en cocinar, servir y atender mejor a sus clientes?

### Métrica estrella

**Preguntas eliminadas** (junto a tiempo, errores, interrupciones).

### Mecanismo transversal

**Operational Check** = unidad mínima de valor operativo.

YourMeal OS captura **conocimiento operativo** y lo convierte en lógica reutilizable.

Cada Capability: **¿Qué sabemos? → ¿Qué comprobamos? → ¿Qué necesita atención?**

Lema: **No mostramos datos. Confirmamos que la operación puede continuar.**

Fase: diseño estratégico cerrado → observar EatClean.

Detalle: [OPERATIONAL_CHECKS](../15-product/OPERATIONAL_CHECKS.md) · [Operational Model](../17-operational-model/README.md) · [Centro de Control](../15-product/OPERATIONS_DASHBOARD.md) · [PRODUCT_VISION](../15-product/PRODUCT_VISION.md) · [FIRST_OBSERVATION_DAY](../16-operational-discovery/FIRST_OBSERVATION_DAY.md)

---

## El Core aprende

El Core no evoluciona mediante suposiciones.

Evoluciona mediante evidencia.

Cada nueva capacidad debe responder a un problema real observado durante la operación.

No desarrollaremos funcionalidades «por si algún día hacen falta».

Las desarrollaremos cuando exista una necesidad demostrada.

---

## El equilibrio

YourMeal OS busca equilibrar tres elementos:

- simplicidad para el usuario;
- solidez del Core;
- capacidad de evolución futura.

Nunca sacrificaremos uno completamente para favorecer otro.

La mejor solución será aquella que mantenga este equilibrio.

---

## Cada capacidad debe aportar valor

Antes de iniciar cualquier desarrollo debemos responder:

- ¿Qué problema operativo resuelve?
- ¿Quién experimenta ese problema?
- ¿Cuánto tiempo, dinero o esfuerzo ahorrará?
- ¿Cómo podremos medir esa mejora?
- ¿Fortalece el Core además de resolver el problema?

Si estas preguntas no tienen respuesta, la capacidad aún no está preparada para desarrollarse.

---

## La experiencia del usuario es parte del dominio

La interfaz no es decoración.

Es una herramienta de trabajo.

Cada interacción debe:

- reducir pasos;
- reducir errores;
- reducir carga cognitiva;
- aumentar la confianza del usuario;
- facilitar el aprendizaje.

Una interfaz bonita que complique el trabajo **no** cumple la misión del producto.

---

## Principio de evolución

Diseñamos el Core pensando en cientos de clientes.

Construimos únicamente aquello que la Organización actual necesita.

Cada implantación fortalece el sistema.

Cada mejora permanece.

Cada aprendizaje se documenta.

Así evoluciona YourMeal OS.

---

## La pregunta obligatoria

Antes de aprobar cualquier Pull Request, ADR o nueva funcionalidad debemos responder:

> **¿Hace que una cocina funcione mejor desde el primer día de uso?**

Si la respuesta es no, la implementación deberá justificarse como una inversión necesaria para habilitar una mejora operativa futura claramente identificada.

---

## Declaración final

YourMeal OS no pretende ser el software más complejo del mercado.

Pretende ser el sistema que más impacto positivo genera en el funcionamiento diario de una cocina.

Cada línea de código, cada decisión de dominio y cada nueva capacidad deben acercarnos a ese objetivo.

Porque el verdadero éxito no ocurre cuando terminamos una funcionalidad.

Ocurre cuando la Organización termina su jornada habiendo trabajado mejor gracias a YourMeal OS.

---

## Relacionado

- [Contexto Estratégico Permanente](./CONTEXTO_ESTRATEGICO_PERMANENTE.md)
- [Contexto CTO](./CONTEXTO_CTO.md)
- [Roadmap Maestro](../roadmap/README.md)
- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
- [`FOUNDATION.md`](../../FOUNDATION.md)
