# Offline-First Architecture

Worksie's field app must work without connectivity. This document defines
the sync model, conflict rules, and which tables live where.

## Goals

1. A contractor on a job site with no signal can open assigned work
   orders, complete checklists, capture photos, sign forms, and mark
   completion.
2. When signal returns, the local state reconciles to Postgres without
   manual intervention.
3. Back-office and operator views in the web admin reflect field state in
   near-real-time once signal returns.
4. No silent data loss. Conflicts surface, they don't disappear.

## Stack

- **Server of record:** Supabase Postgres.
- **Sync engine:** PowerSync.
- **Mobile local DB:** SQLite (managed by PowerSync).
- **Web admin:** reads Postgres directly via Supabase client (no local
  mirror needed in v1).
- **Large media:** Supabase Storage. Files are referenced by id in
  Postgres; the file bytes are uploaded with their own resumable queue.

## Sync Classes

Tables fall into one of four sync classes. The class determines what
syncs offline and how conflicts resolve.

### Class A — Reference (read-only on mobile)
Examples: `ServiceDefinition`, `DocumentType`, `SafetyPack`,
`ChecklistTemplate`, `PayoutRule`, `BusinessProfile`.

- Mobile reads only.
- Server is authoritative.
- PowerSync pushes updates down on reconnect.
- No conflict resolution needed.

### Class B — Assigned (read on mobile, narrow write)
Examples: `WorkOrder`, `WorkOrderLineItem`, `ChecklistInstance`,
`ChecklistStep`.

- Mobile writes are scoped: only the assigned contractor can mutate, and
  only specific fields (`status`, `completed_at`, `completed_by`, GPS,
  line-item `quantity`).
- Conflict rule: **last-writer-wins per field**, with server-side guard
  that rejects illegal state transitions (see
  `WORK_ORDER_LIFECYCLE.md`).
- Reassignment is a server-side action; mobile cannot change
  `assigned_contractor_membership_id`.

### Class C — Append-only (mobile creates freely)
Examples: `ProofOfWorkArtifact`, `CustomerSignoff`, `SafetyAcknowledgement`.

- Mobile creates rows with client-generated UUIDs.
- Conflict rule: **inserts never conflict.** Server accepts the row and
  binds it to its parent.
- Files (photos, videos, PDFs) live in Supabase Storage. The local row
  carries a `local_file_uri` until the upload completes; the
  `file_id` references Storage once uploaded.

### Class D — Server-only
Examples: `PayoutPeriod`, `PayoutLine`, `ContractorDocument` verification
fields, RLS policies, materialized views.

- Mobile never writes. Mobile may read filtered subsets if needed.

## File Upload Queue

Photos and signatures are the bandwidth-heavy artifacts. The flow:

1. Mobile captures media → writes file to device.
2. Mobile inserts `ProofOfWorkArtifact` row in local SQLite with
   `local_file_uri` set and `file_id` null.
3. PowerSync replicates the row up. Server sees a row referencing a file
   that isn't in Storage yet — fine.
4. A background upload worker on mobile pushes bytes to Supabase Storage
   (resumable). On success, it patches the row with `file_id` and clears
   `local_file_uri`.
5. Failures retry with backoff. Uploads survive app restart.

## Authority Rules

- **Time:** mobile captures `captured_at` from the device clock; server
  records `received_at`. Use `captured_at` for display, `received_at` for
  audit.
- **Identity:** mobile inserts rows as the signed-in contractor. Server
  RLS enforces it.
- **State transitions:** the server validates work-order state changes
  against `WORK_ORDER_LIFECYCLE.md`. Illegal transitions from a stale
  mobile client are rejected and surfaced to the user as a sync error
  with explanation.

## What Has to Be True for Dispatch

A contractor cannot be dispatched to a work order unless their compliance
gate is green at dispatch time. The gate is evaluated **server-side** and
the gate state is replicated to mobile so the assignment list never shows
work the contractor isn't currently allowed to do.

## Explicitly Not Doing (v1)

- CRDTs. Per-field last-writer-wins on Class B is sufficient.
- Operational transform on free-text fields. Notes are append-only.
- Peer-to-peer mesh sync between devices.
- Offline media transcoding.

## Why Not Firestore Offline

Firestore's offline cache is a client cache, not a relational mirror. The
compliance gate, payout rollup, and audit queries are joins; we want those
joins to work on the same engine in production and in local dev, which
means Postgres on the server and SQLite as the relational mobile mirror.
PowerSync bridges the two.
