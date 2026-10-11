# GATE 7 — RELEASE A AUTOMATION & POST-MERGE RUNBOOK

**Target Branch:** `main`  
**Pipeline:** `.github/workflows/deploy-production.yml`  
**Execution Context:** GitHub Actions Runner (`ubuntu-latest`)  
**Deployment Target:** Cloudflare Workers (`yourmeal-instance-eatclean`)  

---

## 1. Flujo de Ejecución Automatizado

1. **Human PR Merge:**
   - El propietario (`losrealesplus`) aprueba y fusiona el PR de gobernanza en `main`.
2. **Trigger Automático:**
   - El push resultante a `main` activa inmediatamente `deploy-production.yml`.
3. **Classify Stage:**
   - `scripts/governance/release-plan.mjs` valida el intervalo de 6 commits.
   - Decisión: `AUTHORIZED_RECONCILED_RELEASE`.
   - `Classify exact source against authoritative publication baseline` finaliza con código 0 (`PASS`).
4. **Phase 1: Build Once & Cryptographic Digest:**
   - Compilación reproducible de Vite/Nitro para Cloudflare Worker.
   - Empaquetado `production-worker-artifact-<runId>-1`.
   - Cálculo del digest SHA-256 del tarball comprimido y de la configuración de Nitro.
   - Sube artefacto inmutable y finaliza con código 0 (`PASS`).
5. **Phase 2: Protected Production Deployment:**
   - Entorno `production-worker` entra en estado `WAITING FOR REVIEW`.
   - Ningún secreto ni credencial de despliegue se expone antes de la aprobación humana.
6. **Aprobación Soberana:**
   - El revisor humano revisa el Run ID, SHA, Artifact ID y digests.
   - Aprueba el deployment en GitHub UI.
7. **Despliegue y Publicación:**
   - Wrangler publica la versión sellada en Cloudflare Workers al 100% del tráfico.
   - Se registra el deployment status en GitHub.
