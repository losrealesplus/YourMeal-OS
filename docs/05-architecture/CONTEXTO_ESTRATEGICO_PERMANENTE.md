# Contexto Estratégico Permanente · YourMeal OS

Documento estratégico de referencia para Cursor como CTO del proyecto.  
No sustituye los ADRs ni el modelo de dominio: los enmarca.

> **Lenguaje de actores:** en este documento, «cliente» (comercial SaaS) = **Organización**. Ver [ACTORS.md](../12-domain-model/ACTORS.md). Evitar «cliente» sin contexto en documentación nueva.

## Estado actual del proyecto

YourMeal OS ha finalizado oficialmente las fases:

- Blueprint ✅
- Foundation ✅
- Foundation Lock ✅

La arquitectura base se considera estable.

> **A partir de este momento la arquitectura no se rediseña; se aplica.**

Cualquier cambio estructural requiere un ADR.

**2026-07-29 — Platform Baseline v1.** Fase de Plataforma **COMPLETE**. Fotografía oficial: [PLATFORM_BASELINE_v1](../00-status/PLATFORM_BASELINE_v1.md). Pregunta del producto: *¿cómo opera YourMeal OS?* Progreso = certificaciones. Objetivo actual: Flow Certification. Core / Baseline solo cambian con evidencia + [CHANGE_AUTHORITY](../00-status/CHANGE_AUTHORITY.md).

Entramos oficialmente en:

**Module 01 — Dish Library**

---

## Filosofía del proyecto

YourMeal OS **no es una aplicación**.

YourMeal OS es el **Core (motor)** de una futura empresa SaaS especializada en implantar soluciones operativas para empresas.

Nuestro objetivo no es desarrollar aplicaciones independientes para cada cliente.

Nuestro objetivo es desarrollar **un único Core**, cada vez más potente, modular y escalable.

Cada cliente tendrá una aplicación completamente personalizada:

- nombre
- logo
- colores
- identidad
- configuración
- capacidades activadas

Sin embargo, todas compartirán exactamente el mismo Core.

---

## Modelo de negocio

La empresa ofrecerá un servicio completo de implantación.

### El cliente

- contrata el servicio
- define sus necesidades
- entrega su identidad corporativa
- solicita funcionalidades

### Nosotros

- adaptamos el Core
- activamos o desactivamos capacidades
- personalizamos la marca
- publicamos la aplicación
- realizamos el mantenimiento
- evolucionamos el producto
- formamos al cliente
- damos soporte

El cliente percibe una aplicación propia.

Internamente todas funcionan sobre el mismo motor.

---

## Visión del Core

> **Diseñamos para una empresa con 100 clientes. Desarrollamos para 1.**

Este es uno de los principios fundamentales del proyecto.

La arquitectura siempre debe soportar cientos de clientes.

El desarrollo siempre debe responder a las necesidades reales del cliente actual.

No desarrollaremos funcionalidades por anticipación.

Las construiremos cuando una necesidad real las justifique.

---

## Principio del Primer Cliente

El primer cliente es la mayor fuente de aprendizaje del producto.

La versión v0.1 está orientada a cubrir las necesidades reales de nuestro primer cliente:

**EatClean**.

No construiremos funcionalidades pensando en clientes hipotéticos.

Cada aprendizaje obtenido durante la implantación de EatClean fortalecerá el Core.

Cada cliente futuro seguirá enriqueciendo la plataforma.

---

## Evolución del Core

Cada cliente añadirá conocimiento.

No desarrollaremos aplicaciones distintas.

Fortaleceremos continuamente el mismo Core.

No eliminaremos funcionalidades cuando un cliente no las necesite.

Las convertiremos en **capacidades desactivables**.

Ejemplo:

- Gestión de rutas → desactivada para EatClean
- Activada para un futuro cliente de reparto

La plataforma crecerá mediante capacidades, no mediante bifurcaciones del código.

---

## Principio de Capacidades

No existen módulos “sobrantes”.

Existen capacidades disponibles.

Cada cliente tendrá únicamente las capacidades necesarias para su operación.

Las demás permanecerán desactivadas mediante configuración y Feature Flags.

Nunca se eliminarán porque otro cliente podrá necesitarlas.

---

## Prioridad absoluta

La prioridad actual **no** es:

- automatizar la implantación
- construir un panel Studio
- desarrollar herramientas internas

La prioridad absoluta es construir la mejor solución posible para **EatClean**.

Studio existirá en el futuro cuando la experiencia obtenida con varios clientes justifique su desarrollo.

Hasta entonces la implantación será realizada manualmente.

Sin embargo, toda la arquitectura deberá quedar preparada para que Studio pueda construirse posteriormente sin refactorizaciones importantes.

---

## Principio de Escalabilidad Progresiva

Toda decisión arquitectónica debe soportar el crecimiento futuro.

Ninguna funcionalidad debe desarrollarse antes de que exista una necesidad real.

> Pensamos en el futuro. Construimos para el presente.

---

## Regla de desarrollo

No desarrollamos pantallas.

No desarrollamos CRUD.

No desarrollamos botones.

Desarrollamos capacidades de negocio.

El orden siempre será:

```text
Dominio
↓
Entidades
↓
Estados
↓
Invariantes
↓
Reglas de negocio
↓
Repositorios
↓
Servicios
↓
Tests
↓
UI
↓
CRUD
```

La interfaz es la última consecuencia del dominio.

---

## Filosofía documental

Todo lo que se incorpore al proyecto debe tener una razón de existir.

Antes de implementarse debe quedar claro:

- ¿Qué es?
- ¿Cómo es?
- ¿Por qué existe?
- ¿Para qué sirve?

Todo cambio relevante deberá documentarse en el **Diario de Desarrollo del Proyecto** para preservar el conocimiento y la trazabilidad de las decisiones.

---

## Rol esperado de Cursor

Cursor debe actuar como **arquitecto y desarrollador del Core**.

Debe priorizar:

- coherencia del dominio
- calidad arquitectónica
- escalabilidad
- modularidad
- mantenibilidad
- reutilización
- documentación

Nunca debe proponer soluciones que comprometan la arquitectura por resolver un problema puntual.

---

## Arquitectura de Instancias y Separación de Demo

El Core de YourMeal OS alimenta dos tipos de entornos estrictamente diferenciados:

1. **YourMeal OS Demo Oficial (`yourmeal-os`):** Entorno de producto, showcase público y desarrollo continuo (`djangucecsphnejplvic`). Datos sintéticos y fluctuantes.
2. **Instancias de Clientes Reales (ej. `eatclean`):** Entornos de producción aislados físicamente (`nhirlpkuvonggctdzzad`), con repositorios, bases de datos y Workers dedicados.

Ver la especificación técnica completa en [INSTANCE_RUNTIME_BOUNDARY.md](./INSTANCE_RUNTIME_BOUNDARY.md).

---

## Relación con el resto de la constitución

Orden recomendado de lectura:

```text
FOUNDATION.md
↓
AGENTS.md
↓
CONTEXTO_ESTRATEGICO_PERMANENTE.md
↓
FILOSOFIA_DE_PRODUCTO.md
↓
CONTEXTO_CTO.md
↓
ADRs / docs del módulo
```

- `FOUNDATION.md` → criterio global reusable
- `AGENTS.md` → reglas operativas específicas de YourMeal OS
- `CONTEXTO_ESTRATEGICO_PERMANENTE.md` → dirección empresarial y del Core
- `FILOSOFIA_DE_PRODUCTO.md` → propósito del producto e impacto operativo
- `CONTEXTO_CTO.md` → resumen operativo de arranque de sesión
