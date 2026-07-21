# OPERATIONS_CONTROL_CENTER — Centro de Control

**Antes llamado:** Operations Dashboard  
**Tipo:** Product Blueprint  
**No es:** BI · vanity KPIs · wireframe React  
**Sí es:** torre de control de la operación diaria

> Un dashboard enseña datos.  
> Un **Centro de Control** enseña el **estado de una operación**.

La superficie principal sigue siendo:

```text
¿Qué necesita tu atención ahora?
```

Ese es el verdadero frontend del negocio.

---

## Filosofía

Como una torre de control de aeropuerto:

- no es un mural de estadísticas;
- es el estado de lo que está pasando y lo que debe resolverse;
- construido sobre [Operational Checks](./OPERATIONAL_CHECKS.md).

Principios:

- acción antes que información;
- anticipación antes que reacción;
- nunca métricas sin contexto;
- contexto (hora, rol, estado) filtra qué se muestra;
- Checks explicables que no deciden por la persona.

---

## Jerarquía visual (conceptual)

```text
1. Título / momento
   ¿Qué necesita tu atención ahora?
   (rol · hora · fase operativa)

2. Estado de la operación (Checks)
   ✓ En orden
   ⚠️ Requiere atención
   ❌ Bloqueante / crítico

3. Cada ítem = Check → acción
   Qué se comprobó
   Por qué avisa
   CTA → Asistente que ayuda a resolver
```

Una acción = el menor número de clics posible hasta la solución.

---

## Etapas de adopción en el Centro de Control

| Etapa | Qué muestra el Centro |
|-------|------------------------|
| 1 Digitalizar | Datos digitalizados (aún pocas comprobaciones) |
| 2 Validar | Checks que detectan sin recomendar compra/ruta |
| 3 Recomendar | Checks + recomendación explícita |
| 4 Optimizar | Patrones aprendidos (con evidencia / multi-org) |

No saltar de la etapa 1 a la 4.

---

## Tipos de señal

| Señal | Significado | Ejemplo |
|-------|-------------|---------|
| ✓ | Check OK | Pollo suficiente |
| ⚠️ | Requiere atención | Falta lechuga / ruta larga |
| 🔴 / ❌ | Crítico / bloqueante | Descongelar antes de las 18:00 |
| 🔵 | Calidad / editorial | Menú demasiado similar |

---

## Acciones

Cada tarjeta debe permitir:

1. **Entender** — qué se comprobó y por qué.  
2. **Actuar** — ir al Asistente.  
3. **Posponer / asignar** (futuro).  
4. **Resolver** — cuando el estado lo confirma.

---

## Ejemplo (gerente, tarde — etapa Validar/Recomendar)

```text
¿Qué necesita tu atención ahora?

🔴 Check · Producción
Pendiente descongelar pollo para mañana (merma incluida).
Acción: sacar 28 kg antes de las 18:00.

⚠️ Check · Stock
Lechuga cubre 10; producción prevista 20.
Acción: comprar antes de las 18:00. (recomendación si etapa ≥ 3)

⚠️ Check · Reparto
Ruta Norte supera ventana habitual (~+35 min).
Acción: adelantar salida o redistribuir.

✓ Check · Packaging
Bolsas del turno actual completas.
```

---

## Qué no es

- Un mural de KPIs vanity.  
- Un acceso a todos los módulos.  
- Un chat con IA.  
- Un sistema que decide por la persona.

---

## Nota de nombre

El archivo histórico puede seguir enlazado como «dashboard» en conversaciones antiguas.

El concepto de producto es **Centro de Control**.

---

## Relacionado

- [OPERATIONAL_CHECKS.md](./OPERATIONAL_CHECKS.md)
- [OPERATIVE_ASSISTANTS.md](./OPERATIVE_ASSISTANTS.md)
- [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)
- [IDENTIDAD_ASISTENTES_OPERATIVOS.md](./IDENTIDAD_ASISTENTES_OPERATIVOS.md)
