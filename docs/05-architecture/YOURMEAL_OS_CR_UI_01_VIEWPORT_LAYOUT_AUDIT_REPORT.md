# CR-UI-01: AUDITORÍA TÉCNICA DE LAYOUT, VIEWPORT Y RESPONSIVE
**Fase 1: Diagnóstico Estructural Read-Only**

**Fecha**: 2026-10-03  
**Auditor**: Antigravity (AI Assistant)  
**Operador Fiduciario**: Alexander Hernandez  
**Estado**: 🟢 **DISCOVERY COMPLETE / READY FOR HUMAN REVIEW**  
**Gobernanza**: `STOP HARD ACTIVO` (0 mutaciones en producción, 0 deploys, 0 modificaciones en main)

---

## A. Resumen Ejecutivo y Causa Raíz (Root Cause)

El problema visual observado en las capturas **no es un fallo de zoom del navegador ni un defecto cosmético aislado**. Es el resultado de **tres defectos estructurales de layout CSS/Flexbox/Grid concurrentes**:

1. **Desbordamiento horizontal en `<main>` por falta de contención (`min-w-0`)**:
   En `src/components/admin-shell.tsx`, el contenedor principal `<main className="flex-1 overflow-y-auto p-4 lg:p-6">` es un hijo flex (`flex-1`). En CSS Flexbox, el valor por defecto de `min-width` es `auto` (no `0`). Cuando un elemento hijo (como una tabla de 9 columnas) tiene un ancho intrínseco superior al viewport disponible, `<main>` se ensancha horizontalmente. Además, al tener `overflow-y: auto`, la especificación CSS calcula automáticamente `overflow-x: auto` sobre `<main>`, generando un contenedor de scroll horizontal no deseado a nivel de página que compite con el scroll de la tabla y desplaza el contenido fuera del borde izquierdo de la pantalla.

2. **Desajuste de márgenes negativos (`-mx-5`) en `DataTable`**:
   En `src/components/admin/data-table.tsx`, el contenedor de la tabla usa `overflow-x-auto -mx-5` (-20px). Sin embargo, en `src/routes/_authenticated/admin.customers.tsx`, la tarjeta contenedora es `<PanelCard className="p-4 space-y-4">` (padding de 16px). Este desfase (-20px vs +16px) provoca que la tabla comience **4px por fuera del borde izquierdo de la tarjeta**. Al interactuar o hacer scroll en navegadores WebKit/Safari, el margen negativo en un contenedor con overflow genera un desplazamiento inicial que corta visualmente el inicio del texto del cliente en el borde izquierdo.

3. **Contención rígida y desbordamiento interno en `UniversalOrderIntakeDrawer`**:
   - **`ScrollArea` mal estructurado**: En `src/components/orders/universal-order-intake-drawer.tsx`, las clases `p-6 space-y-6` están aplicadas sobre el componente raíz de Radix (`ScrollAreaPrimitive.Root`) en lugar de sobre el contenedor interno del viewport. Esto provoca que `space-y-6` falle en espaciar los bloques internos y que el viewport no disponga de barra de scroll horizontal para elementos anchos.
   - **Blowout en selects de Contexto B2B**: En el grid `grid-cols-1 sm:grid-cols-2`, los `<select>` de sedes corporativas renderizan nombres con direcciones completas (ej. `Sede Central (Calle Alcalá 45, Planta 2)`). Al no tener `min-w-0` ni `max-w-full`, la especificación CSS Grid expande la columna para acomodar el texto más largo del `<option>`, forzando un ancho superior al ancho útil del drawer (624px) y cortando los controles adyacentes.
   - **Compresión en el Action Footer**: `SheetFooter` hereda clases base de Shadcn (`sm:space-x-2 sm:justify-end`) que entran en conflicto con `gap-3 justify-between`. La suma de anchura mínima de los botones ("Guardar Borrador" ~150px + "Guardar y Confirmar 🟢" ~195px = 345px) más el bloque de "Total" (~140px) requiere ~485px netos. En anchos de drawer compactos o laptops, ambos bloques quedan estrangulados horizontalmente.

---

## B. Componentes Afectados

1. **`src/components/admin-shell.tsx`**: Contenedor principal de la aplicación (`<main>`).
2. **`src/components/admin/data-table.tsx`**: Componente canónico de tablas administrativas.
3. **`src/routes/_authenticated/admin.customers.tsx`**: Hub Canónico de Clientes y Empresas (página, filtros, columnas y tarjeta).
4. **`src/components/orders/universal-order-intake-drawer.tsx`**: Drawer universal de captura de pedidos.
5. **Otros componentes con el mismo patrón `DataTable`**:
   - `src/routes/_authenticated/admin.accounting.tsx`
   - `src/routes/_authenticated/admin.audit.tsx`
   - `src/routes/_authenticated/admin.companies.tsx`
   - `src/routes/_authenticated/admin.dishes.tsx`
   - `src/routes/_authenticated/admin.purchasing.tsx`
   - `src/routes/_authenticated/admin.support.tsx`
   - `src/routes/_authenticated/admin.users.tsx`

