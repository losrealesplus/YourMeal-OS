# CR-COST-05 — Product Architecture Evolution v4.0 (Economic Command Center)

**Subsystem:** Platform Core / Cost Intelligence  
**Document Status:** 🟡 **DRAFT DE ARQUITECTURA DE EXPERIENCIA — PENDIENTE DE REVISIÓN HUMANA**  
**Implementación:** 🔴 **BLOQUEADA (Cero código, Cero commits, Cero mutaciones)**  
**Fecha:** 2026-09-27  

---

## 1. 🎯 Tesis de Producto: Del Dashboard de Navegación al Economic Command Center

### El Problema Fundamental de las Versiones Anteriores (v1–v3.1)
Hasta v3.1, la pantalla `/admin/cost-intelligence` obligaba al usuario a **navegar entre pestañas aisladas y abrir popups flotantes** para encontrar información económica:
1. La pantalla de inicio recibía al usuario con un simulador paramétrico genérico de sliders (+15% proveedor, +25% energía).
2. La inteligencia de mercado estaba relegada a la **Pestaña 5**, invisible a primera vista.
3. Las acciones de valor (*ver dispersión, generar informe, imputar indirectos, preguntar al mercado*) ocurrían encerradas en diálogos modales desvinculados del flujo.
4. Al pulsar `[Simular]`, la pantalla saltaba bruscamente de pestaña, desorientando al usuario.

### La Nueva Jerarquía de Experiencia v4.0
En v4.0, la pantalla no pregunta *“¿Qué pestaña quieres ver?”* ni *“¿Qué porcentaje macroeconómico quieres mover?”*.  
La pantalla responde de inmediato a la pregunta ejecutiva del gerente gastronómico:

> ## **“¿Dónde estás perdiendo dinero hoy, qué evidencia existe y qué puedes decidir ahora mismo?”**

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         ECONOMIC COMMAND CENTER (v4.0)                           │
│                                                                                  │
│  1. TRIAGE EJECUTIVO       → ¿Qué requiere mi atención inmediata?               │
│  2. OPORTUNIDADES ACTIVAS  → Objeto central: Pechuga de pollo (+12,3% sobreprecio) │
│  3. EVIDENCIA GROUND TRUTH → Coste Real vs Suelo Makro vs Techo Mercadona         │
│  4. SIMULACIÓN IN-SITU E9  → Impacto directo en margen de plato (sin saltos)     │
│  5. DECISION INTENT        → Registrar acción comercial auditada                 │
│  6. PROFUNDIZACIÓN         → Ingestas, Mapeo, Escandallos y Simulador Avanzado    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🏛️ Reestructuración de la Información Architecture (IA)

### De 5 Pestañas Fragmentadas a un Canvas Unificado con Secciones de Profundización

