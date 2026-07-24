# Bootstrap · First SaaS Admin

**OP-001:** Platform Ops requires an existing `saas_admin` (`tenant_id IS NULL`).  
There is intentionally **no** public UI to create the first platform admin.

## One-time seed (SQL)

Run in Supabase SQL editor after creating the Auth user (email confirmed):

```sql
-- Replace :user_id with auth.users.id of the platform operator
insert into public.user_roles (user_id, tenant_id, role)
values (':user_id'::uuid, null, 'saas_admin')
on conflict do nothing;
```

Then login → must land on `/saas`.

## After that (no SQL)

Use `/saas`:

1. Create / activate tenant  
2. Invite Company Admin  
3. Assign roles (`kitchen`, `delivery`, …)  

Company Admin continues bootstrap in `/admin` (dishes · menu · staff · orders).

## RI-001 note

This one SQL step is accepted as **platform Day-0** only.  
Tenant Day-0 after that must be SQL-free (DICT-073).
