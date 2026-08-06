# Environment Contract

**Documento:** `ENVIRONMENT_CONTRACT.md`  
**Track:** HOUSEKEEPING-003  
**Estado:** Active  
**ADR:** [0049 — Environment Contract](../adr/0049-environment-contract.md)  
**Archivos:** `.env.development.example` · `scripts/development/environment-contract.mjs` · `contract-driver.mjs`

> El entorno de desarrollo es un **contrato**, no una checklist mental.

---

## Objetivo

Definir exactamente qué necesita cualquier desarrollador (o tú dentro de un año) para trabajar en YourMeal OS — y que `doctor:env` lo verifique automáticamente.

```bash
npm install
npm run doctor:env
```

---

## Artefactos

| Artefacto | Rol |
|-----------|-----|
| `.env.development.example` | Plantilla humana (copiar a `.env`) |
| `environment-contract.mjs` | Contrato machine-readable |
| `contract-driver.mjs` | Compara máquina + `.env` vs contrato |

---

## Qué comprueba

```text
Environment Contract
✔ JAVA_HOME
✔ ANDROID_HOME
✔ VITE_SUPABASE_URL
✔ VITE_SUPABASE_PUBLISHABLE_KEY
✔ VITE_SUPABASE_PROJECT_ID
✖ VITE_POSTHOG_KEY (optional)  Missing
```

- **Required + missing / placeholder (`REPLACE_ME`)** → ERROR  
- **Optional missing** (p.ej. PostHog) → WARNING / ✖ sin tumbar Ready si lo demás está bien  
- **Shell vars** (`JAVA_HOME`, `ANDROID_HOME`) leídas de `process.env`  
- **Dotenv vars** leídas de `.env` / `.env.local` / example (prioridad: env > `.env` > example)

---

## Flujo recomendado

```bash
cp .env.development.example .env
# rellenar VITE_SUPABASE_PUBLISHABLE_KEY (sin REPLACE_ME)
export JAVA_HOME=…/jdk-21
export ANDROID_HOME=…
npm run doctor:env
```

---

## Añadir una variable al contrato

1. Documentarla en `.env.development.example`.  
2. Añadir entrada en `ENVIRONMENT_CONTRACT.variables`.  
3. Test en `contract-driver.spec.mjs`.  
4. Si cambia política (required vs optional), actualizar ADR.

---

## Relación con HOUSEKEEPING-002

002 = **drivers de toolchain** (Java/SDK/Gradle…).  
003 = **contrato de variables** que esos drivers + la app esperan.

Ambos se ejecutan en `npm run doctor:env`.

---

## Después de este PR

Infraestructura cerrada → foco **[PRODUCT-CORE-001](./PRODUCT_CORE_001.md)** (Bootstrap Pipeline ADR 0050 → Auth → jornada EatClean estable).