---

## C. Diagnóstico CSS / Layout Detallado

### 1. Pantalla Clientes (`/admin/customers`)
```text
[Viewport: 1180px - 1280px (Laptop estándar)]
 │
 ├── Sidebar (aside): w-60 (240px fija)
 │
 └── Main Column (flex-1): 1280px - 240px = 1040px
      │
      └── <main className="flex-1 overflow-y-auto p-4 lg:p-6">
           (Falta min-w-0: el contenedor no puede encogerse)
           (overflow-y: auto calcula overflow-x: auto en el navegador)
           │
           └── <PanelCard className="p-4 space-y-4"> (Padding: 16px)
                │
                └── <div className="overflow-x-auto -mx-5"> (Margen negativo: -20px)
                     │ ⚠️ DESFASE: -20px de margen en contenedor de 16px = -4px hacia la izquierda.
                     │
                     └── <table className="w-full text-sm"> (table-layout: auto)
                          9 columnas sumando ~1.060px de ancho intrínseco mínimo:
                          [Nombre (200px) | Estado (90px) | Email (180px) | Tel (120px) | Ciudad (100px) | Último (110px) | Pedidos (70px) | Ticket (100px) | Acciones (90px)]
                          ⚠️ 1.060px > 992px disponibles en card.
                          En lugar de aislar el scroll en la tabla, el <main> se desliza horizontalmente.
```

### 2. Captura Universal de Pedido (`UniversalOrderIntakeDrawer`)
```text
[SheetContent: w-full sm:max-w-2xl (672px)]
 │
 ├── SheetHeader (p-6 border-b)
 │
 ├── <ScrollArea className="flex-1 p-6 space-y-6">
 │    ⚠️ p-6 aplicado al Root de Radix; el viewport interno tiene 672 - 48 = 624px.
 │    ⚠️ space-y-6 se aplica a los hermanos del Viewport (Scrollbars), no a las secciones del formulario.
 │    │
 │    ├── 1. Contexto Pedido: <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 │    │    ⚠️ Los <select> con opciones largas (dirección de sedes) expanden la columna por defecto min-width: auto.
 │    │
 │    ├── 2. Días: <TabsList className="grid grid-cols-7 ...">
 │    │    ⚠️ 7 columnas en 624px = 89px/columna en desktop; en tablet/móvil cae a <50px/columna.
 │    │
 │    └── 3. Footer: <SheetFooter className="p-4 ... flex-col sm:flex-row justify-between gap-3">
 │         ⚠️ Conflicto entre sm:space-x-2 heredado y gap-3.
 │         ⚠️ Ancho mínimo de botones (345px) + Total (140px) = 485px.
 │         En viewports compactos, los botones no tienen espacio y se comprimen o desbordan.
```

---

## D. Qué NO Debemos Tocar

1. **NO alterar el zoom CSS global ni `font-size` del root (`html`, `body`)**:
   Afectaría negativamente a toda la tipografía, accesibilidad, tamaños táctiles y contraste de la plataforma.
2. **NO aplicar `transform: scale(...)`**:
   Rompe la nitidez del renderizado de fuentes en pantallas no retina, descoordina eventos de puntero (clicks/taps) y distorsiona el cálculo de modales Radix.
3. **NO forzar `overflow: hidden` indiscriminado**:
   Ocultaría columnas completas de la tabla o botones críticos del drawer sin permitir al usuario acceder a ellos mediante scroll.
4. **NO modificar la lógica de negocio ni DTOs**:
   `StaffOrderCaptureService`, `UniversalOrderCaptureDTO`, `CustomerDirectoryService` y los cálculos de precios/raciones no tienen relación con este problema y deben permanecer intactos.
5. **NO tocar producción, staging, rulesets, secrets ni branches protegidas**:
   El estado se mantiene estrictamente en desarrollo local / propuesta.

---

## E. Solución Técnica Propuesta (Alineada con Modern Web Standards)

### 1. Corrección Estructural del Layout Base (`AdminShell`)
- Añadir `min-w-0` a `<main>` para permitir que los hijos flex respeten el ancho del contenedor.
- Declarar explícitamente `overflow-x-hidden overflow-y-auto` en `<main>` para aislar el scroll vertical de página y garantizar que **ningún elemento hijo desplace la página horizontalmente**.

### 2. Corrección de `DataTable` y `/admin/customers`
- **Alinear márgenes**: Eliminar el `-mx-5` forzado que choca con paddings de contenedor. Permitir que `DataTable` acepte una prop de padding o aplicar un envoltorio con `overflow-x-auto rounded-lg border border-border/60` donde la tabla esté contenida limpiamente sin márgenes negativos que se salgan del marco.
- **Ancho mínimo explícito y scrollbar interno**:
  - Declarar `min-w-full` en la `<table>`.
  - Asignar clases de ancho mínimo controlado a las columnas clave (ej. Nombre `min-w-[180px]`, Correo `min-w-[160px]`, Acciones `min-w-[100px]`).
  - La tabla se vuelve navegable horizontalmente **dentro de su propio contenedor visual**, con scrollbar suave (`scrollbar-thin` o nativo) sin mover el resto de la interfaz.