```text
ESTRUCTURA ANTERIOR (v3.1 - Fragmentada)
/admin/cost-intelligence
 ├── [Tab 1] Simulador Macro (Sliders)          ← Entrada por defecto (Pasiva)
 ├── [Tab 2] Anatomía de Costes (WAC)           ← Desconectada
 ├── [Tab 3] Escenarios Guardados               ← Archivo
 ├── [Tab 4] Histórico de Decisiones            ← Registro
 └── [Tab 5] Inteligencia de Mercado (CR-COST-05) ← Oculta al fondo

NUEVA ARQUITECTURA (v4.0 - Economic Command Center)
/admin/cost-intelligence (Single Unified Canvas)
 │
 ├── [1] Command Strip: Triage Ejecutivo de Oportunidades & KPIs
 │       ├── 🔴 Oportunidades Directas de Ahorro (Acción Inmediata)
 │       ├── 🟡 Escandallos Incompletos (Imputar Costes Indirectos)
 │       └── ⚪ Referencias Observables & Cobertura de Mercado
 │
 ├── [2] Feed Central de Oportunidades de Decisión (El Objeto Principal)
 │       └── Cada Opportunity Card despliega:
 │           ├── Delta WAC [REAL] vs Benchmark [OBSERVADO]
 │           ├── Ahorro Anual Verificado (€/año)
 │           ├── Evidencia de Fuentes (Makro, GM Cash, Mercadona)
 │           └── Acciones In-Situ: [⚡ Simular en Plato] [🤝 Negociar] [🔎 Dispersión]
 │
 ├── [3] In-Situ Simulation Canvas (E9 Contextualizado, Sin Salto de Pestaña)
 │       └── Al pulsar [⚡ Simular], la tarjeta se expande verticalmente:
 │           ├── Muestra el plato afectado: "Pollo Asado con Guarnición"
 │           ├── Comparativa side-by-side: Coste Real (4,20 €) vs Proyectado (3,95 €)
 │           ├── Margen Bruto: 66,40% ──► 68,40% (+2,00%)
 │           └── [🔄 Revertir Hipótesis] | [📝 Registrar Acuerdo de Negociación]
 │
 └── [4] Espacio de Profundización & Gestión (Secciones Colapsables / Drawers)
         ├── 📂 Catálogo Observable & Cola de Mapeo (Gestión de Fuentes y SKU)
         ├── 🧪 Explorador "Preguntar al Mercado" (Viabilidad de Nuevas Recetas)
         ├── 🔬 Anatomía Completa de Escandallos (WAC, Mermas y Desglose)
         ├── 🎛️ Simulador Paramétrico Avanzado (Shock Energético / Inflación General)
         └── 📜 Histórico de Decisiones Auditadas (Audit Trail)
```

---

## 3. 🔄 Matriz de Transformación: Qué cambia, qué pasa a ser in-situ y qué se preserva

| Elemento Funcional | Rol en v3.1 | Nuevo Rol en v4.0 | Razón de Experiencia |
| :--- | :--- | :--- | :--- |
| **Simulador E9** | Pestaña 1 por defecto (Sliders macro) | **Canvas de simulación in-situ** desplegado dentro de la oportunidad + sección avanzada | Deja de ser una barrera inicial; se convierte en el motor que demuestra el impacto de la oportunidad. |
| **Oportunidades de Mercado** | Bloque secundario dentro de Tab 5 | **Elemento nuclear y jerarquía visual #1** de toda la pantalla | El usuario ve el dinero en riesgo y las acciones posibles en los primeros 5 segundos. |
| **Ahorro Anual (€/año)** | Texto en modal o tarjeta pequeña | **Métrica financiera destacada** (Solo si hay volumen real) | Comunica el retorno económico de la acción. |
| **Imputación `[MANUAL]`** | Botón que abría un popup Dialog | **Micro-editor in-situ expandible** en la propia tarjeta de plato | Permite completar el coste indirecto sin perder el contexto visual de la receta. |
| **Dispersión de Fuentes** | Modal Dialog flotante | **Inspector contextual inline** (Makro floor vs Mercadona ceiling) | Elimina la acumulación de popups. |
| **Informe de Negociación** | Modal Dialog flotante | **Panel lateral deslizable / Vista imprimible directa** | Herramienta de salida para el comprador. |
| **"Preguntar al Mercado"** | Modal flotante | **Banco de Pruebas preliminar colapsable** | Espacio de experimentación de nuevos platos sin contaminar catálogo. |
| **Cola de Mapeo & CSV** | Drawers independientes | **Cajón de Herramientas de Catálogo** accesible desde el Command Strip | Permanece como herramienta de back-office sin estorbar el flujo de decisión. |

---

## 4. 🔲 Wireframes Textuales de los 4 Estados Clave de la Experiencia

