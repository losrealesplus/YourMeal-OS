# ARQUITECTURA DE FRONTERA DE RUNTIME DE INSTANCIAS (INSTANCE RUNTIME BOUNDARY)
## MODELO DE AISLAMIENTO FÍSICO, SEPARACIÓN DE DEMO OFICIAL Y GUARDAS ANTI-FUGAS

---

## 1. Contexto y Decisión Arquitectónica Canónica

YourMeal OS opera bajo una arquitectura de **Core Único y Versionado** (`CORE_VERSION = "0.1.0"`) que alimenta dos tipos fundamentales de instancias operativas:

```text
                                  YOURMEAL OS CORE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
     YOURMEAL OS OFICIAL DEMO                          INSTANCIAS DE CLIENTES
    (Entorno de Producto / Showcase)                  (Entornos Operativos Reales)
                 │                                               │
      • Slug: "yourmeal-os"                           • Slug: "eatclean", etc.
      • Repo: losrealesplus/YourMeal-OS               • Repo: losrealesplus/YourMeal-<Tenant>
      • Supabase: djangucecsphnejplvic                • Supabase: Proyecto Dedicado (<tenant>)
      • Worker: losrealesplus-yourmeal-os             • Worker: yourmeal-instance-<tenant>
      • Host: www / clientes.yourmealos.com           • Host: <tenant>.yourmealos.com
      • Datos: Sintéticos / Fluctuantes               • Datos: 100% Reales / Aislados
```

---

## 2. Invariantes de Aislamiento y Frontera en Runtime

1. **Desacoplamiento de Código y Datos:**
   * El código del Core es compartido y distribuido como base inmutable.
   * La Demo Oficial es una instancia de primer orden de la plataforma, destinada a showcase y desarrollo, no un cliente.
   * Las instancias de clientes reales están físicamente aisladas en sus propios repositorios de GitHub, bases de datos Supabase en regiones dedicadas y Workers de Cloudflare.

2. **Regla de Cero Fallback Silencioso (`No Silent Fallback`):**
   * El cliente de base de datos en el navegador (SPA) y en el servidor (SSR) **nunca debe caer por defecto en las variables de entorno globales del Core (`.env`)**.
   * La configuración de base de datos se resuelve dinámicamente mediante `resolveInstanceRuntimeConfig(hostname)` y se valida con `validateInstanceRuntimeConfig(config)`.

3. **Guardas Anti-Fugas (`Anti-Leak Guards`):**
   * Si una instancia de cliente (`eatclean`) intenta conectarse a la base de datos de demo (`djangucecsphnejplvic`), el runtime emite una excepción fatal `SECURITY_VIOLATION` y bloquea la ejecución.
   * Si la Demo Oficial (`yourmeal-os`) intenta conectarse a la base de datos de un cliente (`nhirlpkuvonggctdzzad`), el runtime emite una excepción fatal `SECURITY_VIOLATION`.

---

## 3. Modelo del Directorio Público de Clientes (`clientes.yourmealos.com`)

El directorio público clasifica y ordena las marcas expuestas según su naturaleza:

* **1. Demo Oficial (`platform_demo`):**
  * Etiqueta: `⭐ Demo oficial`
  * Propósito: Showcase interactivo de las capacidades completas de YourMeal OS.
  * Cláusula Informativa: Datos demostrativos; las capacidades se adaptan a la configuración de cada cliente.
* **2. Clientes Reales (`customer`):**
  * Etiqueta: `Cliente de YourMeal OS` (ej. EatClean Tenerife).
  * Propósito: Pasarela de acceso directo a la aplicación operativa de la marca.

---

## 4. Gobernanza de Datos

* **Demo (`yourmeal-os`):** Contiene registros sintéticos mínimos permanentes y datos de prueba fluctuantes para demostración comercial. No expone identidades ni operativas reales de clientes.
* **Clientes Reales (`eatclean`):** Base de datos 100% vacía en Day-0, persistiendo datos reales únicamente tras la validación y aprobación humana en el pipeline de onboarding.
