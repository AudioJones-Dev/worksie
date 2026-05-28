# Competitive Positioning

Worksie's product strategy is to own the operational readiness layer for
field-service and contractor operations. This document defines the market gap,
buyer-facing language, product boundaries, and moat strategy that other product
and architecture decisions must reinforce.

## Strategic Position

Worksie is not a CRM, scheduling platform, accounting tool, generic form
builder, or photo documentation app.

Worksie is the **operational readiness layer** for field-service and contractor
operations.

The product exists to answer one critical operational question:

> Is this field job complete, documented, approved, and ready to bill?

## Market Gap

Existing tools own adjacent layers:

- CompanyCam owns photo documentation.
- SimplyWise owns contractor admin and receipt/expense workflows.
- Jobber and Housecall Pro own scheduling, quoting, and invoicing.
- ServiceTitan owns enterprise field-service operations.
- SafetyCulture owns inspections and checklists.
- QuickBooks and Xero own accounting.

No SMB-to-mid-market platform clearly owns the validation layer between field
activity and downstream business systems.

Worksie should occupy this gap.

## Core Differentiator

Worksie converts raw field activity into:

- validated job records
- documentation completeness scores
- missing evidence flags
- approval-ready submissions
- billing readiness status
- operational memory
- downstream automation triggers

## Buyer-Facing Positioning

Primary positioning:

> Worksie helps field teams prove the job is complete, approved, and ready to bill.

Secondary positioning:

> Worksie is the operational readiness engine between field execution and your
> CRM, accounting, and business systems.

## MVP Wedge

The initial wedge should focus on documentation-heavy contractor and inspection
workflows where incomplete documentation delays payment, approvals, compliance,
or customer acceptance.

Priority verticals:

1. restoration contractors
2. commercial inspection teams
3. specialty contractors
4. maintenance and service teams with approval-heavy workflows

## Product Boundary

Worksie should integrate with CRMs, accounting platforms, and scheduling tools
rather than replace them.

Worksie owns:

- field proof capture
- dynamic submission workflows
- readiness scoring
- approval routing
- billing readiness
- operational memory
- automation triggers

Worksie does not own:

- lead pipelines
- sales CRM
- marketing automation
- full accounting
- payroll
- inventory
- dispatch as a core MVP feature

## Moat Strategy

Worksie's moat should be built through:

1. Operational memory
2. Tenant-specific workflow rules
3. Documentation completeness data
4. Approval and billing-readiness patterns
5. Integration into downstream CRM/accounting systems
6. Vertical-specific evidence standards

The strongest long-term moat is operational memory: every job record teaches
Worksie what complete, billable, and approval-ready work looks like for that
tenant and vertical.

## MVP Product Rule

Every MVP feature must support one of the following outcomes:

- capture what happened
- validate whether documentation is complete
- route approval
- determine billing readiness
- create audit evidence
- trigger downstream systems

If a feature does not support one of these outcomes, it should be deferred.
