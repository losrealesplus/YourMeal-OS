# CR-COST-05 — Scope Lock & Implementation Contract v4.1 (Economic Command Center)

**Subsystem:** Platform Core / Cost Intelligence  
**Document Status:** 🟢 **SCOPE LOCK v4.1 CALIBRADO & ALINEADO 1:1 CON ARQUITECTURA v4.1**  
**Implementación:** 🔴 **BLOQUEADA (Cero código, Cero commits, Cero mutaciones en BD)**  
**Fecha:** 2026-09-27  

---

## 1. 🎯 Objetivo de Implementación

Transformar la superficie `/admin/cost-intelligence` en el **Economic Command Center** de YourMeal OS, estructurado en torno al ciclo de vida canónico de 6 estados de la entidad **Opportunity**:

$$\text{DETECTED} \longrightarrow \text{REVIEWED} \longrightarrow \text{SIMULATED} \longrightarrow \text{DECISION\_RECORDED} \longrightarrow \text{PENDING\_EXECUTION} \longrightarrow \text{RESOLVED}$$

Con simulación in-situ sin cambios de pestaña, triage ejecutivo de atención, 5 intenciones comerciales tipadas y separación estricta de procedencias económicas.

---

## 2. 🛡️ Convención Obligatoria de Procedencia de Datos

Para evitar cualquier ambigüedad entre datos de producción y datos de prueba en entornos locales:

| Etiqueta | Significado Semántico | Ejemplo en Entorno Local / Fixture |
| :--- | :--- | :--- |
| **`[REAL — fixture/local]`** | Coste unitario auditado de compra registrado en BD local. | `6,40 €/kg` (*Pechuga de Pollo Fresca* en `ingredients.cost`) |
| **`[OBSERVADO — fixture/local]`** | Precio de mercado derivado de observaciones locales (Makro/Mercadona). | `5,70 €/kg` (Ponderación 70/30) |
| **`[FIXTURE]`** | Volumen o supuesto inyectado exclusivamente para pruebas/demos. | `1.200 kg/año` (Etiquetado explícitamente como Fixture) |
| **`[MANUAL]`** | Supuesto operativo asignado por el gerente (mano de obra, energía, packaging). | `1,50 €/ración` (No muta WAC ni facturas) |
| **`[SIMULADO — derivado]`** | Proyección matemática en memoria resultante de $(WAC - Benchmark) \times Volumen$. | `840,00 €/año` (Requiere volumen $> 0$) |
| **`— (Requiere volumen)`** | Regla de cero invención: ausencia de volumen impide calcular ahorro anual. | `—` (En ingredientes sin volumen registrado) |

> ⚠️ **PROHIBICIÓN EXPRESA:** Ningún dato `[FIXTURE]` podrá etiquetarse en la interfaz como "Dato Real Auditado de EatClean" ni presentarse como realidad económica de producción.

---

## 3. 🧬 Máquina de Estados Canónica de la Entidad `Opportunity` (Alineación 1:1 con Architecture v4.1)

```text
┌─────────────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
│ Estado                  │ Definición Semántica & Transición                                                │
├─────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
│ 1. DETECTED             │ Brecha económica detectada algorítmicamente (WAC Real vs Benchmark > +5%).      │
│ 2. REVIEWED             │ Gerente ha inspeccionado la evidencia (Suelo Makro vs Techo Mercadona).          │
│ 3. SIMULATED            │ Inyectada in-situ en el escandallo del plato afectado ("Pollo Asado con Guarnición"). │
│ 4. DECISION_RECORDED    │ Decisión humana explícita registrada en BD con justificación y precio objetivo.  │
│ 5. PENDING_EXECUTION    │ Compromiso comercial listo para ejecución operativa (Puente para futuro CR-OPS). │
│ 6. RESOLVED             │ Oportunidad cerrada tras verificación de nueva factura o acuerdo consolidado.    │
└─────────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 📋 Los 17 Criterios de Verificación del Scope Lock v4.1

### 1. Entrada Principal: Economic Command Center
Al acceder a `/admin/cost-intelligence`, la vista por defecto es el **Economic Command Center** con el *Command Strip* y las *Opportunity Cards*. El antiguo simulador de sliders paramétricos ya no es la pantalla inicial.

### 2. Entidad `Opportunity` con Máquina de 6 Estados
La oportunidad es un objeto de decisión tipado con el ciclo canónico completo de 6 estados:
$$\text{DETECTED} \longrightarrow \text{REVIEWED} \longrightarrow \text{SIMULATED} \longrightarrow \text{DECISION\_RECORDED} \longrightarrow \text{PENDING\_EXECUTION} \longrightarrow \text{RESOLVED}$$

### 3. Expansión In-Situ (Cero Salto de Pestaña)
Al pulsar `[⚡ SIMULAR EN CARTA E9]`, la tarjeta de la oportunidad transiciona a `SIMULATED` y se expande verticalmente dentro del propio viewport, sin redirigir al usuario a otra pestaña ni recargar la página.

### 4. Evidencia Ground Truth Visible
Junto a cada oportunidad se muestra el desglose de fuentes observables (Suelo Mayorista Makro vs Techo Minorista Mercadona, SKU, región y comparabilidad).

### 5. Segregación Estricta `[REAL]` vs `[SIMULADO]`
La simulación in-situ muestra en columnas separadas:
- Coste Actual `[REAL — fixture/local]` (4,20 €)
- Coste Proyectado `[SIMULADO — derivado]` (3,96 €)
- Margen Actual (66,40%) vs Margen Simulado (68,32%)
- Impacto Mensual (+96,00 €/mes) y Anualizado (+1.152,00 €/año)

### 6. Reversibilidad Inmediata `[DESHACER]`
Un botón visible `[🔄 Revertir Hipótesis a Coste Real]` restaura inmediatamente el estado en memoria determinista al WAC real y devuelve la oportunidad al estado `REVIEWED`.

### 7. Registro Contextual de `Decision Intent`
El formulario de decisión se abre in-situ desde la propia oportunidad simulada, asociando el `Decision Intent` al ingrediente, plato y snapshot de evidencia.

### 8. Tipología Comercial Formal de 5 Intenciones
El usuario selecciona entre las 5 intenciones comerciales estrictamente tipadas:
1. `renegotiate_supplier` (🤝 Renegociar precio con proveedor anclado al benchmark)
2. `reformulate_recipe` (🥗 Reformular receta / gramaje de materia prima)
3. `adjust_menu_price` (🏷️ Ajustar PVP de venta en carta)
4. `accept_margin_compression` (⏱️ Aceptar compresión temporal de margen)
5. `investigate_further` (🔍 Solicitar cotizaciones a otros distribuidores)

### 9. Transición Trazable a `DECISION_RECORDED` y `PENDING_EXECUTION`
Al confirmar el acuerdo:
1. Se persiste la fila en `cost_decision_intents` con `status = 'pending_execution'`.
2. La oportunidad transiciona a `DECISION_RECORDED` / `PENDING_EXECUTION`, mostrando el resumen del compromiso, actor responsable, fecha límite de acuerdo e ID `#dec-xxxxxx`.