### 3. Corrección de `UniversalOrderIntakeDrawer`
- **Reestructurar `ScrollArea`**:
  - Trasladar el padding y el espaciado vertical (`p-6 space-y-6`) a un `div` contenedor **dentro** del `ScrollArea`, dejando el `ScrollArea` como contenedor puramente estructural (`className="flex-1 overflow-hidden"`).
- **Adaptabilidad del Ancho del Drawer**:
  - Actualizar `SheetContent` a: `className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col p-0 gap-0"`. Esto aprovecha de forma natural viewports de laptop y desktop manteniendo el 100% en pantallas móviles.
- **Prevenir el Blowout en los Selects**:
  - Aplicar `min-w-0 max-w-full` a los contenedores de los `<select>` y `truncate` a las opciones para que las direcciones largas no fuercen la expansión de las columnas del grid.
- **Optimización de Tabs de Días**:
  - Añadir soporte de scroll horizontal suave en `TabsList` para viewports estrechos (`overflow-x-auto no-scrollbar`), evitando que los 7 días se estrujen en viewports pequeños.
- **Blindaje del Action Footer**:
  - Diseñar el footer con `flex-wrap gap-3` y asegurar que los botones tengan `shrink-0`.
  - En viewports muy estrechos (<480px), apilar el Total arriba y los botones en fila completa o apilados, garantizando accesibilidad y áreas táctiles de 44px mínimo.

---

## F. Matriz de Riesgo de Regresión

| Cambio | Riesgo | Mitigación |
|---|---|---|
| `min-w-0 overflow-x-hidden` en `AdminShell` | **Muy Bajo** | Previene scroll horizontal parásito en todas las páginas de operaciones sin afectar al scroll vertical. |
| Aislamiento de padding en `DataTable` | **Bajo** | Revisar las pantallas que usan `DataTable` para asegurar que el borde se alinee con `PanelCard`. |
| Reestructuración de `ScrollArea` en Drawer | **Muy Bajo** | Corrige el fallo de espaciado sin alterar el DOM de los formularios. |
| Flex-wrap en `SheetFooter` | **Nulo** | Mejora la adaptabilidad en móviles sin alterar el comportamiento en pantallas grandes. |

---

## G. Archivos a Modificar en la Siguiente Fase

1. `src/components/admin-shell.tsx` (Contención de `<main>`)
2. `src/components/admin/data-table.tsx` (Envoltorio y contención de tabla)
3. `src/routes/_authenticated/admin.customers.tsx` (Alineación con PanelCard y anchos de columnas)
4. `src/components/orders/universal-order-intake-drawer.tsx` (Estructura de ScrollArea, drawer width, grid min-w-0 y footer)

---

## H. Estrategia de Pruebas Responsive

Las pruebas de verificación se ejecutarán en 4 rangos de viewport exactos:

1. **Desktop Amplio (1440px × 900px y superior)**:
   - Verificar que la tabla de clientes ocupa el ancho natural sin desbordamiento.
   - Verificar que el drawer abre con amplitud cómoda (hasta `max-w-3xl`) y espaciado holgado.
2. **Laptop Estándar (1280px × 800px y 1180px × 768px)**:
   - **Caso de regresión real de la captura**: Confirmar que la tabla tiene scroll horizontal interno si es necesario, sin cortar el nombre a la izquierda.
   - Confirmar que los selects de sede y departamento caben perfectamente sin recortar textos.
   - Confirmar que los botones de acción del footer no se comprimen.
3. **Tablet / iPad (768px × 1024px y 820px × 1180px)**:
   - Verificar colapso responsive de los grids a 1 columna donde sea necesario.
   - Verificar que los 7 días de la semana son legibles o navegables.
4. **Móvil (375px × 667px y 390px × 844px)**:
   - Drawer al 100% de ancho (`w-full`).
   - Botones del footer accesibles y apilables.
   - Cero scroll horizontal accidental en la página principal.

---

## I. Propuesta de Implementación Aislada

Para cumplir con la gobernanza constitucional:
1. Las modificaciones se implementarán en la rama de trabajo local (`feat/cr-gov-01-immutable-human-gate` o una rama específica `fix/cr-ui-01-viewport-layout`).
2. Se validará mediante suite de tests unitarios existentes (`npx vitest run ...`) y comprobación de build (`npm run typecheck`).
3. **Cero push a `main`, cero deploys y cero modificaciones remotas.**
4. Se presentará el diff de código para tu revisión humana antes de cualquier avance.
