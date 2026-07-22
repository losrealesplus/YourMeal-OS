# Plantilla de transición

Copiar por cada transición permitida nueva.

---

## `[Objeto]` · `[Evento]`

**Transición:** `[Estado origen]` → `[Estado destino]`

| Campo | Contenido |
|-------|-----------|
| **Evento** | |
| **Responsable** | |
| **¿Cuándo?** | |
| **¿Por qué?** | |

### Precondiciones

- [ ] 

### Operational Checks (antes del cambio)

- [ ] 

### Postcondiciones

- [ ] 

### Dependencia operativa relacionada

`[Sujeto]` **[verbo]** `[Objeto]` — ver [verbs.md](../03-relationships/verbs.md)

---

## Ejemplo mínimo

### Production Batch · Start Production

**Transición:** `Planned` → `In progress`

| Campo | Contenido |
|-------|-----------|
| **Evento** | Start Production |
| **Responsable** | Employee (cocina) |
| **¿Cuándo?** | Inicio de turno / slot de producción |
| **¿Por qué?** | Ejecutar lo planificado |

### Precondiciones

- Production Plan en ejecución o Ready  
- Batch asignado a Dish / cantidad  

### Operational Checks

- Stock suficiente (Ingredient vía Recipe)  
- Descongelación OK si aplica  
- Recetas disponibles  

### Postcondiciones

- Batch consume Stock (operativamente)  
- Packaging pendiente puede avanzar tras `Completed`  

### Dependencia

`Production Plan` **executes as** `Production Batch`
