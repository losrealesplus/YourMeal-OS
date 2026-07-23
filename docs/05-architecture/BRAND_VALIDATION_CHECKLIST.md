# Brand Validation Checklist

**Knowledge Lifetime:** Contract *(checklist reutilizable)*  
**Cuándo:** tras cualquier cambio publicado con `brand.manage` · en FOV de identidad · onboarding de nuevo Tenant  
**No es:** un tipo de evidencia FOPEBA nuevo  
**Sí es:** checklist asociado a la validación del Tenant / Tenant Brand

> Pregunta: **¿La identidad de marca se mantiene coherente después de ser gestionada por el propio Tenant?**

---

## Checklist

```text
Brand Validation

□ Logo correcto (formato · peso · visible en Login)
□ Contraste suficiente (texto sobre primary / fondos — WCAG AA objetivo)
□ Colores aplicados (primary · primaryForeground · accent)
□ Login actualizado (logo + tokens)
□ Customer App actualizada (shell · CTAs · chrome)
□ Centro de Operaciones actualizado (misma marca · otro propósito)
□ Sin referencias visuales al tenant / marca anterior
□ Powered by sigue siendo firma discreta (no marca principal)
□ Previsualización revisada antes de publicar
□ Solo roles brand.manage pudieron guardar
```

---

## Cómo usar en FOV / piloto

1. El Tenant (o el equipo) cambia logo/colores vía `/admin/branding`.  
2. Ejecutar este checklist en Login · Home · Menú · Operaciones.  
3. Registrar hallazgos como observación / VR si la marca rompe usabilidad o continuidad.  
4. No “arreglar” el Brand Contract por intuición: evidencia → decisión documentada.

Relacionado: [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md) · [BRAND_CONTRACT](./BRAND_CONTRACT.md) · [Tenant Brand](../17-operational-model/02-core-objects/tenant-brand.md).
