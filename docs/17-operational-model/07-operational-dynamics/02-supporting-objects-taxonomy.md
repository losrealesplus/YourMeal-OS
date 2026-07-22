# 02 — Supporting Objects Taxonomy

**Operational Dynamics v0.2**  
**Prerrequisito:** [level-2-supporting](../02-core-objects/level-2-supporting.md)  
**No convierte Supporting en Core.** Clasifica para que cada alta futura tenga sitio.

---

## Por qué una taxonomía

No todos los Supporting son iguales.  
Sin taxonomía, Lot, Oven, Location y Shift compiten como si fueran el mismo tipo de «extra».

Evidencia: VS-002 (horno) · VS-003 (lote) · VS-005 (Kitchen/Vehicle n) · VS-006 (Location).

---

## Las cuatro familias

### 1. Operational Resources

**Función:** capacidad. No contienen la demanda comercial.

| Ejemplo | Estado en modelo |
|---------|------------------|
| Kitchen | Supporting activo |
| Vehicle | Supporting activo |
| Employee | Supporting activo |
| Oven / Cold Room / Freezer | Capacidad de Kitchen — **atributo o Equipment** bajo Resource; **no** Core (VR-002) |

**Regla:** un Resource no sustituye Batch, Plan ni Order.  
Checks de capacidad viven en transiciones Start / Resume / Ready Route.

### 2. Traceability Objects

**Función:** explicar **qué ocurrió** (identidad · traza · evidencia).

| Ejemplo | Estado en modelo |
|---------|------------------|
| Label | Supporting activo |
| Lot | **Activo** Supporting (MC-003 · Receive / consume) |
| Barcode / QR / Seal | Extensiones de Label / Lot — Nivel 2/3; no espina |

**Regla:** Traceability no es Delivery ni Packaging.  
Label `identifies` Packaging; Lot ancla Ingredient→Batch (recorrido inverso VS-003).

### 3. Spatial Objects

**Función:** ubicar. No son el hecho de entregar ni la ruta.

| Ejemplo | Estado en modelo |
|---------|------------------|
| Location | **Activo** Supporting (MC-006 · VS-006) |
| Loading Bay · Shelf · Room · Floor | Especializaciones / atributos de Location |

**Regla:** Delivery **confirma** al destinatario; Location **sitúa** el destino o el stock.  
No crear Core «Ward» / «Classroom».

### 4. Administrative Objects

**Función:** organizar tiempo y calendario. No cambian el dominio.

| Ejemplo | Estado en modelo |
|---------|------------------|
| Time Window | Ya en Route (INV-042) · atributo Batch/Plan |
| Calendar / Holiday | Configuración Tenant (Nivel 3) |
| Shift | **No** Core (VR-005) — ventana + Employee + Kitchen |

**Regla:** Shift/Wave/Session como Core = sesgo de escala. Expresar con adverbios temporales + Resources + ventanas.

---

## Dónde cae lo existente

| Objeto | Familia |
|--------|---------|
| Order Item | (Detalle de Core Order — Supporting de composición, no Resource) |
| Stock | Híbrido: cantidad operativa + traza vía Lot — tratar como **Resource de inventario** con vínculo Traceability |
| Label | Traceability |
| Vehicle · Kitchen · Employee | Operational Resources |
| Invoice | Administrativo / financiero de soporte (órbita Payment) |
| Location | Spatial |

Order Item permanece Supporting de **línea de demanda** (no entra en las cuatro familias de Dynamics como Resource/Spatial); se documenta aparte en level-2.

---

## Filtro para nuevos Supporting

1. ¿Es Core? → filtro 02 · casi siempre **no**.  
2. ¿Qué familia Dynamics? Resource · Traceability · Spatial · Administrative.  
3. ¿Se explica con atributo de uno existente? → preferir atributo.  
4. ¿VR exige entidad? → Supporting de esa familia · MC · principio 16.

---

## Relacionado

- [Lifecycles 2.0](./01-operational-lifecycles-2.0.md)  
- [MC-003 Lot](../../18-operational-validation/06-model-changes/MC-003-lot-traceability-recall.md)  
- [MC-006 Location](../../18-operational-validation/06-model-changes/MC-006-location-supporting-expedite.md)
