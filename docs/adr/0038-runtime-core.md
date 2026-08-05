# ADR 0038 — Runtime Core

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-002  
**Producto:** Developer Platform **v1.0** Foundation  
**Detalle:** [RUNTIME_CORE](../05-architecture/RUNTIME_CORE.md)

## Contexto

El Runtime Suite acumulaba probes (Assets, DOM, Consistency) sin un kernel común. Añadir Doctor, Network, Export, etc. sin Registry/Contracts hipotecaría el acoplamiento: cada herramienta modificaría el Suite.

## Decisión

Introducir **Runtime Core** como kernel permanente:

1. Module Registry + Module Contract  
2. Event Bus tipado  
3. Evidence / Export / Permission **contracts** (sin implementación pesada)  
4. Built-ins existentes se **registran** sin cambiar comportamiento  

Regla: los módulos dependen del Core; el Core nunca importa un módulo concreto.

## Consecuencias

- Developer Platform versionable (v1.0, v1.1, …) separado del producto cliente.  
- Nuevos módulos = PRs de enchufe.  
- Sin cambios funcionales en Assets/DOM/Consistency en este ADR.
