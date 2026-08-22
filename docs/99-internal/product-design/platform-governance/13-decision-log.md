# Product Design 02-E · SaaS Platform Governance & Support Architecture
## 13 — Complete 90-Decision Log

---

### Category 01 — Super Admin Authority
- **D-01 (Super Admin Role Taxonomy)**: Super Admin represents global platform administration, platform support, and platform governance, with future separation into configurable platform roles. (Option D)
- **D-02 (Current Platform Role Model)**: Currently one persona may accumulate all platform responsibilities; future architecture must allow configurable role separation. (Option B)
- **D-03 (Super Admin Business Authority)**: Super Admin operates on platform configuration according to defined boundaries, but cannot make tenant business decisions without explicit authorization mechanisms. (Option D)
- **D-04 (Tenant Configuration Ownership)**: Tenant configuration belongs exclusively to the Tenant. (Option A)
- **D-05 (Tenant Suspension Grounds)**: Super Admin may suspend a Tenant according to platform governance, security, operational, or commercial policy requirements. (Option D)

### Category 02 — Support Context
- **D-06 (Support Context Capabilities)**: Support Context may perform READ, Technical Fix, Business Data Modification, and Sensitive Actions, subject to action classification rules. (Option D)
- **D-07 (Order Modification by Support)**: Support may modify an order only when explicitly authorized by the Tenant. (Option C)
- **D-08 (Customer Data Modification by Support)**: Support may modify Customer data only with Tenant authorization. (Option C)
- **D-09 (Menu/Pricing Modification by Support)**: Support may perform exceptional modifications only under the 02-E authorization model. (Option D)
- **D-10 (Support Context Initiation)**: Initiation requires Tenant selection, mandatory reason, ticket reference where applicable, explicit confirmation, and complete audit. (Option E)
- **D-11 (Tenant Notification)**: Tenant notification upon support session initiation is configurable. (Option B)
- **D-12 (Support Session Duration)**: Support sessions have a controlled lifecycle with configurable duration policy. (Option E)
- **D-13 (Session Termination Mechanics)**: Ending Support Context immediately revokes elevated access and closes the session. (Option B)
- **D-14 (Audit Logging)**: All support actions are auditable, with enhanced auditing for sensitive actions. (Option B + C)

### Category 03 — Platform vs Tenant Configuration
- **D-15 (Super Admin Configuration Scope)**: Super Admin may manage platform metadata, tenant metadata, and authorized branding/platform configurations. (Option A + B + C)
- **D-16 (Configuration Separation)**: Maintain conceptual separation between Tenant Metadata, Tenant Business Configuration, Tenant Subscription/License, and Runtime Configuration. (Option C)
- **D-17 (Business Configuration Authority)**: Tenant owns business configuration; platform governs platform configuration. (Option C)
- **D-18 (Platform Intervention Scope)**: YourMeal OS imposes only mandatory platform/security policies and emergency controls; it must not silently make ordinary business decisions. (Option D)

### Category 04 — Catalog / Module / Capability / Entitlement
- **D-19 (Three-Tier Catalog Separation)**: Maintain separation between Platform Catalog, Tenant Entitlement, and Tenant Configuration. (Option A)
- **D-20 (Capability/Module Ownership)**: YourMeal OS owns the platform catalog; Tenant controls use within permitted entitlement model. (Option C)
- **D-21 (Module Activation Authority)**: Super Admin controls platform availability/licensing; Tenant activates/configures permitted functionality. (Option A)
- **D-22 (Module Suspension Authority)**: Super Admin may suspend a module for legitimate platform/security reasons with controlled impact and communication. (Option D)
- **D-23 (Entitlement Modeling)**: Entitlements exist conceptually now and must be represented explicitly in future architecture. (Option C)

### Category 05 — Plans / Quotas / Usage
- **D-24 (Commercial Plans)**: YourMeal OS will support commercial Plans. (Option A)
- **D-25 (Resource Quotas)**: Plans may define quantitative limits. (Option A)
- **D-26 (Quota Behavior Support)**: Quota behavior supports warnings, upgrade requirements, and configurable behavior by quota type. (Option B + D + E)
- **D-27 (Progressive Thresholds)**: Default warnings at 80%, 90%, 100% plus upgrade recommendations. (Option E)
- **D-28 (100% Quota Enforcement)**: Default behavior depends on quota type (soft vs hard) and is configurable. (Option D)