### 10. Cumplimiento de la Regla de Cero Invención
Si un ingrediente carece de volumen anual registrado en BD, el sistema renderiza obligatoriamente `— (Requiere volumen anual)` y clasifica la tarjeta como `🟡 REVISAR DATOS`.

### 11. Command Strip de Atención y Acción (No KPIs Pasivos)
El encabezado responde a *“¿Qué requiere atención?”*:
- `🔴 N Acciones Directas (Ahorro potencial cuantificado)`
- `🟡 N Datos Incompletos (Mano de obra o volumen faltante)`
- `⚪ N Observaciones de Mercado Disponibles`

### 12. Herramientas de Profundización Reubicadas
Las funciones de back-office y exploración se organizan en secciones colapsables / drawers en el pie del canvas:
- `[+ Importar Catálogo CSV]` & `[Cola de Mapeo]`
- `[Preguntar al Mercado]` (Banco de pruebas preliminar de nuevos platos)
- `[Simulador Paramétrico Avanzado]` (Sliders macroeconómicos para shocks globales)
- `[Histórico de Decisiones Auditadas]`

### 13. Delimitación Estricta de Fronteras
- 🔴 **CR-COST-06 (OCR Facturas):** Estrictamente fuera de alcance.
- 🔴 **CR-COST-07 (BOM Industrial):** Estrictamente fuera de alcance.
- 🔴 **CR-OPS (Operations Center):** Estrictamente fuera de alcance en UI. La integración se limita a persistir filas desacopladas en `cost_decision_intents` (`status = 'pending_execution'`).

### 14. Aislamiento Multi-Tenant & RLS
Las oportunidades, decisiones y costes `[MANUAL]` de un tenant son 100% invisibles para otros tenants en PostgreSQL.

### 15. Cero Mutaciones Económicas Involuntarias
Las simulaciones y decisiones **nunca modifican** `ingredients.cost`, WAC contable, `item_cost_history`, stocks ni facturas de compra.

### 16. Diseño Responsive & Desktop
- **Desktop (>= 1024px):** Command Strip en 3 columnas, Opportunity Cards en split 2-columna (datos / impacto).
- **Mobile (< 1024px):** Stack vertical compacto, botones de acción táctiles full-width, simulación colapsable.

### 17. Certificación de Navegador Playwright Chromium
Validación de los 6 estados del ciclo de vida y la prueba de los 30 segundos mediante script automatizado Playwright con capturas de pantalla completas.

---

## 🔒 Estado de Gobernanza

```text
CR-COST-05
────────────────────────────────────────────
Architecture v4.1                 🟢 RATIFICADA
Scope Lock v4.1 (Alineado 1:1)    🟢 COMPLETO — LISTO PARA RATIFICACIÓN
Implementación local              🔴 BLOQUEADA A LA ESPERA DE RATIFICACIÓN
Commit                             🔴 BLOQUEADO
Push                               🔴 BLOQUEADO
Producción                         🔴 BLOQUEADA
```

El presente contrato formaliza de forma unívoca los 17 criterios técnicos y de producto para la ejecución local.
