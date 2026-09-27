# CR-OPS — Discovery: Operations Center Evolution

**Subsystem:** Platform Core / Operations Center  
**Status:** 🔵 DISCOVERY (Hallazgo Formal de Human Product Review)  
**Origin:** Hallazgo derivado durante la revisión de producto de CR-COST-05  
**Fecha:** 2026-09-27  

---

## 1. Declaración del Problema y Asimetría de Producto

Durante la Human Product Review de **CR-COST-05**, se detectó una asimetría estructural de producto dentro de `YourMeal OS`:

```text
COST INTELLIGENCE & PROCUREMENT
██████████████████████████████  → Evolucionando (WAC, E9, Market Intelligence, Benchmarks)

OPERATIONS CENTER (CENTRO DE OPERACIONES)
██████                          → Estático (Estructura inicial sin visión transversal)
```

### Principio Rector
> **"Cost Intelligence explica qué está pasando económicamente; Operations Center debe explicar qué se debe hacer al respecto."**

El Centro de Operaciones no debe ser un simple contenedor de métricas ni un menú de acceso a módulos, sino el **cuadro de mando transversal accionable** donde todas las capacidades de la plataforma se concentran en torno a las prioridades del día.

---

## 2. Pregunta Fundamental de Producto

> **"Si un gerente de EatClean abre YourMeal OS a las 8:00 de la mañana, ¿qué necesita saber en los primeros 30 segundos y qué debería poder hacer en los siguientes 2 minutos?"**

---

## 3. Los 10 Ejes de Estudio para la Fase Discovery

1. **Información Real del Centro:** Qué debe mostrar prioritariamente el Centro de Operaciones al iniciar la jornada.
2. **Acción Pendiente vs Métrica Pasiva:** Diferenciación estricta entre elementos que requieren decisión humana inmediata y telemetría de solo lectura.
3. **Integración Transversal de Dominios:**
   - Compras y recepción de mercancía.
   - Facturas de proveedores pendientes de revisar / autorizar.
   - Anomalías de costes y desviaciones WAC.
   - Oportunidades y alertas de precios de mercado.
   - Planificación de producción de cocina y escandallos.
   - Estado de pedidos y flujo de clientes.
   - Nivel de stock crítico y roturas de inventario.
   - Incidencias operativas activas.
4. **Resolución In-Situ:** Qué acciones operativas deben poder resolverse con un clic directamente desde el Centro sin cambiar de pantalla.
5. **Navegación Asistida:** Qué flujos complejos deben dirigir fluidamente al usuario a la vista profunda del módulo correspondiente.
6. **Umbrales de Alerta y Ruido Cognitivo:** Definición de qué alertas aportan valor real y cuáles generarían fatiga de notificaciones.
7. **Personalización por Rol:** Adaptación de la vista según el rol del usuario (*Gerente de Operaciones*, *Jefe de Cocina*, *Administrador Financiero*).
8. **Frontera Arquitectónica Core vs Tenant:** Qué componentes pertenecen al `Core` transversal y cuáles son adaptaciones específicas de la industria de alimentación / EatClean.
9. **Rescate de Capacidades Huérfanas:** Identificación de funcionalidades existentes en el backend o submódulos que actualmente carecen de visibilidad operativa.
10. **Diseño de la Experiencia "Primer Vistazo":** Arquitectura visual para garantizar claridad, jerarquía y reducción de fricción cognitiva en la apertura del sistema.

---

## 4. Estado de Gobernanza

```text
CR-OPS Operations Center
Discovery                  🔵 REGISTRADA / EN ESPERA DE AUTORIZACIÓN DE ESTUDIO
Scope Lock                 🔴 PENDIENTE
Implementation             🔴 BLOQUEADO
Git Commit                 🔴 BLOQUEADO
Production Deploy          🔴 BLOQUEADO
```