### Estado 1: Entrada Principal al Economic Command Center (Default View)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ YOURMEAL-OS · COCKPIT DE INTELIGENCIA DE COSTES                            [Tenant: EatClean Tenerife] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  🔴 1 OPORTUNIDAD DIRECTA          🟡 1 DATO POR COMPLETAR           ⚪ 4 REFERENCIAS OBSERVABLES      │
│  840,00 €/año ahorro potencial     Coste indirecto sin configurar    Fuentes: Makro · GM · Mercadona   │
│                                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ⚡ OPORTUNIDADES ESTRATÉGICAS DE ACCIÓN INMEDIATA                                                      │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🟢 ACCIÓN DIRECTA  │  Pechuga de Pollo Fresca                          [Ahorro: 840,00 €/año]    │  │
│  ├──────────────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                                  │  │
│  │   WAC REAL AUDITADO            BENCHMARK OBSERVADO          DESVIACIÓN DE MERCADO                │  │
│  │   6,40 €/kg                    5,70 €/kg                    +12,3% sobreprecio                   │  │
│  │                                                                                                  │  │
│  │   Evidencia: Suelo Makro 5,53 €/kg (Caja 5kg) │ Techo Mercadona 7,20 €/kg (Bandeja 500g)         │  │
│  │   Volumen anual auditado: 1.200 kg/año │ Comparabilidad: ALTA                                    │  │
│  │                                                                                                  │  │
│  │   Platos afectados: "Pollo Asado con Guarnición" (Coste ración actual: 4,20 €)                   │  │
│  │                                                                                                  │  │
│  │   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │  │
│  │   │ [⚡ Simular Impacto en Plato]   [🤝 Informe Negociación]   [🔎 Ver Dispersión Completa]  │   │  │
│  │   └──────────────────────────────────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🟡 REVISAR DATOS    │  Aceite de Oliva Virgen Extra 5L                 [Ahorro: — Sin volumen]   │  │
│  ├──────────────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │   WAC Real: 8,20 €/L  ──►  Mercado: 7,45 €/L (-9,1%) │ Requiere registrar volumen anual de compra  │  │
│  │   [📝 Completar Volumen]   [🔎 Ver Fuentes]                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ▼ HERRAMIENTAS DE PROFUNDIZACIÓN & GESTIÓN                                                           │
│    [+ Importar Catálogo CSV]   [Cola de Mapeo (1/2)]   [Preguntar al Mercado]   [Simulador Macro E9]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Estado 2: Simulación In-Situ Contextualizada (Al pulsar `[⚡ Simular Impacto en Plato]`)

> **Cero salto de pestaña.** La tarjeta de Pechuga de Pollo se expande en el propio canvas mostrando la proyección económica en tiempo real con reversibilidad inmediata.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ SIMULACIÓN DE HIPÓTESIS EN CURSO: Pechuga de Pollo @ 5,70 €/kg (-10,9% vs WAC)                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  IMPACTO PROYECTADO EN PLATO: "Pollo Asado con Guarnición" (PVP: 12,50 €)                              │
│                                                                                                        │
│  MÉTRICA                     BASE REAL AUDITADA         PROYECCIÓN SIMULADA        VARIACIÓN           │
│  ─────────────────────────────────────────────────────────────────────────────────────────────         │
│  Materia Prima (BOM):        2,24 €                     2,00 €                     -0,24 € (-10,9%)    │
│  Costes Indirectos:          1,96 €                     1,96 €                      0,00 €             │
│  Coste Total Ración:         4,20 €                     3,96 €                     -0,24 € (-5,7%)     │
│  Margen Bruto de Plato:      66,40 %                    68,32 %                    +1,92 %             │
│                                                                                                        │
│  Impacto Mensual (400 raciones/mes): +96,00 € beneficio neto proyectado                                │
│  Impacto Anual Proyectado:           +1.152,00 € beneficio neto proyectado                             │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ [📝 Registrar Decisión Comercial / Negociación]          [🔄 Revertir Hipótesis a Coste Real]   │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                        │
│  Nota: Esta proyección es determinista en memoria. No altera facturas, stocks ni WAC contable real.   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Estado 3: Registro de Decisión In-Situ (Al pulsar `[📝 Registrar Decisión]`)

