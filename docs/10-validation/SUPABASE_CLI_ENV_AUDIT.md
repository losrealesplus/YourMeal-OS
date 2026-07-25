# AUDIT — Supabase CLI Environment (IPv6 / project-ref)

**Date:** 2026-07-25  
**Scope:** Diagnosis only — no fixes applied in this change.  
**Local machine (reported):** macOS · `/Users/alex/Developer/YourMeal-OS`  
**Target remote (intended):** `djangucecsphnejplvic` (empty; no migrations applied)  
**Legacy remote (still in repo/env):** `cbeegcxkayybfncnuirg`  
**Workspace inspected:** `/workspace` (cloud clone of the same repo; no `supabase/.temp` present here)

---

## Executive verdict

Two independent problems are stacked:

1. **Connectivity (primary failure):** CLI tries the **direct** Postgres host `db.<ref>.supabase.co:5432`, which is **IPv6-only**. On an IPv4-only network (common on consumer macOS / ISP / Docker Desktop), dial fails with `IPv6 is not supported` / `dial tcp [<IPv6>]:5432: no route to host`.
2. **Wrong project-ref in the suggestion (secondary confusion):** When pooler fallback cannot be established, CLI 2.109.x emits  
   `Run supabase link --project-ref ${J} to setup IPv4 connection.`  
   where `${J}` is the **resolved** project ref — **not** necessarily the contents of `supabase/.temp/project-ref`.

Resolution order for `${J}` (documented in CLI source / maintainers):

| Priority | Source | This repo’s value |
|----------|--------|-------------------|
| 1 | `--project-ref` flag | (none when running `db push` / `migration list`) |
| 2 | `SUPABASE_PROJECT_ID` env | **`cbeegcxkayybfncnuirg`** (old) via `.env` |
| 3 | `supabase/.temp/project-ref` | **`djangucecsphnejplvic`** (new — reported linked locally) |

So a successful `supabase link` to the new project can be **overridden at runtime** by `SUPABASE_PROJECT_ID` still pointing at the old project. That alone explains the CLI suggesting `cbeegcxkayybfncnuirg` while `.temp` looks correct.

---

## Checklist answers (1–10)

### 1. Versión instalada de Supabase CLI

| Entorno | Evidencia | Versión |
|---------|-----------|---------|
| Cloud workspace (`/workspace`) | `npx supabase --version` | **2.109.1** |
| npm latest (at audit time) | `npm view supabase version` | **2.109.1** (stable); betas `2.110.0-beta.*` exist |
| Mac local del usuario | No ejecutado desde este agente | **Debe confirmarse** con `supabase --version` y `npx supabase --version` |

**Nota:** Homebrew / `npm i -g` / `npx` pueden diferir. Usar la misma vía que falla (`supabase` vs `npx supabase`).

### 2. ¿Bug conocido relacionado con project-ref?

**Sí — comportamiento documentado / issues confirmados, no necesariamente un “bug de caché mágica”.**

