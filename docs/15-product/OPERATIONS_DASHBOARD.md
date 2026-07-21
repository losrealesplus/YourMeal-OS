# OPERATIONS_DASHBOARD — ¿Qué necesita tu atención ahora?

**Tipo:** Product Blueprint (Product Era)  
**No es:** wireframe · mock React · BI dashboard  
**Sí es:** especificación de la **pantalla principal del negocio**

---

## Filosofía

No es un dashboard clásico de gráficos.

Es una **bandeja de trabajo**.

```text
¿Qué necesita tu atención ahora?
```

Ese es el verdadero frontend del negocio.

Todo lo demás son pantallas secundarias.

Principios aplicados ([PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)):

- acción antes que información;
- anticipación antes que reacción;
- nunca métricas sin contexto;
- el contexto (hora, rol, estado) filtra qué se muestra.

---

## Jerarquía visual (conceptual)

```text
1. Título / momento
   ¿Qué necesita tu atención ahora?
   (contexto: rol · hora · fase operativa)

2. Cola de atención (prioridad descendente)
   🔴 Crítico
   🟡 Atención
   🟢 En orden / informativo positivo
   🔵 Sugerencia / calidad (menú, etc.)

3. Cada ítem = una decisión
   Título de acción
   Motivo breve
   CTA → Asistente / Capability que resuelve
```

Una acción = el menor número de clics posible hasta la solución.

---

## Tipos de alertas

| Severidad | Significado | Ejemplo |
|-----------|-------------|---------|
| 🔴 Crítica | Bloquea mañana o hoy si no se actúa | Descongelar 8 kg de pollo antes de las 18:00 |
| 🟡 Atención | Riesgo o desvío manejable | Faltan ingredientes para 6 ensaladas · ruta +35 min |
| 🟢 OK | Confirmación útil (no ruido) | Packaging completo · rutas dentro de tiempo |
| 🔵 Calidad / editorial | Mejora, no emergencia | Platos demasiado similares a la semana pasada |

Nunca mostrar un 🟢 o un dato «por rellenar el dashboard».

---

## Acciones

Cada tarjeta debe permitir:

1. **Entender** — qué pasa y por qué (una o dos líneas).  
2. **Actuar** — ir al Asistente que resuelve.  
3. **Posponer / asignar** (futuro) — sin perder la alerta.  
4. **Resolver** — desaparece o baja de severidad cuando el estado lo confirma.

❌ Abrir un informe de stock genérico.  
✅ «Comprar 6 kg de lechuga» → Purchasing Assistant con la línea ya propuesta.

---

## Prioridades

Orden de presentación (salvo override por rol):

1. 🔴 que afectan a la producción de las próximas horas / mañana  
2. 🟡 que afectan a salida a ruta o packaging incompleto  
3. 🟡 compras / cobros  
4. 🔵 calidad de menú  
5. 🟢 confirmaciones (pocas; solo si reducen ansiedad operativa)

El **repartidor** no ve lo mismo que el **gerente**.  
A las **17:00** no se prioriza igual que a las **04:15**.

---

## Ejemplo de bandeja (gerente, tarde)

```text
¿Qué necesita tu atención ahora?

🔴 Acción crítica
Descongelar 8 kg de pollo antes de las 18:00.
Motivo: producción de mañana depende de ello.

🟡 Producción / compras
Faltan ingredientes para 6 ensaladas de mañana.

🟡 Reparto
2 rutas superan el tiempo habitual de los martes (~+35 min).

🟡 Administración
3 pedidos con cobro en entrega.

🟢 Packaging
Todas las bolsas de mañana aún no aplican — o —
Packaging de hoy completo.
```

---

## Qué no es esta pantalla

- Un mural de KPIs vanity.  
- Un acceso directo a todos los módulos.  
- Un chat con IA.  
- Una lista infinita sin severidad.

---

## Relacionado

- [OPERATIVE_ASSISTANTS.md](./OPERATIVE_ASSISTANTS.md) — Operations Assistant
- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [IDENTIDAD_ASISTENTES_OPERATIVOS.md](./IDENTIDAD_ASISTENTES_OPERATIVOS.md)
