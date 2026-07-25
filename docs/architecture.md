# Routing Architecture

## Lead Capture Flow

```
Inbound Message (any channel)
        │
        ▼
  ┌─────────────────┐
  │ detect_categories│ ← keyword matching (fee, course, admission, etc.)
  └────────┬────────┘
           │ list of categories
           ▼
  ┌─────────────────┐
  │ capture_inbound_ │
  │ lead()           │
  │                  │
  │ 1. Store in DB   │
  │ 2. Create        │
  │    workflow       │
  │ 3. Log timeline   │
  │ 4. Notify admins  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │   route_lead()   │
  └────────┬────────┘
           │
     ┌─────┴──────┐
     │            │
     ▼            ▼
  Has WA       No WA
  number?      number?
     │            │
     ▼            ▼
  route to     channel
  WhatsApp     supports
               reply?
                  │
            ┌─────┴─────┐
            │           │
            ▼           ▼
          Yes          No
            │           │
            ▼           ▼
     request_      flag for
     WhatsApp      admin
     number()      attention
```

## Routing Decision Tree

```
route_lead(lead_id, source_channel, categories[])
  │
  ├─ Lead has phone? (starts with "+")
  │     └─ YES → route_to_whatsapp(lead)
  │            │
  │            ├─ status != 'new' → skip (already handled)
  │            ├─ status == 'new' →
  │            │   1. Set status → 'information_shared'
  │            │   2. Update workflow state → 'information_shared'
  │            │   3. Log timeline event
  │            │   4. Send WhatsApp welcome message
  │            │   5. Schedule 2h follow-up promise
  │            │
  │
  ├─ No phone, but channel is two-way
  │  (instagram, facebook, email, website_chat)
  │     └─ YES → request_whatsapp_number(lead, channel, categories[])
  │            │
  │            1. Set status → 'waiting'
  │            2. Update workflow state → 'waiting'
  │            3. Log timeline event
  │            4. Send combined message:
  │               "Thank you for your interest in {topics}!
  │                Please share your WhatsApp number..."
  │            5. Schedule 2h check-reply promise
  │
  ├─ No phone, one-way channel (website_form, walkin, etc.)
  │     └─ flag for admin attention
```

## Category Detection (Multi-category — Option C)

```
detect_categories(text)
  │
  ├─ text is empty/null → ["general_enquiry"]
  │
  └─ For each category in order:
       fee_enquiry      ← "fee", "fees", "cost", "price" ...
       course_enquiry   ← "course", "program", "syllabus" ...
       admission_enquiry← "admission", "enroll", "apply" ...
       branch_enquiry   ← "branch", "location", "address" ...
       faculty_enquiry  ← "faculty", "teacher", "instructor" ...
       hostel_enquiry   ← "hostel", "accommodation", "pg" ...
     │
     └─ Match ALL that apply → return list
        e.g. "fees and courses" → ["fee_enquiry", "course_enquiry"]
```

## Message Composition

```
composeAskMessage(first_name, categories[])
  │
  ├─ No categories or general_enquiry →
  │    "Hi {name}! Thank you for reaching out! ... Please share your WhatsApp number..."
  │
  └─ Has specific categories →
       Build topics list from CATEGORY_MESSAGES:
         fee_enquiry      → "our fee structure"
         course_enquiry   → "our courses"
         admission_enquiry→ "admissions"
         branch_enquiry   → "our locations"
         faculty_enquiry  → "our faculty"
         hostel_enquiry   → "our hostel facilities"
     │
     ├─ 1 topic  → "Thank you for your interest in {topic}!"
     ├─ 2 topics → "Thank you for your interest in {a} and {b}!"
     └─ 3+ topics→ "Thank you for your interest in {a}, {b}, and {c}!"
     │
     └─ Append: " Please share your WhatsApp number so I can send you all the details there."
```

## Reply Processing (when lead responds with phone number)

```
Inbound message (existing lead in "waiting" state)
        │
        ▼
  route_message(lead_id, message_text, channel)
        │
        ├─ Update categories from new message (merge)
        │
        ├─ status == 'waiting' & needs_whatsapp == true
        │     └─ process_reply(lead_id, message_text)
        │            │
        │            ├─ extract_phone(text) → regex match
        │            │
        │            ├─ Phone found & valid?
        │            │     ├─ Save phone to lead
        │            │     ├─ Set status → 'new'
        │            │     ├─ Log timeline event
        │            │     ├─ Cancel pending promises
        │            │     └─ Route to WhatsApp (route_to_whatsapp)
        │            │
        │            └─ No phone found?
        │                  └─ Wait for next reply (promise will re-check)
        │
        └─ Normal message → cancel stale promises, update last_contacted
```

## Workflow States

```
new ──→ information_shared ──→ waiting ──→ interested ──→ ... → admitted/closed
  │                              │
  └──→ waiting (no WA number)    └──→ new (phone received)
```

| State | Meaning |
|---|---|
| `new` | Lead just captured, no action taken yet |
| `information_shared` | Info sent via WhatsApp (lead has WA number) |
| `waiting` | Awaiting WhatsApp number from lead |
| `interested` | Lead engaged, follow-up scheduled |
| `lost` / `closed` | Terminal states |

## Promise / Schedule System

```
create_promise(lead_id, promise_type, scheduled_at, payload)
  │
  ├─ followup  → re-check for reply
  ├─ reminder  → send reminder message
  ├─ escalation→ notify admin
  └─ ... (meeting_reminder, recovery, etc.)

Scheduler (runs every 30s):
  └─ Find all pending promises where scheduled_at < now
       └─ Execute promise action
            ├─ Success → status = 'completed'
            ├─ Failure & retries left → reschedule +5min
            └─ Failure & no retries → status = 'failed'
```

## Database Tables (used by routing)

| Table | Purpose |
|---|---|
| `leads` | Aggregate root — stores phone, email, source, category, status |
| `conversations` | Groups messages per lead per channel |
| `messages` | Individual inbound/outbound messages |
| `timeline_events` | Immutable audit log of all lead interactions |
| `workflow_instances` | One-per-lead state machine |
| `workflow_history` | Audit trail of state transitions |
| `promises` | Scheduled future actions (follow-ups, reminders) |
| `channels` | Active communication channels (whatsapp, email, etc.) |
| `notifications` | Admin notification inbox |
| `event_types` | Controlled vocabulary for timeline events |