- **`SUPABASE_PROJECT_ID` override:** CLI maintainers (issue [#2915](https://github.com/supabase/cli/issues/2915)) confirman que `SUPABASE_PROJECT_ID` en el entorno **sobrescribe** el project ref linkeado en disco. Precedencia explícita en `LoadProjectRef` (commit [eb3a86a](https://github.com/supabase/cli/commit/eb3a86ac98d6a0a3b26b36f2e169579fcfccd4b4)): flag → env `PROJECT_ID` / `SUPABASE_PROJECT_ID` → fichero `.temp/project-ref`.
- **Sugerencia IPv6 con `--project-ref`:** En CLI **2.109.1** (binario inspeccionado), cuando el host directo no es alcanzable por IPv6 **y** no se puede armar conexión pooler, el error es exactamente:

  ```text
  IPv6 is not supported on your current network
  Run supabase link --project-ref ${J} to setup IPv4 connection.
  ```

  `${J}` = project ref **ya resuelto** (por tanto, el viejo si el env gana).

### 3. ¿Cachés globales de Supabase fuera del proyecto?

| Ubicación | Contenido típico | ¿Contiene project-ref del repo? |
|-----------|------------------|----------------------------------|
| `~/.supabase/` | `access-token`, `telemetry.json`, `traces/` | **No** (auth + telemetría) |
| `~/.npm/_npx/.../supabase` | Binario CLI cacheado por npx | No |
| Keychain / credential store | Password DB del link | Por proyecto; no redefine el ref |

**Evidencia cloud:** `~/.supabase/` solo tenía `telemetry.json` + `traces/`. No hay “caché global de project-ref” que explique el ref antiguo; el ref antiguo está **en el repo/env**.

### 4. ¿Configuración persistente en `~/.supabase`?

Sí, pero **limitada**:

- Token de acceso (login) — afecta API Management, no el valor de `project_id` en `config.toml`.
- Telemetría.
- **No** sustituye `supabase/.temp/*` del proyecto.

Comandos oficiales relacionados: `supabase login` / `supabase logout` (borra tokens locales).

### 5. ¿Puede `config.toml` provocar este comportamiento?

**Parcialmente — es un factor de confusión y de identidad “legacy”, no la causa única del dial IPv6.**

Evidencia en repo:

```1:1:supabase/config.toml
project_id = "cbeegcxkayybfncnuirg"
```

- Introducido en el commit Lovable `0f930e6` (“Work in progress”, 2026-07-20) como **único** contenido del fichero (config mínima, no un `supabase init` completo).
- El `project_id` de `config.toml` sigue siendo el **proyecto antiguo**.
- CLI reciente también puede usar `config.toml` / LegacyCliConfig en algunos caminos de resolución; en cualquier caso, **desalineado** respecto al link declarado a `djangucecsphnejplvic`.
- `link` puede avisar `WARNING: Local config differs from linked project` y sugerir actualizar `config.toml` — ruido adicional al cambiar de proyecto.

### 6. ¿La CLI usa conexión directa cuando debería usar pooler?

**Sí — por diseño intenta directo primero; el pooler es fallback / resultado de `link`.**

Flujo en 2.109.1 (código de resolución linked):

1. Construir host directo `db.<ref>.supabase.co:5432`.
2. Probar si IPv6/directo es usable.
3. Si no → intentar pooler (URL de `supabase/.temp/pooler-url` o Management API).
4. Si el pooler **tampoco** se resuelve/usa → error `IPv6 is not supported…` + sugerencia `link --project-ref ${J}`.

Implicaciones:

- Tener `pooler-url` correcto **no garantiza** que `db push` / `migration list` lo usen si el **ref resuelto** (`SUPABASE_PROJECT_ID`) no coincide con ese pooler, o si el fallback falla (password, tenant, `--skip-pooler` previo, etc.).
- `supabase link --skip-pooler` fuerza directo (IPv6) — empeora este escenario.
- Bypass explícito: `supabase db push --db-url "<session/transaction pooler URL>"` (IPv4).

Documentación plataforma: [IPv4/IPv6 compatibility](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP) — directo = IPv6; pooler = IPv4.

### 7. ¿Variables de entorno relacionadas con Supabase?

**Sí — y son la explicación más fuerte del `--project-ref` antiguo.**

Evidencia en `/workspace/.env` (y en el entorno del proceso del agente):

| Variable | Valor (ref) |
|----------|-------------|
| `SUPABASE_PROJECT_ID` | `cbeegcxkayybfncnuirg` |
| `SUPABASE_URL` | `https://cbeegcxkayybfncnuirg.supabase.co` |
| `VITE_SUPABASE_PROJECT_ID` | `cbeegcxkayybfncnuirg` |
| `VITE_SUPABASE_URL` | `https://cbeegcxkayybfncnuirg.supabase.co` |

También relevantes si existen en el Mac (comprobar con `env | grep -i supabase`):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD` / `DB_PASSWORD`
- `SUPABASE_INTERNAL_*` (raro)

**Crítico:** mientras `SUPABASE_PROJECT_ID=cbeegcxkayybfncnuirg` esté exportado (shell, IDE, direnv, o cargado desde `.env`), la CLI **ignorará** el `.temp/project-ref` nuevo.

### 8. ¿Proyecto generado con otra versión de CLI?

**Sí, indicios fuertes de origen Lovable / no CLI `init` clásico:**

- `config.toml` de **1 línea** (`project_id` = ref remoto antiguo) — típico de generación Lovable (`gpt-engineer-app[bot]`), no de `supabase init` completo (que escribe api/db/auth/storage, etc.).
- Migraciones con timestamps mixtos: UUIDs estilo dashboard (`20260720…_9137d8ab-…`) + migraciones nombradas del repo (`20260725120000_op002_…`).
- **22** ficheros en `supabase/migrations/` (contado en este workspace).
- Cliente app: `@supabase/supabase-js` ^2.110.7 — independiente de la versión CLI.

No hay pin de versión CLI en `package.json` (`supabase` no es dependency).

### 9. ¿Comando oficial para limpiar estado local?

No hay un único “factory reset” global. Combinación oficial:

| Acción | Comando / paso |
|--------|----------------|
| Desenlazar proyecto | `supabase unlink` → borra `supabase/.temp/` (+ password en keychain) |
| Re-enlazar | `supabase link --project-ref djangucecsphnejplvic` (sin `--skip-pooler`) |
| Auth CLI | `supabase logout` / `supabase login` |
| Limpieza manual | `rm -rf supabase/.temp` (equivalente parcial a unlink sin keychain) |
| npx cache (opcional) | borrar cache npm/`_npx` si se sospecha binario viejo |

**No** hay comando oficial que reescriba solo `config.toml.project_id` ni `.env`.

### 10. ¿Bug conocido de Supabase CLI?

**Sí, en la familia IPv6 / direct-vs-pooler — ampliamente reportado.**

| Referencia | Qué describe |
|------------|--------------|
| [#3318](https://github.com/supabase/cli/issues/3318) | `dial tcp [IPv6]:5432: no route to host` en `db push` / `migration list` |
| Changelog / discusión IPv4 deprecation | Direct host IPv6-only salvo add-on IPv4 |
| PR [#5492](https://github.com/supabase/cli/pull/5492) | Detectar error IPv6 y sugerir pooler / `link` |
| PR [#5493](https://github.com/supabase/cli/pull/5493) | Auto-retry `db dump`/`db pull` vía pooler IPv4 |
| Issue [#2915](https://github.com/supabase/cli/issues/2915) | `SUPABASE_PROJECT_ID` en `.env` pisa el link |

**Conclusión:** el fallo de red es un **comportamiento conocido de plataforma + CLI**, no un fallo del schema del repo. El `--project-ref` antiguo es **inconsistencia de estado local/env** (muy probablemente), no un project-ref “fantasma” en `~/.supabase`.

---

## Evidencia adicional del repositorio

| Ítem | Estado |
|------|--------|
| Migraciones locales | 22 en `supabase/migrations/` |
| `supabase/.temp` en cloud clone | **Ausente** (solo existe en la máquina del usuario tras `link`) |
| `.gitignore` ignora `supabase/.temp` | **No** — riesgo de commitear `.temp` por accidente |
| App runtime binding | `.env` / Vite → proyecto **antiguo** `cbeegcxkayybfncnuirg` |
| Nuevo proyecto remoto | Reportado vacío (sin migraciones) — coherente con fallos de `push`/`list` |

---

## Modelo causal (cómo se encadenan los síntomas)

```text
.env / shell: SUPABASE_PROJECT_ID=cbeegcxkayybfncnuirg  (viejo)
config.toml:  project_id=cbeegcxkayybfncnuirg           (viejo)
.temp (Mac):  project-ref=djangucecsphnejplvic          (nuevo)
.temp (Mac):  pooler-url → proyecto nuevo               (nuevo)

         │
         ▼
  LoadProjectRef → GANA EL ENV (viejo)
         │
         ▼
  Intenta db.cbeegcx….supabase.co:5432  (IPv6)
         │
         ▼
  Red macOS sin ruta IPv6 → dial fail
         │
         ▼
  Fallback pooler falla o no aplica al ref resuelto
         │
         ▼
  "IPv6 is not supported…"
  "Run supabase link --project-ref cbeegcxkayybfncnuirg …"
```

Aunque `.temp` esté bien linkeado al nuevo proyecto, **el env gana** → sugerencia al proyecto antiguo + dial IPv6.

---

## Propuesta de solución (paso a paso — no ejecutada)

### A. Diagnóstico en el Mac (5 minutos, solo lectura)

```bash
cd /Users/alex/Developer/YourMeal-OS

supabase --version
npx supabase --version

echo "SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID-<unset>}"
env | grep -iE 'supabase|postgres' || true

cat supabase/.temp/project-ref
cat supabase/.temp/pooler-url   # no pegar password en chats; solo host/user/ref
head -1 supabase/config.toml
grep -E 'SUPABASE_PROJECT_ID|VITE_SUPABASE' .env

# Probar IPv6 de la red
curl -6 -m 5 -s https://ifconfig.co/ip || echo "IPv6 FAIL (esperado en redes solo IPv4)"

# Ver de dónde carga el ref (crítico)
unset SUPABASE_PROJECT_ID   # en esa shell
supabase migration list --debug
# Buscar líneas: "Loading project ref from env/flag/file" y el host al que conecta
```

**Éxito de esta fase:** confirmar si `Loading project ref from env` apunta a `cbeeg…` y si el dial es a un literal IPv6 `:5432`.

### B. Alinear identidad de proyecto (sin aplicar migraciones todavía)

1. **No** exportar el ref antiguo al usar la CLI:
   - Quitar o actualizar `SUPABASE_PROJECT_ID` en `.env` → `djangucecsphnejplvic` (cuando se decida cutover).
   - En la shell de trabajo: `unset SUPABASE_PROJECT_ID` (y recargar terminal / desactivar direnv si aplica).
2. Actualizar `supabase/config.toml` → `project_id = "djangucecsphnejplvic"` (cuando se apruebe el cutover).
3. Limpiar y re-linkear:

```bash
supabase unlink
# o: rm -rf supabase/.temp

supabase link --project-ref djangucecsphnejplvic
# Introducir DB password del proyecto NUEVO
# NO usar --skip-pooler
```

4. Verificar:

```bash
cat supabase/.temp/project-ref   # debe ser djangucecsphnejplvic
grep -i pooler supabase/.temp/pooler-url
```

### C. Desbloquear push/list en red IPv4-only

**Opción preferida (explícita, session pooler IPv4):**

Desde Dashboard → Connect → **Session pooler** (puerto **5432**, no transaction 6543 para migraciones DDL cuando sea posible):

```bash
export SUPABASE_DB_PASSWORD='…'   # password del proyecto NUEVO

supabase db push --db-url "postgresql://postgres.djangucecsphnejplvic:${SUPABASE_DB_PASSWORD}@aws-0-<REGION>.pooler.supabase.com:5432/postgres"

# o list:
supabase migration list --db-url "postgresql://postgres.djangucecsphnejplvic:…@aws-0-<REGION>.pooler.supabase.com:5432/postgres"
```

**Opción B:** Tras link correcto **sin** `SUPABASE_PROJECT_ID` viejo, reintentar `supabase db push` / `migration list` y confirmar en `--debug` que usa el host `*.pooler.supabase.com` (IPv4), no `db.*.supabase.co` IPv6.

**Opción C (pago):** IPv4 add-on en el proyecto nuevo — permite directo; suele ser innecesario si el pooler funciona.

**Opción D:** Actualizar CLI a latest (`brew upgrade supabase` / `npx supabase@latest`) para mejoras de fallback IPv6 (PRs 5492/5493); **no sustituye** alinear `SUPABASE_PROJECT_ID`.

### D. Cutover de la app (separado del CLI)

Hasta actualizar `.env` / `VITE_SUPABASE_*`, la app seguirá apuntando a `cbeegcxkayybfncnuirg`. Eso es independiente de poder hacer `db push` al proyecto nuevo, pero debe planificarse (keys, Auth redirect URLs, seed OP-002, etc.).

### E. Higiene recomendada (después)

1. Añadir `supabase/.temp` a `.gitignore` si no se quiere versionar estado de link.
2. No commitear `pooler-url` / passwords.
3. Documentar el project-ref “activo” en un solo sitio (config + env alineados).

---

## Criterios de aceptación del fix (cuando se ejecute)

- [ ] `echo $SUPABASE_PROJECT_ID` vacío o = `djangucecsphnejplvic` en la shell que usa la CLI.
- [ ] `supabase/.temp/project-ref` = `djangucecsphnejplvic`.
- [ ] `supabase/config.toml` `project_id` alineado (tras decisión de cutover).
- [ ] `supabase migration list --debug` conecta a host **pooler IPv4** (o `--db-url` pooler) sin error IPv6.
- [ ] `supabase db push` aplica las 22 migraciones al proyecto **nuevo** vacío.
- [ ] La sugerencia de la CLI ya **no** menciona `cbeegcxkayybfncnuirg`.

---

## Fuera de alcance de este documento

- No se modificó `.env`, `config.toml`, ni se ejecutó `db push`.
- No se migró el runtime de la app al proyecto nuevo.
- No se validó conectividad IPv6 real del Mac del usuario (solo reproducibilidad del mensaje CLI + evidencia de repo/env).

---

## Referencias

- Supabase troubleshooting IPv4/IPv6: https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP  
- CLI issue IPv6 dial: https://github.com/supabase/cli/issues/3318  
- CLI `SUPABASE_PROJECT_ID` override: https://github.com/supabase/cli/issues/2915  
- CLI LoadProjectRef debug: https://github.com/supabase/cli/commit/eb3a86ac98d6a0a3b26b36f2e169579fcfccd4b4  
- CLI IPv6 suggestion / pooler fallback PRs: #5492, #5493  
