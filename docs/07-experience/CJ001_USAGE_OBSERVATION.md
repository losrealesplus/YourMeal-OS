# CJ-001 · Observación de uso (pre-FOV)

**Estado:** Experience Refactor v1 listo para **evidencia**, no para más intuición de diseño.  
**Journey:** [CJ-001 Pedido semanal](./CUSTOMER_JOURNEYS.md#cj-001--pedido-semanal)  
**Rol del observador:** primer cliente de EatClean — **no** desarrollador de YourMeal OS.

> No abrir Cursor · GitHub · Lovable. Abrir el móvil.

---

## Congelación Experience (intuición)

Hasta completar al menos **una** sesión de observación real:

- ❌ No rediseñar pantallas “porque nos parece mejor”
- ❌ No abrir otra línea de Experience
- ✅ Solo cambios si la observación los exige (o bloqueo smoke / HP-001)

La FOV operativa (cocina / ORR) sigue su línea.  
Esta hoja es la **evidencia de experiencia** del cliente final.

---

## Test de mañana (solo)

```text
Descargo la app
    ↓
La abro
    ↓
Veo EatClean
    ↓
Inicio sesión
    ↓
Veo el menú
    ↓
Elijo mis platos
    ↓
Confirmo
    ↓
Cierro la app
```

Al terminar, **solo** estas cuatro preguntas:

| # | Pregunta | Sí / No / Notas |
|---|----------|-----------------|
| 1 | ¿Entendí qué hacer en menos de 5 segundos? (Home → siguiente acción clara) | |
| 2 | ¿Las fotos me dan hambre? | |
| 3 | ¿Sentí que estaba usando **EatClean** (no OS / ERP / dashboard)? | |
| 4 | ¿El pedido parece una **compra de comida**, no una configuración? | |

Si las cuatro son sí → CJ-001 Experience Refactor v1 se puede dar por validado en primera persona.

---

## Sesión con persona nueva (20–30 min)

**Instrucción única** (sin briefing de producto):

> «Haz tu pedido para la próxima semana.»

### Ritual

1. No ayudar. No corregir. No explicar.
2. Responder solo si es imprescindible para no abandonar.
3. Anotar, no opinar.

### Qué registrar

| Señal | Ejemplo |
|-------|---------|
| Dónde duda | Pausa > 5 s · mira arriba/abajo |
| Qué toca primero | CTA · foto · nav · otro |
| Qué no entiende | Palabra · icono · paso |
| Ignora CTA principal | Sí / No |
| Busca algo donde no está | ¿Qué buscaba? ¿Dónde? |

### Cierre (misma sesión, 2 frases)

- Completó CJ-001 sin ayuda: **sí / no**
- Frase espontánea más cercana a: *«Ha sido fácil. Ya tengo listo mi pedido.»* — **sí / aproximada / no**

---

## Qué hacer con el resultado

```text
Observación
    ↓
Evidencia (esta hoja / FO de experiencia)
    ↓
Gate: ¿cambiar pantalla? ¿copy? ¿foto? ¿nada?
```

No inventar features.  
No “pulir” sin evidencia.  
Si hace falta foto oficial por plato → Tenant Assets (`tenants/eatclean/media/`), no lógica nueva.

---

## Relacionado

- Sprint UI: [EXPERIENCE_REFACTOR_EATCLEAN_V1](./EXPERIENCE_REFACTOR_EATCLEAN_V1.md)  
- FOV operación (otra línea): [02-observation-plan-eatclean](../20-evidence-framework/fov/02-observation-plan-eatclean.md)  
- ADR-0014: la app debe sentirse EatClean
