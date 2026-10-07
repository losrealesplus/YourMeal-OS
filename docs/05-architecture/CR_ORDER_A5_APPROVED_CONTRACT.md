# CR-ORDER A5 — Contrato aprobado y congelado

Autoridad: Alexander Hernandez. Autorización recibida el 7 de octubre de 2026.
Baseline: `8283d56092affa0e7aaa6bf26551a7098c82f561`.

El bloque siguiente preserva la autorización humana recibida. No concede autoridad productiva.

```text
CR-ORDER A5 — CANONICAL V2 ORDER LIFECYCLE
HUMAN SCOPE FREEZE + IMPLEMENTATION AUTHORIZATION

Human Product Authority:
Alexander Hernandez

Production baseline at scope decision:

8283d56092affa0e7aaa6bf26551a7098c82f561

A4b:
DEPLOYED / CAPABILITY CLOSED / ACTIVATION BLOCKED

==================================================
HUMAN DECISION
==================================================

The CR-ORDER A5 Scope Lock is APPROVED subject to the exact
decisions below.

These decisions supersede the AMBIGUOUS_REQUIRES_HUMAN_DECISION
entries identified by the Scope Lock proposal where explicitly resolved
here.

A5 is a GENERAL CR-ORDER v2 lifecycle correction.

It is not an A4b workaround.

==================================================
1. CANONICAL STATE MODEL
==================================================

Persisted order states remain exactly:

draft
confirmed
in_production
prepared
ready_for_delivery
out_for_delivery
delivery_issue
delivered
cancelled

Do NOT add:

packed
processing
completed
archived
partially_delivered

as persisted order states in A5.

Reporting aliases remain a separate compatibility concern unless
required for correctness.

==================================================
2. ORDINARY FORWARD TRANSITIONS
==================================================

Freeze the normal forward spine:

draft
→ confirmed
→ in_production
→ prepared
→ ready_for_delivery
→ out_for_delivery
→ delivered

Delivery failure:

out_for_delivery
→ delivery_issue

Retry:

delivery_issue
→ out_for_delivery

No arbitrary state skipping.

No browser-selected target state outside the canonical transition
contract.

==================================================
3. CANCELLATION POLICY
==================================================

Ordinary cancellation MAY originate from:

draft
confirmed
in_production
prepared
ready_for_delivery

subject to canonical authority and operational fences.

Ordinary cancellation MUST NOT originate from:

out_for_delivery
delivery_issue
delivered
cancelled

out_for_delivery and delivery_issue require logistics-domain resolution,
not ordinary order cancellation.

delivered is terminal.

cancelled is terminal.

Cancellation NEVER means deletion or historical rollback.

==================================================
4. OPERATIONAL WORK ALREADY STARTED
==================================================

Cancellation may occur after operational work has started only when
future work can be safely stopped through the canonical transaction.

Existing historical evidence MUST remain.

Preserve:

- preparation evidence
- packing evidence
- assignments
- delivery-service history
- timestamps
- actors
- audit
- order_items
- commercial snapshots
- prices
- totals
- quote provenance

Never rewrite history to pretend work did not happen.

If an active dependent operation cannot safely be stopped:

return:

OPERATIONAL_WORK_STARTED

or the frozen equivalent typed error.

No partial cancellation commit.

==================================================
5. OPERATIONAL AUTHORITY
==================================================

DO NOT grant orders.write globally to:

- kitchen
- production
- packing
- logistics
- delivery roles

Domain operators retain their bounded domain capabilities.

A legitimate authenticated domain operation MAY cause a parent order
transition classified SYSTEM_ONLY when:

- actor identity is verified
- tenant is verified
- actor has the required domain capability
- source operation/event is valid
- transition is specifically permitted by contract
- dependent evidence proves the transition
- canonical lifecycle boundary performs the parent mutation

The operator does NOT gain arbitrary order lifecycle authority.

postgres execution is NOT authority.

service_role execution is NOT authority.

Browser target-state input is NOT authority.

==================================================
6. ORDINARY STAFF AUTHORITY
==================================================

Ordinary human lifecycle commands require:

- authenticated actor
- exact active tenant membership
- compatible staff role
- orders.write
- transition-specific validation

saas_admin receives NO implicit tenant-membership bypass for ordinary
A5 lifecycle operations.

Any future sovereign/break-glass mechanism is OUT OF SCOPE and requires
separate governance approval.

==================================================
7. CANONICAL WRITER
==================================================

Implement one canonical CR-ORDER lifecycle boundary.

Reuse:

- orders/order_items source of truth
- cr_order_writer
- existing request ledger
- existing audit architecture
- existing v2 guard

Do NOT weaken:

V2_CANONICAL_WRITER_REQUIRED

Do NOT add:

- direct browser UPDATE
- service_role authority shortcut
- postgres authority shortcut
- GUC bypass
- test bypass
- Custom-specific lifecycle writer

Privilege != authorization.

==================================================
8. LEDGER
==================================================

Expand the existing operation family compatibly:

capture
modify
lifecycle

Do not rewrite historical ledger rows.

Lifecycle input identity must bind at minimum:

tenant
order
requestId
schemaVersion
subtype
fromState
toState
expectedRevision
reason where applicable
source event where applicable
verified actor authority

Required lifecycle subtypes may include:

confirm
transition
cancel
derived_transition

Use the smallest taxonomy supported by implementation evidence.

==================================================
9. IDEMPOTENCY
==================================================

Same:

requestId
+ actor
+ canonical input hash

returns the exact original committed lifecycle result.

No new revision.
No duplicate audit.
No duplicate dependent action.

Same requestId with different canonical input:

REQUEST_ID_CONFLICT.

Different request against an already cancelled order:

return:

ALREADY_CANCELLED

as an explicit NO-OP result.

It MUST NOT:

- increment revision
- create another cancellation audit event
- repeat dependent cancellation
- alter snapshots

Existing safe telemetry may record the attempted command only if it is
outside transactional lifecycle truth.

Do not invent telemetry infrastructure for A5.

==================================================
10. REVISION / CONCURRENCY
==================================================

Successful lifecycle state mutation:

revision + 1 exactly once.

Use expectedRevision / optimistic concurrency.

Concurrent operations serialize through canonical locking.

Stale competing operation:

REVISION_CONFLICT.

Prove at minimum:

edit vs cancel
cancel vs cancel
transition vs transition
delivery completion vs cancel
dispatch vs cancel
retry vs cancel

No parent resurrection.

No duplicate cascade.

No partial commit.

==================================================
11. ATOMICITY
==================================================

One required lifecycle transaction atomically commits:

- parent order lifecycle state
- revision
- request ledger
- immutable lifecycle audit
- required synchronous dependent-state mutations

Failure of any required component rolls back the complete transition.

External network effects are NOT falsely represented as DB-atomic.

==================================================
12. DELIVERY AGGREGATE — A5.x APPROVED DEPENDENCY
==================================================

The current semantic:

delivery service status IN (delivered, cancelled)
counts as resolved evidence capable of deriving parent delivered

is NOT accepted as canonical v2 semantics.

Freeze this invariant:

CANCELLED DELIVERY SERVICE IS NOT DELIVERED EVIDENCE.

Automatic parent:

→ delivered

is permitted only when all active delivery services required for
completion have positive delivered evidence according to the approved
delivery contract.

Therefore:

ALL DELIVERED:
may derive parent delivered.

MIXED DELIVERED + CANCELLED:
MUST NOT derive delivered merely because all rows are resolved.

ALL CANCELLED:
MUST NOT derive delivered.

Do NOT invent:

partially_delivered

or another persisted order state in A5.

Where the existing state model cannot truthfully represent the aggregate
outcome, fail closed / require explicit domain resolution according to
the implementation contract.

Do not silently rewrite broad legacy reporting semantics.

Scope this correction as:

A5.x DELIVERY AGGREGATE DEPENDENCY

and isolate compatibility impact.

==================================================
13. PACKED IS NOT A STATE
==================================================

delivery_service_status does NOT contain:

packed

packed_at / packed_by are evidence fields.

Remove any A5 dependency on the nonexistent packed enum value.

DO NOT automatically translate:

packed → prepared.

Derive allowed service cancellation from the real delivery state machine
and evidence.

If a new semantic decision is required:

STOP that sub-slice and report it.

==================================================
14. CANCELLED DELIVERY DEPENDENCIES
==================================================

When parent cancellation is permitted, dependent future work may be
cancelled only where the real domain state permits cancellation.

Historical dependent rows remain.

Do not hard-delete delivery services.

Do not erase:

packed_at
packed_by
assignment
attempt
delivery history
actor evidence

If dependent state cannot safely cancel:

entire parent cancellation fails atomically.

==================================================
15. REPEAT FROM CANCELLED SOURCE
==================================================

Repeat of a cancelled order is ALLOWED as a NEW commercial intention.

It MUST NOT reopen or resurrect the source order.

Require current:

- availability
- preparation/intention confirmation where applicable
- price confirmation
- quote/revalidation where applicable

Create:

new order identity

and new Custom identities where the existing Repeat contract requires.

Source order remains immutable historical evidence.

==================================================
16. UNKNOWN EXTERNAL EFFECTS
==================================================

The current side-effect matrix contains UNKNOWN for:

- billing/payment API
- notifications/email/WhatsApp
- cron/webhook/external batch

These UNKNOWN values DO NOT block implementation.

They DO block:

PRODUCTION_LIFECYCLE_CERTIFIED

and

A4b activation.

During A5 implementation/certification, convert each UNKNOWN into
evidence.

Do not assume NONE because no local caller was found.

==================================================
17. IMPLEMENTATION SLICES
==================================================

Authorize implementation through controlled slices:

A5.1
Ledger/schema/read compatibility.

A5.2
Canonical lifecycle writer + authority + audit + idempotency.

A5.3
Application lifecycle integration:
confirm/cancel/ordinary staff transitions.

A5.4
Operational domain integration:
kitchen/production/packing/logistics bounded SYSTEM_ONLY transitions.

A5.x
Delivery aggregate dependency correction and real service-state
cancellation semantics.

A5.5
Closure/certification:
prove no reachable direct v2 lifecycle writes and resolve external
side-effect UNKNOWNs.

Maintain expand-first compatibility.

Do not modify historical migrations.

==================================================
18. LEGACY COMPATIBILITY
==================================================

Do not unnecessarily change v1 behavior during expand slices.

v2 routing is based on:

write_contract_version == 2

not Custom presence.

Dish-only v2
Custom-only v2
Mixed v2

share the same lifecycle boundary.

Old application versions must fail safely for unsupported v2 lifecycle
operations.

Never fall back to unsafe direct UPDATE.

==================================================
19. TEST REQUIREMENTS
==================================================

Require:

- complete 81-transition matrix tests
- Dish-only v2
- Custom-only v2
- Mixed v2
- v1 regressions
- exact tenant isolation
- role/capability negatives
- authenticated operational actors
- direct service_role/postgres denial outside boundary
- request replay
- request conflict
- revision conflict
- atomic rollback
- audit rollback
- dependent-state rollback
- all-delivered aggregate
- mixed delivered/cancelled aggregate
- all-cancelled aggregate
- nonexistent packed regression
- concurrency/deadlock tests
- no parent resurrection
- immutable price/total/snapshot proof

==================================================
20. A4b REMAINS CLOSED
==================================================

A5 implementation DOES NOT authorize:

orders_custom_capture = ON

or

custom_activation = ON.

A4b activation remains separately governed.

A4b may return to activation preflight only after:

- A5 deployed through separately authorized release
- lifecycle certification succeeds
- external side-effect UNKNOWNs resolved
- Custom-only cancellation proven
- Mixed cancellation proven
- controlled confirmed-order cleanup proven
- delivery aggregate cannot falsely derive delivered from cancelled
- gates independently verified CLOSED
- fresh human activation authorization

==================================================
OUT OF SCOPE
==================================================

- A4b activation
- M3 activation
- OP08
- Extras
- weekly menu
- catalogue mutation
- Dish pricing redesign
- B2B Custom
- payment architecture redesign
- notification architecture redesign
- new partial-delivery order state
- sovereign break-glass design

==================================================
AUTHORIZATION BOUNDARY
==================================================

Alexander authorizes:

- branch/worktree creation
- A5 implementation
- additive local migrations
- tests
- local database validation
- commits
- PR creation/update

Alexander DOES NOT authorize:

- merge
- provider migration
- production mutation
- deployment
- Gate7 approval
- A4b activation
- feature-flag activation
- service-role/browser credential widening

Implementation must remain reviewable in PR.

If implementation reveals a semantic requirement conflicting with this
freeze:

STOP.

Return to Human Product Authority.

==================================================
EXPECTED IMPLEMENTATION EXIT
==================================================

When implementation is complete return:

CR_ORDER_A5_IMPLEMENTATION_COMPLETE_READY_FOR_HUMAN_REVIEW

with:

- slices completed
- migrations
- files
- exact state matrix implemented
- authority matrix
- ledger changes
- SQL/RLS/ACL proof
- idempotency proof
- concurrency proof
- audit/atomicity proof
- delivery aggregate proof
- side-effect investigation
- unresolved UNKNOWNs
- complete test evidence
- rollback plan
- diff audit
- explicit proof A4b gates remain CLOSED
- explicit proof no production mutation occurred

Do NOT merge.

Do NOT migrate provider.

Do NOT deploy.

Do NOT activate A4b.

STOP.
```

## Decisiones adicionales explícitas de esta sesión

1. Delivery services `pending`, `in_production`, `prepared` y `ready_for_delivery` pueden cancelarse únicamente sin despacho, entrega ni otra operación irreversible. Conservar evidencia; en caso contrario `OPERATIONAL_WORK_STARTED` y rollback total.
2. Aprobada la persistencia de evidencia canónica autenticada para packing/asignación de v2, sustituyendo la confianza en los Maps de FLOW-01. Conservar v1.

Los estados del pedido permanecen exactamente los nueve congelados. Los eventos de packing que no cambian estado incrementan revisión para serializar edición/cancelación y guardan ledger/audit; no introducen transiciones parentales adicionales. Esta es una decisión de concurrencia, no un nuevo estado.
