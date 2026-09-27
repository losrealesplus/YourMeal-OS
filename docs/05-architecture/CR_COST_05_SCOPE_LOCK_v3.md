# CR-COST-05 — Scope Lock v3.0: Interactive Economic Decision Engine

**Subsystem:** Platform Core / Cost Intelligence & Food Market Price Intelligence  
**Scope Lock Version:** 3.0.0  
**Derived From:** Blueprint v3.1 (Ratificado por la Human Product Authority el 2026-09-27)  
**Status:** 🟡 DRAFT PARA RATIFICACIÓN HUMANA (Implementación Bloqueada)  
**Author:** Antigravity Architecture Team  
**Date:** 2026-09-27  

---

## 1. Declaración de Alcance y Límite Infranqueable

El propósito de este Scope Lock es definir de manera **estricta, exhaustiva y verificable** los límites de la evolución interactiva de **CR-COST-05**, transformando la superficie de un visor estático a un motor interactivo de decisión económica sin invadir capacidades futuras (`CR-COST-06`, `CR-COST-07`, `CR-OPS`) ni violar la inmutabilidad de los datos económicos reales.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                LÍMITES ESTRICTOS DE ALCANCE (v3.0)                               │
├──────────────────────────────────────────────────┬───────────────────────────────────────────────┤
│ 🟢 INCLUIDO EN CR-COST-05 v3.0                   │ 🔴 ESTRICTAMENTE BLOQUEADO (FUERA DE ALCANCE) │
│ • Micro-editor [MANUAL] in-situ con metadatos.   │ • OCR e ingesta de facturas PDF (CR-COST-06). │
│ • Inyección reactiva [SIMULADO] en E9 + Deshacer.│ • Motor pesado de viabilidad BOM (CR-COST-07).│
│ • Explorador de consulta de mercado acotado.     │ • Centro de operaciones matutino (CR-OPS).    │
│ • Taxonomía de 4 niveles de Actionability Grade. │ • Mutación de histórico WAC o facturas reales.│
│ • Registro persistente de Decision Intent.       │ • Modificación automática de stocks o recetas.│
│ • Veracidad estricta en Ahorro Anual (sin invent)│ • Despliegue en producción o Workers remotos. │
└──────────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Los 10 Criterios de Aceptación Verificables

### Criterio 1: Separación e Inmutabilidad de `[MANUAL]` frente a `[REAL]`
- **Prohibición Expresa:** Una imputación `[MANUAL]` nunca podrá sobrescribir `ingredients.cost`, WAC, `item_cost_history` ni ningún coste `[REAL_ACQUISITION]`.
- La imputación in-situ de costes indirectos (mano de obra, energía, packaging) no sobreescribe ni altera el histórico de transacciones WAC ni las facturas registradas.
- Cada entrada manual se almacena con su procedencia explícita: `provenance: 'MANUAL'`, `recorded_by: userId`, `recorded_at: timestamp`, `rationale: string`.
- La interfaz muestra una advertencia visible de no retroactividad y marca visualmente el valor con el badge 🟠 **`[MANUAL]`**.

### Criterio 2: Aislamiento Reactivo de `[SIMULADO]`, Identidad Inequívoca y Deshacer Inmediato
- La acción de pulsar **`[Simular con Precio de Mercado]`** inyecta la variación de coste únicamente en la memoria reactiva del simulador E9.
- El WAC real (`effectiveWacExTax`) en PostgreSQL, las facturas, el stock, los precios de venta y las recetas históricas permanecen **100% inalterados**.
- Nunca se presenta como `[REAL]`; y si el escenario se persiste mediante la infraestructura de E9, queda inequívocamente identificado como **`SIMULATED_PROJECTION`**.
- La pantalla del simulador muestra una barra de hipótesis activa con el botón **`[🔄 Revertir a Coste Real (Deshacer)]`**, que al pulsarse limpia los deltas y restaura el estado base sin efectos secundarios.

### Criterio 3: Veracidad y Trazabilidad Estricta de Ahorros Potenciales
- La cifra de ahorro anual solo se computa y muestra si existe un volumen de consumo anual real comprobable en el sistema:
  $$\text{Ahorro Potencial Anual (€)} = (\text{WAC}_{\text{REAL}} - \text{Benchmark}_{\text{OBSERVADO}}) \times \text{Volumen Anual}_{\text{REAL}}$$
- Si el volumen anual no está registrado o es `0`, la interfaz muestra obligatoriamente:  
  **`Ahorro Potencial: — (Requiere registrar volumen anual)`**  
  **Queda terminantemente prohibido inventar o extrapolar cifras de ahorro sin evidencia.**

### Criterio 4: Taxonomía de Niveles de Decisión (Actionability Grade)
Cada ingrediente con datos de mercado evaluados recibe exactamente **un** nivel de accionabilidad asignado por reglas deterministas:
1. 🟢 **ACCIÓN DIRECTA:** Coste REAL verificado + Benchmark OBSERVADO de Alta Comparabilidad + Volumen Anual REAL registrado + Disparidad $>5\%$. Habilita: *Simular en Carta*, *Informe de Negociación*, *Crear Decisión*.
2. 🟡 **REVISAR DATOS:** Benchmark observable presente pero falta volumen anual o comparabilidad Media. Habilita: *Completar Volumen*, *Ver Fuentes*.
3. ⚪ **INFORMACIÓN:** Producto observable en catálogo sin ingrediente de tenant enlazado. Habilita: *Mapear Ingrediente*.
4. 🔴 **INSUFICIENTE:** Observación sin comparabilidad suficiente o dispersión errática. Muestra: *— (Sin recomendación confiable)*.

