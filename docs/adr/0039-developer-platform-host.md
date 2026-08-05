# ADR 0039 — Developer Platform Host

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-003  
**Producto:** Developer Platform **v1.0** Foundation  
**Detalle:** [DEVELOPER_PLATFORM_HOST](../05-architecture/DEVELOPER_PLATFORM_HOST.md)

## Contexto

Runtime Core (ADR 0038) ya ofrece Registry + Module Contract. El Runtime Suite seguía siendo el lugar donde se conocían los paneles (Assets, DOM, Consistency, …). Si cada herramienta nueva editara el Suite, el Shell crecería hasta ser inmantenible (decenas de `if` / miles de líneas).

## Decisión

Introducir **Developer Platform Host** (`src/runtime/runtime-host/`):

1. Shell desacoplado que solo llama `getModules()` / filtros de categoría y plataforma.  
2. Categorías fijas: Health · Application · Network · System · Security · Developer.  
3. `supports: web | android | ios` preparado (filtrado Host; sin lógica nativa específica).  
4. Render React vía `registerModuleRenderer` (Core permanece sin React).  
5. Bridges legacy: paneles Suite actuales se registran y se muestran sin reescribir motores.

**No** incluir Doctor ni nuevos probes en este ADR.

## Consecuencias

- Añadir un módulo = registrar + (opcional) renderer; el Host no se toca.  
- Suite sigue abierto y usable; navegación pasa de tabs fijas a sidebar dinámica.  
- iOS/Android futuros reutilizan el mismo Host; los módulos declaran plataforma.  
- Base lista para Doctor (v1.1) y el resto del roadmap sin re-arquitectar el Shell.
