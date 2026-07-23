# EatClean Brand Continuity · Locked (Lovable / Cursor)

**Knowledge Lifetime:** Implementation  
**Estado:** Locked — no reinterpretar; ejecutar lo ya decidido en PR #28 · #29  
**Reglas permanentes:** [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
**Contrato:** [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md)  
**Assets:** [`tenants/eatclean/`](../../tenants/eatclean/README.md)  
**Bitácora:** [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md)

> Copiar este prompt a Lovable **tal cual**. No inventar paletas, logos «EC», dashboards KPI ni lenguaje Admin/BackOffice.

---

```markdown
# Experience Refactor · EatClean Brand Continuity (Locked)

## Contexto

La Customer App ya no es una aplicación genérica de un SaaS.

Debe sentirse como la aplicación oficial de EatClean.

La referencia visual NO es un dashboard SaaS.

La referencia es la identidad actual de EatClean presente en:

- Sitio web oficial
- Instagram oficial

Toda decisión visual debe mantener continuidad entre:

Instagram → Web → App

No copiar el diseño de la web.

Sí copiar la identidad de marca.

---

# Branding

Usar exclusivamente la identidad EatClean.

## Logo

Utilizar el logotipo oficial de EatClean.

Debe ser el primer elemento visible del Login.

Aumentar aproximadamente un 15% respecto al tamaño actual.

Dar más espacio inferior antes del texto.

El logo es el ancla de marca.

Nunca utilizar logotipos genéricos ni iconos "EC".

---

# Colores

Mantener exactamente la personalidad visual de EatClean.

Paleta principal:

- Verde EatClean
- Crema
- Blanco

El amarillo NO es color principal.

Solo utilizarlo para llamar la atención en:

- badges
- chips
- indicadores
- pestaña activa
- promociones
- estados destacados

Los botones principales continúan siendo verdes.

No utilizar azules SaaS.

No utilizar morados.

No utilizar degradados tecnológicos.

---

# Tipografía

Mantener la misma sensación del sitio web.

Jerarquía limpia.

Mucho espacio en blanco.

Títulos grandes.

Subtítulos ligeros.

Nunca transmitir sensación de ERP.

---

# Fotografía

Las imágenes deben parecer las mismas utilizadas por EatClean.

Referencia:

- Instagram
- Web

Características:

- comida real
- iluminación natural
- platos completos
- fotografía cálida
- estilo editorial

No utilizar:

- mockups
- renders
- fotografías de stock con aspecto artificial

---

# Login

Debe transmitir:

"Bienvenido a EatClean."

Contenido:

Logo oficial

¡Bienvenido!

Inicia sesión y programa tu menú semanal.

Powered by YourMeal OS

El "Powered by" debe aparecer como una firma.

Muy pequeño.

Color gris cálido.

Nunca competir con la marca EatClean.

---

# Acceso interno

En la parte inferior del Login incluir un acceso discreto.

Texto:

Centro de Operaciones

Nunca utilizar:

Admin

Administrador

Dashboard

BackOffice

Este acceso lleva al entorno interno del equipo.

---

# Centro de Operaciones

El Centro de Operaciones mantiene exactamente la identidad EatClean.

No cambia de marca.

Solo cambia el propósito.

Debe transmitir:

"Hoy, ¿qué necesita hacer el equipo?"

No abrir mostrando KPIs.

No abrir mostrando gráficas.

No abrir mostrando estadísticas.

Mostrar:

Agenda del día

Acciones prioritarias

Workspaces autorizados

---

# Workspaces

Mostrar únicamente los autorizados mediante RBAC.

Ejemplos:

🍳 Cocina

🚚 Reparto

📦 Stock

👥 Clientes

💼 Administración

💶 Finanzas

Si el usuario tiene un único Workspace:

Entrar directamente.

Si tiene varios:

Mostrar Centro de Operaciones.

Administrador:

Puede acceder a todos.

---

# Navegación

Shell:

Operaciones

Pedidos

Clientes

Inventario

Más

Mantener consistencia visual con la Customer App.

---

# Filosofía de diseño

Customer App

→ calma
→ apetito
→ simplicidad

Centro de Operaciones

→ claridad
→ prioridad
→ acción

Ambos pertenecen a EatClean.

Nunca deben parecer dos productos diferentes.

---

# Restricciones

No modificar:

- lógica
- servicios
- repositorios
- Supabase
- RBAC
- modelos de datos

Modificar únicamente la experiencia visual y la continuidad de marca.

---

# Objetivo final

Un usuario que venga del Instagram de EatClean debe sentir inmediatamente que está usando la aplicación oficial de EatClean.

Y un empleado debe sentir que el Centro de Operaciones pertenece a la misma marca, aunque su experiencia esté orientada al trabajo operativo.
```

---

## Filtro antes de merge (obligatorio)

Ver [Brand Recognition Filter](../05-architecture/TENANT_EXPERIENCE_SPEC.md#principio-rector--brand-recognition-filter-no-negociable).

## Ya materializado en código (no rehacer desde cero)

Login logo · Powered by firma · entrada **Centro de Operaciones** · shell Operaciones · agenda/workspaces — PRs #28 · #29. Lovable debe **continuar** esa línea, no reinventarla.