### Criterio 5: Persistencia de `Decision Intent` como Puente hacia `CR-OPS`
- Al pulsar **`[Registrar Decisión de Negociación]`**, el sistema crea un registro en la tabla `cost_decision_intents` con estado `pending_execution`, vinculando el ingrediente, el proveedor objetivo, el precio meta observado y la justificación.
- Esta entidad queda almacenada de forma persistente y auditable en PostgreSQL para ser consumida posteriormente por el futuro Centro de Operaciones (`CR-OPS`), sin incluir código prematuro de UI de CR-OPS en esta entrega.

### Criterio 6: Consulta de Mercado Acotada ("Preguntar al Mercado")
- Se implementa el modal **`MarketInquiryExplorerModal`** que permite consultar la disponibilidad de ingredientes en los catálogos observables (*Makro, Mercadona, GM Cash*) para un plato hipotético (*ej. Tarta de Zanahoria a 4,00 €*).
- Si un ingrediente no tiene observación en catálogo, el sistema muestra: **`⚠️ [Nombre]: Sin referencia comparable`** y permite continuar o ingresar coste estimado manual.
- **Frontera:** No incluye ingeniería de mermas industriales, matrices de cocción ni dossiers de lanzamiento (reservados para `CR-COST-07`).

### Criterio 7: Eliminación de Falsos Ceros y Tratamiento de Ausencia de Datos
- Todos los costes indirectos no configurados renderizan obligatoriamente **`— (Sin configurar)`** en tipografía atenuada, erradicando cualquier falso `0,00 €`.
- Todos los benchmarks sin observaciones suficientes renderizan **`— (Sin datos de mercado)`**.

### Criterio 8: Coherencia de Procedencia Cuádruple en Todas las Superficies
- Todas las métricas económicas en `/admin/cost-intelligence` y `/admin/purchasing` portan su tag de procedencia visual estandarizado:
  - 🟢 **`[REAL]`** (Verde)
  - 🔵 **`[OBSERVADO]`** (Azul)
  - 🟠 **`[MANUAL]`** (Ámbar)
  - 🟣 **`[SIMULADO]`** (Púrpura)

### Criterio 9: Cero Mutaciones Económicas no Autorizadas
- Ninguna de las acciones interactivas altera inventario, existencias, órdenes de compra confirmadas, facturas recibidas, escandallos históricos ni precios de venta de platos sin autorización expresa del usuario mediante guardado formal.

### Criterio 10: Verificación Integral de Calidad y Navegador Real
- **TypeScript:** `tsc --noEmit` = `0 errores`.
- **Vitest:** 100% de la suite pasando (mínimo 1.268 tests).
- **Playwright Chromium:** Suite automatizada de navegación real ejecutando todas las nuevas interacciones (imputar in-situ, simular en 1 clic, revertir, consultar mercado y registrar decision intent) con generación de capturas visuales en `docs/05-architecture/screenshots/cr-cost-05/`.

---

## 3. Matriz de Componentes a Crear / Modificar

| Componente | Tipo de Cambio | Responsabilidad Funcional |
| :--- | :---: | :--- |
| `IndirectCostQuickEditModal.tsx` | 🟢 NUEVO | Micro-editor in-situ de supuestos `[MANUAL]` con trazabilidad y advertencia de no retroactividad. |
| `MarketInquiryExplorerModal.tsx` | 🟢 NUEVO | Modal de consulta acotada de mercado para cotizar platos hipotéticos (*Tarta de Zanahoria*). |
| `StrategicOpportunityCards.tsx` | 🟢 NUEVO | Panel superior de oportunidades con niveles de *Actionability Grade* y botones de acción en 1 clic. |
| `MarketIntelligenceTab.tsx` | 🟡 MODIFICADO | Integración del panel de oportunidades, explorador de mercado y tabla con niveles de decisión. |
| `admin.cost-intelligence.tsx` | 🟡 MODIFICADO | Soporte de inyección reactiva de deltas desde mercado al simulador E9 + botón visible de deshacer. |
| `scripts/verify-cr-cost-05-browser-evidence.mjs` | 🟡 MODIFICADO | Extensión del script de Chromium para validar interactivamente las nuevas capacidades. |

---

## 4. Estado de Gobernanza y Candados de Seguridad

```text
CR-COST-05 · Scope Lock v3.0

Blueprint v3.1                     🟢 RATIFICADO
Scope Lock v3.0                    🟡 LISTO PARA RATIFICACIÓN HUMANA
Implementación de Código           🔴 BLOQUEADA (Requiere Autorización Explícita)
Git Commit / Push                  🔴 BLOQUEADO
Migración a Producción             🔴 BLOQUEADO
Despliegue Cloudflare              🔴 BLOQUEADO
```

Quedo a la espera de tu revisión para la **Ratificación Formal del Scope Lock v3.0** y posterior autorización de implementación.
