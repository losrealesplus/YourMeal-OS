# 06 — Capability Mapping

**Tipo:** Operational Model · Core Operativo  
**Pregunta:** ¿Qué Capabilities tocan cada objeto — y qué Asistentes los orquestan?

Hipótesis v0.1. El roadmap vivo: [CAPABILITY_ROADMAP.md](../15-product/CAPABILITY_ROADMAP.md).  
No inventar Capabilities nuevas aquí — solo mapear.

---

## Objeto → Capability (orientativo)

| Objeto | Capabilities (Core) | Estado orientativo |
|--------|---------------------|--------------------|
| Dish | Dish Management | ✅ |
| Recipe | Recipe | ⏳ |
| Ingredient | Ingredient | ⏳ |
| Supplier | Ingredient / Purchasing | ⏳ |
| Stock | Inventory | ⏳ |
| Weekly Menu | Menu | ⏳ |
| Order / Order Item | Orders | ⏳ |
| Production Plan | Production Planning | ⏳ |
| Production Batch | Production | ⏳ |
| Packaging / Label | Packaging / Labels | ⏳ |
| Delivery Route / Vehicle | Routes / Drivers | ⏳ |
| Delivery | Deliveries | ⏳ |
| Payment | Payments | ⏳ |

---

## Asistente → objetos que orquesta

| Asistente | Objetos principales | Checks típicos |
|-----------|---------------------|----------------|
| Menu | Weekly Menu · Dish | Repetición · nutrición |
| Production | Plan · Batch · Recipe · Stock | Stock · descongelación · producción |
| Packaging | Packaging · Label · Order | Etiquetas · bolsas · alergias |
| Purchasing | Stock · Supplier · Ingredient | Stock mínimo · compras |
| Route / Delivery Builder | Route · Vehicle · Order | Viabilidad de ruta |
| Delivery | Delivery · Payment · Order | Cobro · entrega |
| Closing | Stock · Plan · Incidents | Descongelar · compras · incidencias |
| Operations (Centro de Control) | Todos (vía Checks) | Estado de la operación |

Los Asistentes **orquestan Checks** sobre estos objetos — no son pantallas de módulo.

---

## Gate (recordatorio)

Antes de abrir una Capability:

1. ¿Evidencia en Discovery?  
2. ¿Qué pregunta elimina?  
3. ¿Qué Operational Check la expresa?  
4. ¿Sobre qué objetos de este modelo actúa?

Ver [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md).

---

## Domain Model

Cuando una Capability se implemente, el Domain Model (`docs/12`) debe usar los **mismos nombres** que este Operational Model.

Si diverge, gana el lenguaje operativo validado — y se actualiza Domain con ADR si hace falta.
