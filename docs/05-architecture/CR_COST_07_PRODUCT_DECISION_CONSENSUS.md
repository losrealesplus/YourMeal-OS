# YOURMEAL OS — MARCO DE DECISIÓN DE PRODUCTO Y CONSENSO
## CR-COST-07 · Product Economics & Production Scenario Engine
**Document ID:** `CR-COST-07-DECISION-CONSENSUS-001`  
**Subsystem:** Core Cost Intelligence (E9) · Market Intelligence (E10) · Food Production Vertical  
**Status:** 🟢 **PRODUCT DECISION CONSENSUS RATIFIED**  
**Governance Standard:** Zero Code Mutation · Zero DB Migration · Zero Commits · Zero Deployment  
**Date:** 2026-09-27  
**Authority:** Human Product Authority & Multi-Agent Council  

---

```text
========================================================================================
                              ESTADO DE GOBERNANZA
========================================================================================
STATUS:                       PRODUCT DECISIONS CONSOLIDATED & RATIFIED
IMPLEMENTATION:               BLOCKED (Fase de Blueprint pendiente)
DATABASE:                     UNCHANGED (nhirlpkuvonggctdzzad intacta)
PRODUCTION:                   UNCHANGED (Cloudflare Worker 26a1ded6 intacto)
GIT WORKING TREE:             UNCHANGED (Solo documentación de arquitectura)
SIGUIENTE PASO:               CR-COST-07 PRODUCT BLUEPRINT & DATA CONTRACT
========================================================================================
```

---

## 1. El Principio Rector Constitucional

> ### 🏛️ Regla Constitucional de CR-COST-07:
> **"YOURMEAL OS NO ASUME: PREGUNTA, CALCULA Y EXPLICA."**  
> *El sistema no presupone porcentajes ciegos, no impone jerarquías rígidas y no inventa costes. Descubre la realidad operativa de la cocina mediante diálogo estructurado, calcula con rigor dimensional y justifica cada número ante el operador.*

---

## 2. Consenso de la Ronda 1: Las 5 Decisiones Constitucionales

### ① Modelo de Unidad y Cadena de Transformación
* **Ratificación:** **SÍ (Aprobado).**
* **Cadena:** `Compra → Ingrediente → Receta → Preparación/Lote → Rendimiento → Unidad de Venta`.
* **Flexibilidad Ontológica:** No se impone una jerarquía rígida donde cada producto deba cruzar todas las capas. Una tarta tiene receta $\to$ lote (1 tarta) $\to$ rendimiento (12 raciones); una salsa tiene receta $\to$ lote (10 kg) $\to$ venta (250 ml); una ensalada tiene receta (20 uds) $\to$ lote (20 uds) $\to$ venta (1 ud).
* **Unidad Canónica:** La **Preparación/Lote** es la unidad física fundamental de fabricación. La **Ración** es una unidad comercial derivada de venta.

### ② Modelo Económico: Coste Directo vs. Estructural
* **Ratificación:** **SÍ (Aprobado).**
* **Coste Directo Incremental:** $\text{Materia Prima} + \text{Mano de Obra Directa} + \text{Energía de Cocción} + \text{Packaging Primario} + \text{Mermas}$.
* **Coste Fijo / Estructural:** Alquiler, seguros, licencias, salarios base y amortización se mantienen **separados** del coste unitario para evitar repartos arbitrarios que distorsionen el margen.
* **Jerarquía de Márgenes:** El sistema reporta **Margen de Contribución** sobre el coste directo y utiliza los costes fijos exclusivamente para viabilidad mensual y cálculo de break-even global.

### ③ Frontera de Dominio de Product Economics
* **Ratificación:** **SÍ (Aprobado).**
* **Frontera:** El motor finaliza estrictamente en el **Producto Terminado listo para vender / entregar en el pase de cocina**.
* **Exclusión de Última Milla:** Repartidores, flotas, combustible, kilometraje, comisiones de agregadores (Glovo, Uber) pertenecen al dominio *Operations / Delivery Economics* y no contaminarán el escandallo de producción.

### ④ Arquitectura y Roadmap de CR-COST-07
* **Ratificación:** **SÍ (Aprobado).**
* **Nombre Oficial:** **CR-COST-07 — Product Economics & Production Scenario Engine**.
* **Desglose en 3 Fases Modulares:**
  1. **CR-COST-07A:** Recipe, Batch & Yield Foundation (BOM, unidades, mermas multietapa).
  2. **CR-COST-07B:** Operating Cost Drivers & Production Scenarios (MO, energía, packaging, motor de techo discreto).
  3. **CR-COST-07C:** Product Economics Decision Workspace (UI interactiva, síntesis ejecutiva, simulador).

