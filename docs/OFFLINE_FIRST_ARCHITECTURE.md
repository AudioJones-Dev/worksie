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
- Conflict rule: **last-writer-wins at row level**, with a server-side guard
  that rejects illegal state transitions (see `WORK_ORDER_LIFECYCLE.md`).
- "Last writer" is decided against `updated_at`, maintained by a `BEFORE
  UPDATE` trigger on every table except `WorkOrderEvent` (append-only, already
  has `at`). It is set server-side, never by the client, because device clocks
  are display-only per §Authority Rules — a skewed clock must not be able to
  win a conflict it should lose.

> **Scope of the guarantee.** `updated_at` is a single row-level marker. It
> decides *which row write landed last*. It **cannot** merge two clients that
> edited different fields of the same row — the later write takes the whole
> row and the earlier client's field is lost.
>
> Per-field resolution would require per-field version or timestamp metadata,
> which the schema does not have.
>
> Row-level is the deliberate v1 position. The Class B mobile write surface is
> narrow — `status`, `completed_at`, `completed_by`, GPS, line-item `quantity`
> — and two contractors concurrently editing *different* fields of the same
> work order is not a scenario v1 needs to merge. Revisit if that assumption
> breaks; the cost is per-field metadata or a CRDT, and neither is worth
> carrying before the pilot proves the need.
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

1. Mobile captures media → writes file to device → computes `content_hash`
   (SHA-256) over the bytes.
2. Mobile inserts `ProofOfWorkArtifact` row in local SQLite with
   `local_file_uri` and `content_hash` set, `file_id` null, and
   `processing_status = pending`.
3. PowerSync replicates the row up. Server sees a row referencing a file
   that isn't in Storage yet — fine.
4. A background upload worker on mobile pushes bytes to Supabase Storage
   (resumable), moving `processing_status` to `uploading`. On success it
   patches the row with `file_id`, clears `local_file_uri`, and sets
   `processing_status = stored`.
5. Failures retry with backoff and land on `processing_status = failed` once
   retries are exhausted. Uploads survive app restart.

`processing_status` is the queue's state column. Before it existed, a row's
stage had to be inferred from which of `file_id` / `local_file_uri` happened to
be null, which cannot distinguish "not started" from "failed".

`content_hash` identifies *bytes*. It does **not** by itself make retry
idempotent, and these are two separate problems that need two separate
mechanisms:

**Upload idempotency — a deterministic Storage object key.** If the worker
uploads an object and dies before recording `file_id`, a non-unique hash cannot
tell it which Storage object completed. The object path is therefore derived,
not random: `tenant_id / work_order_id / artifact_id`. `artifact_id` is the
client-generated UUID that already exists on the local row before the first
upload attempt, so every retry of the same artifact targets the same key and an
overwrite is a no-op rather than a duplicate. The worker recovers by heading
that key, not by searching on hash.

**Duplicate-artifact prevention — not attempted, deliberately.**
`content_hash` is indexed and **not unique**: the same photo legitimately
attaches to two work orders, and a re-shoot of the same static subject can hash
identically without being a mistake. Identical bytes are a signal for the back
office, not an error for the field. Any dedup is a read-time query, never a
write-time constraint.

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

- CRDTs. Row-level last-writer-wins on Class B is sufficient, given the narrow
  write surface described above.
- Operational transform on free-text fields. Notes are append-only.
- Peer-to-peer mesh sync between devices.
- Offline media transcoding.

## Why Not Firestore Offline

Firestore's offline cache is a client cache, not a relational mirror. The
compliance gate, payout rollup, and audit queries are joins; we want those
joins to work on the same engine in production and in local dev, which
means Postgres on the server and SQLite as the relational mobile mirror.
PowerSync bridges the two.
