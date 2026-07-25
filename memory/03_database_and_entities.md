# Database Schema & Entity Documentation

The system uses **Supabase (PostgreSQL)** as its database, accessed via the `@supabase/supabase-js` client with service-role key.

---

## 1. Database Configuration

- **Database Engine**: Supabase (PostgreSQL 15+)
- **Client**: `@supabase/supabase-js` with `service_role` key (server-side only, never exposed to client)
- **Auth**: `persistSession: false`, `autoRefreshToken: false` (no client-side session, backend-only)
- **Schema**: Managed via SQL migrations (`docs/perc_schema.pg.sql`), run manually in Supabase SQL Editor
- **Seeding**: Auto-executed via `seedDatabase(supabase)` on startup (checks existing rows, inserts defaults)
- **Provider**: `SupabaseModule` (global) injects `SupabaseClient` into all services/controllers
- **Replaces**: TypeORM + SQLite (fully removed from api-gateway; workflow-service still uses old TypeORM)

---

## 2. Table Schemas & Entity Definitions

All entities are plain TypeScript interfaces in `packages/shared/src/entities/`. Schema is managed via SQL migrations in `docs/perc_schema.pg.sql`.

### A. `leads` (`Lead`)
Master aggregate root for all prospective student leads.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | No | Unique Lead ID |
| `first_name` | `TEXT` | No | Lead first name / contact name |
| `last_name` | `TEXT` | Yes | Lead last name |
| `phone` | `TEXT` | Yes | Primary phone number (E.164 format) |
| `email` | `TEXT` | Yes | Lead email address |
| `source` | `TEXT` | No | Originating channel (`whatsapp`, `instagram`, `facebook`, `email`, etc.) |
| `source_reference_id` | `TEXT` | Yes | External ID from channel |
| `category` | `TEXT` | Yes | Comma-separated category strings |
| `status` | `TEXT` | No | Lead status enum (`new`, `waiting`, `information_shared`, etc.) |
| `classification` | `TEXT` | Yes | Hot/warm/cold classification |
| `assigned_to` | `TEXT` (FK users) | Yes | Assigned counselor/user ID |
| `metadata` | `TEXT` (JSON) | No | Additional metadata |
| `is_active` | `BOOLEAN` | No | Soft delete flag |
| `created_at` | `TIMESTAMPTZ` | No | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Record last update timestamp |

---

### B. `conversations` & `messages`
Track interaction channels and message history per lead. **Both inbound and outbound messages are stored** — auto-replies from routing, requests for WhatsApp number, and follow-ups from promise tick all create `direction: 'outbound'` records.

#### `conversations`
- `id`: TEXT UUID Primary Key
- `lead_id`: FK -> `leads(id)`
- `channel_id`: FK -> `channels(id)`
- `external_conversation_id`: External chat/thread ID
- `status`: `active` | `closed` | `archived`
- `started_at`, `ended_at`
- `metadata`: TEXT JSON

#### `messages`
- `id`: TEXT UUID Primary Key
- `conversation_id`: FK -> `conversations(id)`
- `lead_id`: FK -> `leads(id)`
- `direction`: `inbound` | `outbound`
- `content_type`: `text` | `image` | `document` | `template` | `video` | `audio` | `location` | `sticker` | `button`
- `content`: Message body
- `channel_message_id`: External platform message ID
- `status`: `sent` | `delivered` | `read` | `failed`
- `sent_at`, `delivered_at`, `read_at`
- `metadata`: TEXT JSON

---

### C. `workflow_instances` & `workflow_history`
State machine persistence for lead lifecycle.

#### `workflow_instances`
- `id`: TEXT UUID Primary Key
- `lead_id`: FK -> `leads(id)` (One-to-One unique)
- `current_state`: Workflow state enum
- `previous_state`: Previous state
- `is_paused`, `is_completed`: BOOLEAN
- `metadata`: TEXT JSON
- `created_at`, `updated_at`

#### `workflow_history`
- `id`: TEXT UUID Primary Key
- `workflow_id`: FK -> `workflow_instances(id)`
- `lead_id`: FK -> `leads(id)`
- `from_state`, `to_state`: State transition
- `triggered_by`: `system` | `admin` | `automation`
- `metadata`: TEXT JSON
- `created_at`

---

### D. `promises` (`PromiseEntity`)
Background scheduled promises for automated follow-ups and reminders.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT UUID | Unique Promise ID |
| `lead_id` | TEXT (FK) | Target Lead ID |
| `workflow_id` | TEXT (FK) | Optional workflow reference |
| `promise_type` | TEXT | `followup`, `reminder`, `escalation`, `report`, etc. |
| `scheduled_at` | TIMESTAMPTZ | Target execution timestamp |
| `status` | TEXT | `pending`, `executing`, `completed`, `failed`, `cancelled` |
| `payload` | TEXT (JSON) | Execution context & payload data |
| `retry_count` | INTEGER | Current retry attempt |
| `max_retries` | INTEGER | Default `3` |
| `is_recurring` | BOOLEAN | Whether promise repeats |
| `recurring_interval` | TEXT | Interval string (e.g. `'1 day'`) |

---

### E. `timeline_events` (`TimelineEvent`)
Immutable audit trail logging every lead interaction, system action, state change, and notification.

- `id`: TEXT UUID Primary Key
- `lead_id`: FK -> `leads(id)`
- `event_type_id`: FK -> `event_types(id)`
- `actor_type`: `system` | `admin` | `lead` | `automation`
- `description`: Human-readable summary
- `metadata`: TEXT JSON
- `created_at`: TIMESTAMPTZ

---

### F. Auxiliary System Tables
- `channels`: Configuration for enabled messaging channels.
- `notifications`: Admin notification items.
- `event_types`: Reference taxonomy for audit event types.
- `courses`: Academic programs catalog (e.g. B.Tech CS, MBA, MCA).
- `lead_courses`: Many-to-many leads interested in courses.
- `users`: Counselors, admins, and system service accounts.
- `settings`: System-wide settings (e.g. business hours, retry limits, default routing).

---

## 3. Database Seed Data

Defined in `packages/shared/src/database-seed.ts`:
- **Channels**: WhatsApp, Instagram, Facebook, Email, Website Form, Website Chat, Google Business, Phone, Walk-in, Referral, SMS.
- **Event Types**: Lead Created, Information Shared, Reply Received, Follow-up Sent, Admin Action.
- **System Settings**: Working hours, followup timings, auto_response_enabled.