### ⑤ Evolución de "Preguntar al Mercado"
* **Ratificación:** **SÍ (Aprobado).**
* **Evolución:** Muta de ser un cotizador plano de ingredientes a ser la puerta de entrada a:
  > **"Estudio Económico de Nuevo Producto"**  
  > *Un motor que analiza viabilidad completa a través de 9 pasos: Mercado $\to$ Receta $\to$ Rendimiento $\to$ Lotes $\to$ Costes Operativos $\to$ Escenarios de Escala $\to$ Economía $\to$ Capacidad $\to$ Decisión.*

---

## 3. Resoluciones Operativas de Fondo

### 3.1 Lotes Discretos vs. Fraccionables
* **Producción Fraccionable:** Permitida cuando la física culinaria lo admita (ej. caldos, arroces, salsas donde se puede preparar 0,5 lotes = 5 L).
* **Producción Discreta:** Obligatoria cuando el contenedor o técnica imponga enteros (ej. moldes de tarta, bandejas GN). El motor aplica techo entero:
  $$\text{Lotes Físicos} = \left\lceil \frac{\text{Demanda}}{\text{Rendimiento por Lote}} \right\rceil$$

### 3.2 Destino Económico del Excedente (No es Desperdicio Automático)
* Producir 24 raciones para cubrir una demanda de 20 genera **4 raciones excedentes**.
* El motor **no asume pérdida**. Pregunta el destino del excedente:
  - `STOCK_REFRIGERADO` / `STOCK_CONGELADO` (entra en activo realizable).
  - `VENTA_POSTERIOR` (absorción diferida).
  - `MERMA_DESPERDICIO` (absorbido 100% por la tirada actual).
  - `CONSUMO_INTERNO_MUESTRA` (gasto de marketing o personal).
* Distinción fundamental: **Coste de Producción Bruto** vs. **Coste Efectivo por Unidad Vendida**.

### 3.3 Mermas Cuantitativas Multietapa (Sin Biblioteca de Ficción)
* Modelo en 3 estadios explícitos:
  $$\text{Compra Bruta} \xrightarrow{-M_{limpieza}} \text{Útil Crudo} \xrightarrow{-M_{coccion}} \text{Masa Cocinada} \xrightarrow{-M_{porcionado}} \text{Producto Vendible}$$
* **Rechazo a Números Mágicos:** Cero porcentajes inventados por la plataforma. Mermas 100% parametrizables y trazables por el operador. La biblioteca de estándares queda postergada para fases avanzadas con datos empíricos auditados.

### 3.4 Mano de Obra: Tiempos Escalables
* Rechazo al porcentaje arbitrario sobre materia prima.
* Modelado descompuesto:
  $$T_{\text{total}} = T_{\text{fijo\_setup}} + (N_{\text{lotes}} \times T_{\text{variable\_lote}}) + T_{\text{fijo\_limpieza}}$$
* Permite modelar con honestidad por qué 1 tarta insume 3,33 min/ración y 4 tartas insumen 1,45 min/ración.

### 3.5 Energía en 3 Modos Legítimos
1. **Modo Cuantitativo:** $\text{Potencia (kW)} \times \text{Tiempo (h)} \times \text{Tarifa (€/kWh)}$.
2. **Modo Porcentual:** $X\%$ sobre el coste de materia prima (declarado abiertamente).
3. **Modo Promedio Manual:** Asignación fija (ej. 1,20 € por ciclo de horneado) con badge `[MANUAL]`.
* Prohibición absoluta de falsos ceros (`[Sin Configurar]` si no se especifica).

### 3.6 Packaging en 2 Niveles
* **Packaging de Producto:** Íntimamente ligado a la unidad de venta (tarrina, tapa, etiqueta).
* **Packaging Logístico:** Vinculado a la expedición en bulto (caja de transporte, isotérmico).

### 3.7 Las 4 Métricas de Break-Even
1. **Break-even por Unidad:** Raciones mínimas por tirada para no incurrir en pérdida directa.
2. **Break-even Mensual:** Volumen mensual necesario para absorber la estructura.
3. **PVP Mínimo:** Precio umbral para alcanzar el margen de contribución objetivo.
4. **Capacidad Operativa Requerida:** Ocupación de los cuellos de botella (hornos, personal) para producir dicho volumen.

---

## 4. Consenso de la Ronda 2: Decisiones Específicas (16 a 22)