### Category 06 — Platform RBAC
- **D-29 (Tenant User Management Ownership)**: Tenant Admin owns normal Tenant user management, with exceptions for bootstrap, support, and authorized SaaS Admin intervention. (Option B)
- **D-30 (Super Admin Role Assignment)**: Super Admin may assign Tenant roles where platform authority requires it, but normal management belongs to Tenant Admin. (Option B)
- **D-31 (Role Context Separation)**: Platform Roles and Tenant Roles are separate contexts with controlled interoperability. (Option C)
- **D-32 (Dual Persona Holding)**: A user may hold Platform and Tenant roles, but contexts remain separated and authorization respects active context. (Option D)

### Category 07 — Global Integrations
- **D-33 (Provider Governance)**: Provider support is governed by Product/Platform and operated by Super Admin. (Option B + A)
- **D-34 (Custom Tenant Providers)**: Tenant may request/use custom providers through an approved homologation path. (Option B)
- **D-35 (Global Provider Suspension)**: Super Admin may suspend a provider globally under platform governance. (Option A)
- **D-36 (Outage Fallback)**: Fallback is governed by platform capability, tenant configuration, and emergency platform controls. (Option D)

### Category 08 — Platform Reporting
- **D-37 (Global Reporting Scope)**: Super Admin accesses technical health, aggregate usage metrics, and aggregate platform metrics; individual tenant business data requires Support Context. (Option E)
- **D-38 (Cross-Tenant Comparison)**: Arbitrary cross-tenant comparative business data is not exposed. (Option C)
- **D-39 (Tenant Data Isolation)**: A Tenant must never see another Tenant's data. (Option A)

### Category 09 — Data / Safety
- **D-40 (Business Record Deletion)**: Business data deletion is controlled and requires legal/compliance processes and authorized Support Context. (Option D)
- **D-41 (Audit Record Preservation)**: Audit history is not casually deletable; retention/purge follows formal policy. (Option C)
- **D-42 (Break Glass Existence)**: Break Glass exists but is strictly restricted and audited. (Option B)

### Category 10 — Support Operating Model
- **D-43 (Support Case Object)**: Do not create a full native ticketing system in 02-E. (Option B)
- **D-44 (Support Session Record)**: Support Session records Tenant, Agent, reason, start, end, actions, and ticket reference. (Option A)
- **D-45 (Support Context Tenant Scope)**: Support without a tenant exists only for pure platform support. (Option C)

### Category 11 — Governance Contract
- **D-46 (Responsibility Matrix)**: Create explicit responsibility matrix covering Platform, Tenant, Support, Customer, Operations, Automation, and Integration. (Option A)
- **D-47 (Platform Governance Contract)**: 02-E produces Platform Governance Contract v1.0. (Option A)
- **D-48 (Technical Boundary)**: 02-E defines authority boundaries but defers technical implementation design. (Option C)

