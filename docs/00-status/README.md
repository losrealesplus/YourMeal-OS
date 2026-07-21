# Estado del proyecto

**Última actualización:** 2026-07-21  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  

## Tres pilares (no habrá cuarto)

| Pilar | Pregunta | Estado |
|-------|----------|--------|
| **FOUNDATION** | ¿Cómo construimos? | ✅ |
| **PRODUCT BLUEPRINT** | ¿Qué construimos y por qué? | ✅ maduro |
| **OPERATIONAL DISCOVERY** | ¿Por qué evolucionar? | ✅ carpeta · ⏳ evidencia real |

```text
Producto:  Discovery → Operational Check → Assistant → Capability
Técnica:   Capability → Use Cases → Domain → Infrastructure
```

> **Reducir la carga cognitiva de la operación diaria.**  
> Unidad mínima operativa: [Operational Check](../15-product/OPERATIONAL_CHECKS.md).  
> **No mostramos datos. Confirmamos que la operación puede continuar.**  
> Métrica estrella: **preguntas eliminadas**.  
> Documentación estratégica base: **madura** — no abrir más pilares ni docs de estrategia sin necesidad.

> No implementamos ideas. Implementamos conocimiento validado.  
> Discovery: solo evidencia — nunca soluciones.  
> **No hay cuarto pilar.**

---

## Fase actual

### Primera jornada observada en EatClean

No validar pantallas. No vender. No buscar bugs.

Descubrir Checks **implícitos** en la cabeza del equipo; cuáles faltan; cuáles son críticos; cuáles ahorrarían más tiempo.

Checklist: [FIRST_OBSERVATION_DAY.md](../16-operational-discovery/FIRST_OBSERVATION_DAY.md)

En paralelo (Capability ya validada): Integration + UI MVP de Dish Management — sin inventar Capabilities nuevas.

### Orientación de PRs

Preferir PRs de **valor operativo** (jornada · findings · Asistente · Checks conectados) frente a PRs solo «por tecnología».

| Índice | Ruta |
|--------|------|
| Discovery | [docs/16-operational-discovery/](../16-operational-discovery/README.md) |
| Checks | [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md) |
| Blueprint | [docs/15-product/](../15-product/README.md) |
| Visión / KPIs | [PRODUCT_VISION.md](../15-product/PRODUCT_VISION.md) |