> El usuario no se va a otra pestaña ni abre un modal ciego. Registra la intención directamente ligada a la oportunidad y al plato.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  📝 REGISTRO DE DECISIÓN DE GESTIÓN (Audit Trail Supabase)                                             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  Tipo de Acción:       [ Renegociar precio con Proveedor Principal                  ▼ ]                │
│  Objetivo Económico:   Alcanzar precio objetivo de 5,70 €/kg igualando benchmark Makro                 │
│  Fecha Prevista:       [ 2026-10-01 ]                                                                  │
│  Justificación:        [ Brecha de +12,3% identificada frente a Makro Canarias. Se solicitará       ]  │
│                        [ descuento por volumen anual consolidado de 1.200 kg.                        ]  │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ [ Guardar Decisión en Registro Inmutable ]                                [ Cancelar ]           │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Estado 4: Micro-Editor In-Situ de Costes Indirectos `[MANUAL]` (En la sección de Anatomía)

> Permite imputar supuestos de mano de obra y energía directamente en la fila del plato con confirmación clara de inmutabilidad económica.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PLATO: Pollo Asado con Guarnición (PVP: 12,50 € │ Materia Prima Real: 2,24 €)                         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  Mano de Obra [MANUAL]:     [ 1,50 ] €/ración     (ej. 12 min tiempo cocina @ 7,50 €/h)                │
│  Energía y Cocción [MANUAL]:[ 0,50 ] €/ración     (ej. Horno rational trifásico)                       │
│  Packaging [MANUAL]:        [ 0,40 ] €/ración     (ej. Barqueta termosellable + faja)                  │
│                                                                                                        │
│  ⚠️ Aviso: Valores registrados como supuestos operativos [MANUAL]. No alteran WAC ni facturas reales.  │
│                                                                                                        │
│  [ Guardar Costes Operativos ]   [ Cancelar ]                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 📱 Adaptabilidad Desktop y Mobile / Responsive

| Elemento | Desktop (>= 1024px) | Tablet / Mobile (< 1024px) |
| :--- | :--- | :--- |
| **Command Strip** | 3 tarjetas horizontales en grid de 3 columnas | Carrusel deslizable horizontal o stack vertical compacto |
| **Opportunity Cards** | Layout en 2 columnas: Datos a la izquierda, métricas de impacto a la derecha, barra de acciones inferior | Stack vertical: Título + Badges $\to$ Comparativa WAC/Benchmark $\to$ Ahorro $\to$ Acciones en botones full-width |
| **In-Situ Simulation** | Tabla comparativa side-by-side (Real vs Simulado) | Tarjetas de métrica comparativa apiladas (Coste plato, Margen %, Impacto mensual) |
| **Panel de Profundización** | Acordeones expandibles en el pie del canvas | Secciones colapsables con toggle táctil |

---

## 6. 🚦 Reglas de Transición y Gobernanza de v4.0

1. **La oportunidad gobierna la pantalla:** Si existen ingredientes con sobreprecio y volumen real, aparecen en el bloque superior con Grado `🟢 ACCIÓN DIRECTA`.
2. **Cero saltos de pestaña para simular:** Toda simulación originada en una oportunidad se despliega in-situ dentro del mismo viewport.
3. **El simulador macro E9 sigue disponible:** Si el usuario quiere simular shocks globales (+20% inflación general), la herramienta vive en la sección colapsable inferior sin estorbar el flujo diario.
4. **Ningún modal bloqueante nuevo:** Los formularios de decisión y edición se abren inline / in-situ.

---

## 📄 Conclusión para Revisión Humana

Este documento define la **arquitectura visual y de experiencia v4.0 (Economic Command Center)**.  
No se ha modificado código. Queda sometido a la calibración y ratificación de la **Human Product Authority** antes de planificar cualquier cambio en el codebase.