### 📌 Pregunta 16: ¿Quién decide qué preguntas aparecen?
* **Consenso: Motor de Diálogo Adaptativo / Contextual.**
* El sistema ramifica dinámicamente según las respuestas previas (ej. si el producto es frío, no pregunta por hornos; si se produce a demanda por unidad, no activa lotes complejos).
* **Regla de Usabilidad:** El usuario siempre puede pulsar `[Saltar / Configurar después]`. Nunca se bloqueará al operador con un muro de 80 campos obligatorios.

### 📌 Pregunta 17: ¿Podemos tener "No Aplica"?
* **Consenso: SÍ, como distinción ontológica fundamental.**
* **Diferencia Crítica:**
  - `Packaging = 0,00 €` afirma falsamente que el envase existe pero es gratis.
  - `Packaging = [NO APLICA]` afirma con precisión que el producto se sirve a granel o en vajilla reutilizable propia sin packaging descartable.
* Esta distinción blinda el principio constitucional de *No False Zero*.

### 📌 Pregunta 18: La Cuádruple Taxonomía de Ausencia Epistémica
* **Consenso: APROBADA.**
* El motor clasificará cualquier parámetro en uno de cuatro estados de ausencia:
  1. `[NO APLICA]`: La dimensión no existe para este producto por definición operativa.
  2. `[NO CONFIGURADO]`: La dimensión existe (ej. mano de obra), pero el operador aún no ha introducido los parámetros.
  3. `[SIN DATOS]`: La dimensión está parametrizada, pero el sistema carece de lecturas de mercado o facturas vigentes.
  4. `[MANUAL]`: No hay datos auditados, pero el operador ha ingresado una estimación subjetiva de trabajo.

### 📌 Pregunta 19: Guardar y Reutilizar Arquetipos de Producción
* **Consenso: SÍ, programado para CR-COST-07B/C.**
* Capacidad de definir "Arquetipos de Proceso" (ej. *Método Horneado Repostería*, *Método Ensamble Frío*, *Método Fondo / Reducción*) para reutilizar tiempos de setup, equipos y packaging entre recetas afines sin reconfigurar desde cero.

### 📌 Pregunta 20: Escenarios Automáticos vs. Escenarios Personalizados
* **Consenso: SÍ a ambos.**
* El sistema proyectará por defecto la rampa estándar:
  `[ 10 · 20 · 30 · 60 · 100 · 300 ]`
* El operador tendrá libertad absoluta para añadir puntos discretos ad-hoc (`17`, `42`, `137`, `1.250 raciones`) para responder a presupuestos específicos de eventos o clientes B2B.

### 📌 Pregunta 21: Límites de Mutación en Escenarios (Sandbox de Simulación)
* **Consenso: Firewall Estricto de Datos Reales.**
* El operador puede alterar libremente variables de escenario (volumen, lotes, PVP hipotético, rendimiento alternativo, supuestos de tiempo).
* **Invariante:** Dichas alteraciones viven estrictamente en el estado volátil del escenario (`SIMULATED`). Jamás mutarán ni contaminarán el coste medio ponderado (WAC) real, las facturas almacenadas ni el inventario físico en Supabase.

### 📌 Pregunta 22: El Veredicto Económico Ejecutivo (Síntesis Narrativa)
* **Consenso: SÍ, la piedra angular del producto.**
* YourMeal OS no se limitará a mostrar una cifra inerte (`"Coste: 1,84 €"`).
* Generará una **Síntesis Ejecutiva Humana y Accionable**:
  > *"A 4,00 €/ración, el producto es viable en los escenarios de 60 a 300 raciones. A 10–30 raciones el coste unitario aumenta un 41% por el peso del setup y el excedente del molde mínimo. El principal factor de incertidumbre es el rendimiento de cocción (estimado manualmente) y la ausencia de precio de mercado para el queso crema."*
* Con botones de decisión soberana:
  `[Ver Anatomía de Costes]` · `[Comparar Escenarios]` · `[Simular Shock de Materia Prima]` · `[Aprobar para Carta]`

---

## 5. Próximo Paso Formal

Con este marco de consenso unificado entre la Autoridad Humana de Producto y el Consejo Multidisciplinar, el ciclo avanza según el protocolo de gobernanza:

$$\text{Discovery} \;\checkmark \;\longrightarrow\; \text{Human Questions} \;\checkmark \;\longrightarrow\; \text{Product Decisions} \;\checkmark \;\longrightarrow\; \mathbf{Blueprint} \;\longrightarrow\; \text{Scope Lock} \;\longrightarrow\; \text{Implementation}$$

**Siguiente Entregable:** Redacción del **CR-COST-07 Product Architecture Blueprint & Data Contract** (sin código, sin migraciones, sin commits a producción).
