# MOBILE-RELEASE-01 · Internal Testing Acceptance Checklist

**Documento:** `MR01_INTERNAL_TESTING_ACCEPTANCE_CHECKLIST.md`  
**Entrega:** MR01-005 · Internal Testing Acceptance  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) · MR5  
**Estado:** ✅ Acceptance completa · **Ready for Internal Testing**

> Responde **una** pregunta:  
> ¿Puede una persona del equipo instalar y probar YourMeal OS de forma **privada** en Android e iOS **sin modificar el Core**?
>
> No publica. No Production. No Play Console. No App Store Connect.

---

## Aceptación operativa

| # | Criterio | Estado |
|---|----------|--------|
| 1 | **Android** puede entregarse para pruebas privadas (Debug APK · Release firmado · AAB evidenciado) | ☑ |
| 2 | **iOS** puede archivarse correctamente para pruebas privadas (Archive contract · recipe · fingerprint) | ☑ |
| 3 | **Core SaaS** permanece intacto (Capacitor PASS · Core Integrity · sin Business/Flows reabiertos) | ☑ |
| 4 | Todos los **artefactos poseen evidencia** (mr2 · mr3 · mr4 · mr5 JSON) | ☑ |
| 5 | Pipeline reproducible MR1→MR5 · Runner FULL PASS | ☑ |
| 6 | Outcome Spec: **Ready for Internal Testing** | ☑ |

---

## Evidencia referenciada

| Bloque | Evidence |
|--------|----------|
| MR2 Android Build | `evidence/mr2-android-artifacts.json` |
| MR3 Android Signing | `evidence/mr3-android-signing.json` |
| MR4 iOS Archive | `evidence/mr4-ios-archive.json` |
| MR5 Acceptance | `evidence/mr5-internal-testing-acceptance.json` |

---

## Explicitamente NO aceptado aquí

```text
☐ Google Play Internal Testing (cuenta / upload)
☐ Google Play Closed Testing
☐ Google Play Production
☐ TestFlight
☐ App Store Review
☐ Publicación
```

Esos canales pertenecen a un dominio de **store distribution** posterior (p. ej. STORE-RELEASE-01).

---

## End of Acceptance Checklist
