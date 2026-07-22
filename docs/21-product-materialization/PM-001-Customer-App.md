# PM-001 — Customer App Foundation

**Sprint:** 2.1  
**Estado:** ⏳ Siguiente incremento Lovable  
**Marca / tenant de referencia:** EatClean Tenerife Catering · YourMeal OS

---

## 1. Objetivo

> Materializar la aplicación móvil de EatClean Tenerife Catering by YourMeal OS para el **cliente final**, respetando íntegramente el Operational Model **Table-Validated**.

No implementar lógica de negocio nueva.  
Materializar experiencia sobre infraestructura ya existente.

---

## 2. Alcance

**Incluye**

- Arquitectura Customer App (móvil)  
- Navegación de **4 tabs** (ampliar el shell actual de 3 → 4)  
- Ruta base pedidos: `/app/orders`  
- Dashboard principal (`/app`)  
- Flujo programación pedido semanal  
- Menú semanal (`/app/menu`)  
- Detalle del plato  
- Resumen del pedido  
- Perfil (evolucionar `/app/settings`)  
- Componentes reutilizables  
- Design System inicial alineado a EatClean (tokens/base; refinamiento global en PM-005)

**Excluye**

- Motores Order/Plan/Batch/Route  
- Amend / Pause / Hold cableados como dominio nuevo  
- Admin / Production / Delivery apps (PM-002…004)  
- Heurísticas o recomendaciones «inteligentes»

---

## 3. Actores

| Actor | Rol en este PM |
|-------|----------------|
| Cliente / Beneficiary (app) | Usuario principal |
| Company Account (contexto) | Quién paga — visible solo si el OM lo exige en UI informativa |

---

## 4. Capacidades

- Consultar estado del pedido / próxima entrega  
- Explorar y programar desde menú semanal  
- Ver detalle de plato (información de oferta, no inventar nutrición no certificada)  
- Revisar resumen antes de confirmar (UI; sin inventar reglas de confirmación)  
- Consultar historial / mis pedidos  
- Gestionar perfil / preferencias de idioma (i18n existente)

---

## 5. Objetos operacionales implicados

| Objeto | Uso en UI |
|--------|-----------|
| Menu | Menú semanal · oferta |
| Dish | Detalle de plato |
| Order / Order Item | Dashboard · resumen · lista pedidos |
| Beneficiary | Perfil / para quién es el pedido (si aplica) |
| Delivery (proyección) | «Próxima entrega» en dashboard — solo presentación |
| Payment / Account | Facturación / estado de cobro — solo si hay datos; sin inventar flujo de pago nuevo |

---

## 6. Restricciones

```text
El proyecto ya dispone de:
- shell móvil Customer (/app)
- audit_log
- feature_flags
- i18n (6 idiomas: en, es, de, fr, it, pt)

Utiliza esta infraestructura.
No la recrees.
No propongas alternativas.

No inventes reglas de negocio.
No inventes entidades.
Diseña experiencias completas (vacío · datos · loading · error · offline · a11y).
Cada pantalla nueva debe poder mapearse a la matriz pantalla↔conocimiento.
```

---

## 7. Referencias OM

- `docs/17-operational-model/` — Menu · Dish · Order · Beneficiary · Delivery · Payment  
- [Matriz](./01-screen-knowledge-matrix.md) — filas Cliente  
- [IA](../15-product/PRODUCT_INFORMATION_ARCHITECTURE.md)  
- [Rules](./PRODUCT_MATERIALIZATION_RULES.md)

---

## 8. Criterios de aceptación

- [ ] 4 tabs: Home/Dashboard · Menu · Orders · Profile  
- [ ] Ruta `/app/orders` operativa en navegación  
- [ ] Dashboard con estados: vacío · pendiente · confirmado · loading · error  
- [ ] Menú semanal + detalle plato + resumen pedido (UI)  
- [ ] Perfil usa i18n existente (cambio de idioma)  
- [ ] Ninguna regla de negocio nueva en servicios de dominio  
- [ ] Textos i18n en namespaces customer (6 idiomas o claves listas)  
- [ ] Incremento revisable en repo vía Lovable sync  

---

## 9. Entregables

1. Navegación 4 tabs en `MobileShell`  
2. Pantallas listadas en alcance  
3. Componentes reutilizables Customer  
4. Actualización matriz si hay pantallas nuevas justificadas  
5. Notas de sync Lovable → repo  

---

## 10. Prompt Lovable (copiar)

```text
PM-001 — Customer App Foundation

Materializa la Customer App móvil de EatClean Tenerife Catering by YourMeal OS
para el cliente final. Respeta el Operational Model Table-Validated.

Contexto existente (OBLIGATORIO reutilizar, no recrear):
- Shell móvil en /app (MobileShell)
- Hoy hay tabs Home, Menu, Settings — amplía a 4 tabs:
  Home/Dashboard | Menu | Orders | Profile
- Añade ruta /app/orders
- audit_log, feature_flags, i18n (en, es, de, fr, it, pt) ya existen

Produce:
- Dashboard principal (experiencia completa)
- Flujo programación pedido semanal
- Menú semanal + detalle de plato + resumen de pedido
- Lista / detalle de pedidos
- Perfil (evoluciona settings)
- Componentes reutilizables + Design System inicial alineado a EatClean

Para CADA pantalla incluye estados: vacío, con datos (pedido pendiente /
confirmado donde aplique), loading, error, offline si aplica, accesibilidad.

NO inventes reglas de negocio ni entidades.
NO implementes motores Order/Plan/Batch/Route.
NO propongas otra stack de i18n, auditoría o feature flags.
Si algo no está en el Operational Model / matriz, omítelo o márcalo
"fuera de alcance / pendiente de evidencia".

Entrega un incremento revisable sincronizado con el repositorio.
```