### Category 12 — Additional Decisions (52–90)
- **D-49 / D-52 (Super Admin Action Boundary)**: Super Admin may freely operate on platform configuration, but not tenant business configuration without explicit authorization.
- **D-50 (Action Classification Tiers)**: Mandatory 5-tier classification (`READ`, `TECHNICAL FIX`, `BUSINESS DATA MODIFICATION`, `SENSITIVE ACTION`, `FORBIDDEN`).
- **D-51 (Plan/Entitlement/Quota/Usage Coupling)**: Conceptually separated, but not necessarily four isolated technical systems.
- **D-53 (Support Context Initiators)**: Current baseline: `saas_admin` and `platform_support`; future roles configurable. (Option B)
- **D-54 (Business Data Modification Rules)**: Allowed only through authorized support flows for permitted entity/action types. (Option D)
- **D-55 (Sensitive Action Controls)**: Sensitive actions require authorization, confirmation, and enhanced audit. (Option E)
- **D-56 (Support Session Scoping)**: Mandatory scoped Support Context targeting specified resources. (Option A)
- **D-57 (Tenant Switching Protocol)**: One tenant per Support Context session; close current before starting another. (Option A)
- **D-58 (Approval by Sensitivity)**: Tenant authorization required, with dual-control for Sensitive Actions. (Option E)
- **D-59 (Support Justification Requirements)**: Ticket reference mandatory where applicable; reason mandatory for Sensitive Actions. (Option D)
- **D-60 (Tenant Visibility of Support)**: Tenant can view relevant support activity excluding internal platform details. (Option B)
- **D-61 (Plan Definition)**: A commercial package containing capabilities and limits. (Option D)
- **D-62 (Entitlement Definition)**: A concrete capability right available to a Tenant. (Option A)
- **D-63 (Quota Definition)**: A quantitative numerical limit. (Option A)
- **D-64 (Usage Definition)**: The actual consumption of a quota resource. (Option A)
- **D-65 (Custom Entitlements)**: Allowed through YourMeal OS approval/custom entitlement. (Option D)
- **D-66 (Custom Quotas)**: Allowed with YourMeal OS commercial approval. (Option C)
- **D-67 (Warning Progression)**: 80% / 90% / 100% progressive warnings plus upgrade recommendations. (Option E)
- **D-68 (100% Behavior Flexibility)**: Configurable and quota-type dependent. (Option D)
- **D-69 (Capability Creation Governance)**: Capabilities are defined through product release governance, not ad-hoc UI. (Option B)
- **D-70 (Module Assembly)**: Modules are assembled from capabilities; publication requires release governance. (Option C)
- **D-71 (Capability Dependencies)**: Independent capability usage permitted only when dependency rules are satisfied. (Option D)
- **D-72 (Module Suspension Policy)**: Controlled by criticality and platform safety policy. (Option D)
- **D-73 (Capability Catalog View)**: Super Admin views/manages governed platform capability catalog. (Option A)
- **D-74 (Provider Homologation)**: Third-party providers are governed and certified by Product/Platform. (Option A)
- **D-75 (Custom Provider Certification)**: Tenants may integrate approved custom providers via homologation path. (Option B)
- **D-76 (Credential Ownership)**: Tenant controls credentials; secrets must never be readable by Super Admin as plain text. (Option D)
- **D-77 (Secret Visibility Zero-Knowledge)**: Never expose secrets normally; Break Glass access strictly controlled. (Option D)
- **D-78 (Emergency Fallback)**: Fallback forced under tenant configuration or legitimate global emergency. (Option D)
- **D-79 (Break Glass Architecture)**: Emergency only, reason mandatory, additional authorization, time-limited, scoped, enhanced audit, post-action review. (Option A)
- **D-80 (Break Glass Data Modification)**: Allowed only for critical emergency conditions with tenant authorization. (Option D)
- **D-81 (Post-Action Review Mandatory)**: Mandatory review following any Break Glass execution. (Option A)
- **D-82 (No Native Ticketing System)**: Use Support Session + reason + external ticket reference. (Option A)
- **D-83 (Global Sales Reporting)**: Super Admin views platform aggregate totals and tenant volume metrics. (Option D)
- **D-84 (Tenant Commercial Data Boundary)**: Detailed tenant business data requires authorized Support Context. (Option B)
- **D-85 (GDPR & Purge Design)**: Designed conceptually in 02-E; technical implementation scheduled for future phase. (Option C)
- **D-86 (02-E Scope Lock)**: Locks platform governance, roles, support context, authority, modules, plans, quotas, integrations, and break glass. (Option A)
- **D-87 (Responsibility Matrix Mandatory)**: Formal RACI matrix is a required deliverable. (Option A)
- **D-88 (Platform Governance Contract v1.0)**: Formal deliverable of 02-E. (Option A)
- **D-89 (Technical Boundary Statement)**: Product defined now, technical design later, security architecture cross-check required. (Option A)
- **D-90 (Next Phase Workflow)**: After 02-E LOCK: Contract -> Technical Design -> Implementation; Carril A continues independently. (Option A)
