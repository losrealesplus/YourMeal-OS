# DV-001 · First PASS record (template)

Copy values here when Deployment Verification passes for the first time on the Lovable publish branch.  
Also paste the same table into ORR + RI-001 Certification Report.

| Campo | Valor |
|-------|-------|
| Branch certificada | `main` |
| Commit SHA | |
| Deployment ID | |
| Fecha | |
| DV-001 | PASS |
| Post-deploy smoke (6/6) | |
| Environment URL | https://eatcleanapp.lovable.app |
| Operator | |

## Marker probe notes

```text
Dish Library placeholder absent: Yes / No
Dish CRUD present: Yes / No
Weekly menus present: Yes / No
Staff invite present: Yes / No
/admin entry OK: Yes / No
/saas for saas_admin OK: Yes / No
```

## Linkage rule

Every EV-* artifact produced after this timestamp for RI-001 must reference:

```text
SHA=<Commit SHA> · Deployment-ID=<Deployment ID>
```
