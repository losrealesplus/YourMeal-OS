# MOMENTOS_DE_DECISION — El día por cuándo decidir

**Tipo:** Product Blueprint (Product Era)  
**Organización de referencia:** EatClean  
**Complementa:** [EATCLEAN_DIA_OPERATIVO.md](./EATCLEAN_DIA_OPERATIVO.md)  
**Estado:** borrador — validar personas y horarios en cocina (casillas **¿?**)

No modelamos departamentos.

Modelamos **momentos**.

```text
Antes de cerrar
        ↓
Antes de empezar
        ↓
Durante producción
        ↓
Durante packaging
        ↓
Antes del reparto
        ↓
Durante reparto
        ↓
Fin de jornada
```

---

## Antes de cerrar (víspera)

| | |
|--|--|
| **Objetivo** | Dejar mañana desbloqueada: descongelar, comprar, incidencias, producción lista |
| **Personas** | Gerente / admin · compras · cocina (cierre) **¿?** |
| **Decisiones** | Qué descongelar · qué comprar · qué incidencias cerrar · si la producción de mañana está cerrada |
| **Preguntas frecuentes** | ¿Qué falta para mañana? ¿Hay que sacar algo del congelador? ¿Pagos / pedidos a medias? |
| **Oportunidades** | Closing Assistant · Purchasing Assistant · alertas de dependencia temporal |

---

## Antes de empezar (~04:00)

| | |
|--|--|
| **Objetivo** | Saber qué cocinar primero sin preguntar |
| **Personas** | Cocina / prep **¿?** |
| **Decisiones** | Orden de cocción · prioridades · cambios de última hora · qué falta de mise en place |
| **Preguntas frecuentes** | ¿Qué se cocina hoy? ¿Cuántas raciones? ¿Hay cambios? ¿Falta algún ingrediente? |
| **Oportunidades** | Production Assistant · Operations Dashboard (apertura) |

---

## Durante producción

| | |
|--|--|
| **Objetivo** | Avanzar la cola de trabajo y controlar raciones |
| **Personas** | Cocineros / prep |
| **Decisiones** | Qué sigue · cuándo pasar a envasado · qué hacer con desvíos |
| **Preguntas frecuentes** | ¿Qué toca ahora? ¿Cuánto falta de X? ¿Quién hace Y? |
| **Oportunidades** | Kitchen Queue · Production Assistant |

---

## Durante packaging

| | |
|--|--|
| **Objetivo** | Envasar, etiquetar y agrupar sin errores por cliente |
| **Personas** | Packaging / cocina **¿?** |
| **Decisiones** | Qué lleva cada bolsa · si está completa · siguiente cliente |
| **Preguntas frecuentes** | ¿Qué lleva esta bolsa? ¿Es de María? ¿Falta el yogur? |
| **Oportunidades** | Packaging Assistant |

---

## Antes del reparto

| | |
|--|--|
| **Objetivo** | Salir solo si bolsas, rutas, asignaciones y pagos están listos |
| **Personas** | Logística · gerente · repartidores |
| **Decisiones** | Validar rutas · asignar cajas · repartir incidencias de cobro |
| **Preguntas frecuentes** | ¿Todas las bolsas completas? ¿La ruta es viable? ¿Quién lleva el Sur? ¿Ha pagado? |
| **Oportunidades** | Route / Delivery Builder · validación operativa de tiempo · estado de pago en entrega |

---

## Durante reparto

| | |
|--|--|
| **Objetivo** | Entregar en orden, registrar incidencias, cobrar si aplica |
| **Personas** | Repartidores |
| **Decisiones** | Siguiente cliente · ruta · cobro · incidencia · firma |
| **Preguntas frecuentes** | ¿Quién es el siguiente? ¿Cómo llego? ¿Cobro? ¿Qué hago si no hay nadie? |
| **Oportunidades** | Delivery Assistant |

---

## Fin de jornada

| | |
|--|--|
| **Objetivo** | Cerrar el día y preparar el siguiente ciclo (stock, pedidos, descongelar, incidencias) |
| **Personas** | Gerente · compras · cocina |
| **Decisiones** | Qué stock queda · qué pedir · qué descongelar · qué queda abierto |
| **Preguntas frecuentes** | ¿Cómo quedamos? ¿Qué compro? ¿Qué saco del congelador? ¿Qué incidencias siguen? |
| **Oportunidades** | Closing Assistant · Purchasing · Operations Dashboard (cierre) |

---

## Principio

Cada momento alimenta el feed:

**¿Qué necesita tu atención ahora?**

filtrado por rol y por hora.

---

## Relacionado

- [OPERATIVE_ASSISTANTS.md](./OPERATIVE_ASSISTANTS.md)
- [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md)
- [EATCLEAN_DIA_OPERATIVO.md](./EATCLEAN_DIA_OPERATIVO.md)
