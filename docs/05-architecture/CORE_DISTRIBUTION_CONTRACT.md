# CONTRATO DE DISTRIBUCIÓN Y ACTUALIZACIÓN DE CORE HACIA INSTANCIAS DE TENANTS
## MODELO DE RELEASE VERSIONADO, REPOSITORIOS INDEPENDIENTES Y ACTUALIZACIÓN EXPLÍCITA

---

## 1. Principio Fundamental de Desacoplamiento de Release

YourMeal OS opera bajo una arquitectura donde el **Core de Producto** (`losrealesplus/YourMeal-OS`) y las **Instancias de Clientes** (`losrealesplus/YourMeal-<Tenant>`) residen en repositorios físicos y despliegues independientes en Cloudflare Workers.

```text
               YOURMEAL OS CORE
               losrealesplus/YourMeal-OS
               (Core v0.1.0 @ git SHA)
                      │
                      │  Release / Tag / Certified Commit
                      ▼
        CONTROLLED UPGRADE (PR por Tenant)
                      │
                      ▼
         INSTANCIA DE CLIENTE
         losrealesplus/YourMeal-EatClean
         (coreVersion: "0.1.0", coreCommit: "2b725151")
                      │
                      │  Build & Deploy Dedicado
                      ▼
         CLOUDFLARE WORKER DEDICADO
         yourmeal-instance-eatclean
         (eatclean.yourmealos.com)
```

---

## 2. Invariantes Canónicos de Distribución

1. **Invariante de Despliegue Dedicado:**
   > *"Every tenant Worker MUST be built from its own tenant repository using an explicit certified Core release/version."*
   Cada instancia de tenant tiene su propio Cloudflare Worker (`yourmeal-instance-<tenant>`) con su Custom Domain (`<tenant>.yourmealos.com`).

2. **Invariante de Actualización No Implícita:**
   > *"Updating the Core does NOT implicitly update tenant instances."*
   Fusionar un Pull Request en `YourMeal-OS` actualiza el Core y la Demo Central (`www.yourmealos.com`), pero **NO** muta ni despliega automáticamente las instancias de los tenants clientes.

3. **Invariante de Actualización Explícita y Versionada:**
   Cada actualización de Core en una instancia de cliente se ejecuta a través de un Pull Request en el repositorio de la instancia (`YourMeal-<Tenant>`), fijando el `coreCommit` y `coreVersion` certificados tras pasar los Quality Gates.

4. **Invariante de Reversibilidad (Rollback Contract):**
   Si una versión de Core desplegada en una instancia presenta anomalías:
   * **Rollback de Edge Inmediato:** Mediante Cloudflare Wrangler / Dashboard a la versión previa del Worker dedicado.
   * **Rollback de Repositorio:** Reversión del commit de actualización en el repositorio del tenant (`git revert`).

---

## 3. Matriz de Responsabilidad (Ownership Matrix)

| Componente | Propietario | Repositorio |
| :--- | :--- | :--- |
| **Dominios de negocio, lógica compartida, rutas, componentes, motor de onboarding** | Core Platform | `losrealesplus/YourMeal-OS` |
| **Configuración de instancia, metadatos, branding local, tokens públicos de runtime, migraciones locales** | Tenant Instance | `losrealesplus/YourMeal-<Tenant>` |
| **Cloudflare Worker Central (`www` / `clientes`)** | Core Platform | Desplegado vía `.output/server/wrangler.json` |
| **Cloudflare Worker Dedicado (`<tenant>.yourmealos.com`)** | Tenant Instance | Desplegado vía `wrangler.prod.json` en repo del Tenant |
