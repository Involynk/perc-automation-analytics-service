# Architecture & Data Flow Context

This document details the system design, lead capture pipeline, decision trees, workflow state machine, and background scheduling engines.

---

## 1. System Microservices Architecture

```
                      ┌─────────────────────────────────────────┐
                      │             Inbound Webhooks            │
                      │  WhatsApp / IG / FB / Email / Web Form  │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 API Gateway (Port 3000)                                │
│                                                                                        │
│  ┌────────────────────┐    ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │ WebhookController  │───>│     LeadService     │───>│       RoutingService        │  │
│  └────────────────────┘    └─────────────────────┘    └──────────────┬──────────────┘  │
│                                                                      │                 │
│                            ┌─────────────────────┐                   │                 │
│                            │   CategoryService   │<──────────────────┘                 │
│                            └─────────────────────┘                                     │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│ Communication Service (3001)  │             │   Workflow Service (3002)     │
│                               │             │                               │
│  - WhatsApp Cloud API Handler │             │  - Workflow State Machine     │
│  - Email Nodemailer Handler   │             │  - Promise Scheduler (Cron)   │
│  - Instagram / Facebook API   │             │  - Retry & Escalation Engine  │
└───────────────────────────────┘             └───────────────────────────────┘
```

---

## 2. Lead Capture & Routing Sequence

```
Inbound Payload Received (Webhook Controller)
                      │
                      ▼
            Category Detection
     (Match text against keywords)
                      │
                      ▼
             Capture Lead Record
   (Store Lead, Conversation, Message)
                      │
                      ▼
              Evaluate Phone Number
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
Has Valid Phone?             No Phone Available?
(starts with "+")                    │
       │                             ▼
       ▼                   Is Channel Two-Way?
Route to WhatsApp           (IG, FB, Email, Web Chat)
(Status -> 'information_shared')     │
                               ┌─────┴─────┐
                               ▼           ▼
                              YES          NO
                               │           │
                               ▼           ▼
                        Send WA Request   Flag Admin
                        (Status ->        Attention
                         'waiting')
```

---

## 3. Detailed Routing & Phone Extraction Logic

### A. Category Detection Engine
- Operates on inbound message text (`CategoryService.detectCategories`).
- Keywords checked:
  - `fee_enquiry`: `"fee"`, `"fees"`, `"cost"`, `"price"`, `"tuition"`, `"structure"`
  - `course_enquiry`: `"course"`, `"program"`, `"degree"`, `"syllabus"`, `"branch"`, `"engineering"`, `"btech"`, `"mtech"`, `"mba"`
  - `admission_enquiry`: `"admission"`, `"enroll"`, `"apply"`, `"eligibility"`, `"criteria"`, `"last date"`, `"seat"`
  - `branch_enquiry`: `"location"`, `"address"`, `"campus"`, `"where"`, `"city"`
  - `faculty_enquiry`: `"faculty"`, `"teacher"`, `"professor"`, `"staff"`
  - `hostel_enquiry`: `"hostel"`, `"accommodation"`, `"stay"`, `"mess"`, `"food"`
- Returns an array of detected category strings (e.g. `["fee_enquiry", "course_enquiry"]`). Defaults to `["general_enquiry"]` if none match.

### B. Message Composition (`CategoryService.composeAskMessage`)
When a lead reaches via a non-WhatsApp channel without a phone number:
1. Builds a dynamic topic list from detected categories.
2. Composes tailored text (e.g., *"Thank you for your interest in our fee structure and courses! Please share your WhatsApp number so we can send full details."*).
3. Transmits message via target channel and schedules a 2-hour check promise.

### C. Reply Processing & Phone Extraction (`LeadService.processReply`)
When an existing lead in `waiting` state replies:
1. Regex scanner scans message for phone pattern: `/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,15}/`.
2. If phone is detected:
   - Updates `Lead.phone` with extracted number.
   - Clears `needs_whatsapp` flag.
   - Transitions `Lead.status` from `waiting` -> `new`.
   - Cancels pending `check_reply` promises for this lead.
   - Triggers `RoutingService.routeToWhatsApp()` to send welcome details on WhatsApp and update status to `information_shared`.

---

## 4. Lead Workflow States

| State | Enums Value | Trigger / Condition |
|---|---|---|
| `new` | `LeadStatus.NEW` | Lead record created; phone pending routing or just extracted |
| `waiting` | `LeadStatus.WAITING` | No phone number; requested WhatsApp phone number via two-way channel |
| `information_shared` | `LeadStatus.INFORMATION_SHARED` | Welcome message & course details successfully dispatched via WhatsApp |
| `interested` | `LeadStatus.INTERESTED` | Lead replied positively to WhatsApp info; follow-up scheduled |
| `applied` | `LeadStatus.APPLIED` | Lead submitted formal admission application |
| `admitted` | `LeadStatus.ADMITTED` | Admission confirmed / student enrolled |
| `closed` | `LeadStatus.CLOSED` | Lead closed (not interested / lost) |

---

## 5. Promise Scheduler & Execution Engine

- **Scheduler Location**: `packages/workflow-service/src/engine/promise.engine.ts`
- **Schedule Frequency**: Runs every 30 seconds (`@Cron('*/30 * * * * *')`).
- **Execution Flow**:
  1. Queries all `PromiseEntity` records where `status = 'pending'` AND `scheduled_at <= NOW()`.
  2. For each due promise:
     - Marks status as `processing`.
     - Executes promise payload handler (e.g., re-checking reply status, sending reminder message, escalating to admin).
     - On Success: Marks status as `completed`, logs timeline audit event.
     - On Failure: Evaluates retry count (`retries_left`). If `retries_left > 0`, reschedules for `+5 minutes` and decrements count. If `0`, marks as `failed` and notifies admin.
