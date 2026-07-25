# PERC Admission Operations Engine
## Complete System Specification & Knowledge Base (Master Document — v1.0)

---

## Table of Contents

1. [Product Philosophy & Positioning](#1-product-philosophy--positioning)
2. [Core Mental Model](#2-core-mental-model)
3. [Lead Lifecycle](#3-lead-lifecycle)
4. [Data Model Overview](#4-data-model-overview)
5. [Input Streams](#5-input-streams)
6. [Output Streams](#6-output-streams)
7. [Communication Rule](#7-communication-rule)
8. [The 11 Core Engines — Detailed Specification](#8-the-11-core-engines--detailed-specification)
9. [Orchestration & Execution Architecture](#9-orchestration--execution-architecture)
10. [Documents & Knowledge Assets to Prepare Before Development](#10-documents--knowledge-assets-to-prepare-before-development)
11. [Lead Status & Classification Definitions](#11-lead-status--classification-definitions)
12. [Admin Dashboard Specification](#12-admin-dashboard-specification)
13. [System Configuration](#13-system-configuration)
14. [Master Implementation Plan (Phases & Sprints)](#14-master-implementation-plan-phases--sprints)
15. [Success Criteria](#15-success-criteria)
16. [Open Discussion Items / Decisions Still Needed](#16-open-discussion-items--decisions-still-needed)

---

## 1. Product Philosophy & Positioning

The product must **not** be thought of, built, marketed, or discussed internally as a "CRM." A CRM is a passive system of record — it stores data and waits for a human to act on it. This product is fundamentally different in kind.

**Official positioning: Admission Operations Engine.**

The defining idea is:

> Every lead becomes an autonomous workflow, managed continuously by the system, until it is either converted into a student or explicitly marked as closed.

This is the single sentence that should govern every design decision from here forward. If a proposed feature does not fit inside "manage the lead's workflow automatically," it does not belong in the core product — it belongs in a peripheral tool.

### 1.1 Why "CRM" is the wrong mental model

A CRM:
- Stores lead records.
- Requires a human to remember to follow up.
- Requires a human to decide what to send.
* Requires a human to decide when to escalate.
- Calculates analytics after the fact, in batch.

An Admission Operations Engine:
- Treats every lead as a live, running process (a "workflow instance").
- Decides for itself when to follow up, what to send, and when to escalate.
- Updates analytics in real time, as a side-effect of the workflow itself.
- Reduces the admin's job to counseling, decision-making, and admissions — not remembering, chasing, or repeating information.

### 1.2 What "no intelligence required" means

A recurring theme across the whole architecture: most of the system does **not** need AI/LLM intelligence to function. Template selection, follow-up timing, escalation rules, and reminders are all **deterministic, rule-based automation**. AI/LLM capability, if used at all, is reserved for a narrow layer (e.g., the Recommendation Engine's "next best action" reasoning) — not for generating conversational replies. This keeps behavior predictable, auditable, and safe for a business-critical admissions process.

### 1.3 Product goal (measure of success)

The success of the PERC Admission Operations Engine is **not** measured by how intelligently it chats. It is measured by:
- How effectively it reduces manual work.
- How well it standardizes operations.
- How reliably it prevents lead leakage (no enquiry ever silently dies).
- How well it keeps every stakeholder informed.
- How much it maximizes enquiry-to-admission conversion through disciplined workflow automation.

---

## 2. Core Mental Model

### 2.1 Every Lead is a Workflow Instance

Instead of storing only a flat "Lead" record, the system stores a composite object per lead:

```
Lead
 ├── Workflow        (current state, transition history, active timers)
 ├── Conversation     (all inbound/outbound messages across channels)
 ├── Tasks            (pending human actions: call, meeting, review)
 ├── Calendar         (scheduled calls/meetings tied to this lead)
 ├── Timeline         (chronological event log — the "memory" of the lead)
 └── Analytics        (real-time computed metrics tied to this lead and rolled up globally)
```

Every one of these six sub-objects is written to and read from continuously by the various engines described in Section 8. None of them is optional — a "Lead" without a Workflow is just a contact; a "Lead" without a Timeline cannot be automated safely because no engine would know what has already happened.

### 2.2 It Is a State Machine, Not a Conversation

The moment an enquiry is captured, it stops being "a chat" and becomes "a running process." The system does not wait passively for messages — it actively drives the lead forward (or sideways into recovery, or out into closure) based on state, elapsed time, and lead behavior.

### 2.3 "The system should schedule itself"

This is a foundational requirement, not a nice-to-have. Nothing in the system should depend on an admin remembering to do something later. Every time-based action — a follow-up, a reminder, an escalation, a report — must be represented as a **scheduled job**, created automatically the moment the triggering event happens.

---

## 3. Lead Lifecycle

### 3.1 Canonical Lifecycle Diagram

```
New Enquiry
   ↓
Lead Created
   ↓
Information Shared
   ↓
Waiting
   ↓
Lead Replied?
   ├── YES → Continue Journey
   └── NO  → Follow-up
                 ↓
            Interested?
                 ├── YES → Schedule Call
                 │            ↓
                 │       Call Completed?
                 │            ├── YES → Interested?
                 │            │            ├── YES → Admission
                 │            │            │            ↓
                 │            │            │       Student Created
                 │            │            │            ↓
                 │            │            │        Completed
                 │            │            └── NO  → Recovery Flow → Closed
                 │            └── NO  → Recovery Flow → Closed
                 └── NO  → Recovery Flow → Closed
```

### 3.2 Detailed Lifecycle / Pipeline Stages

The full enumerated pipeline stage list (used for status fields, dashboard filters, and analytics buckets):

1. **New** — enquiry just captured, nothing sent yet.
2. **Information Shared** — an automated response/template/document has been sent.
3. **Waiting for Response** — system is in a monitoring period, timers active.
4. **Interested** — lead has signaled positive intent (explicit reply, request for call, etc.).
5. **Call Scheduled** — a call has been booked with an admin/counselor.
6. **Meeting Completed** — the scheduled call/meeting has occurred.
7. **Demo Scheduled** — a demo class has been booked (education-specific step).
8. **Admission Pending** — lead has agreed to join; paperwork/payment in progress.
9. **Admitted** — student record created; admission workflow complete.
10. **Inactive** — no meaningful activity for a defined period; not yet lost.
11. **Recovery** — a re-engagement workflow has been triggered for a stalled/inactive/uninterested lead.
12. **Lost** — lead explicitly declined or recovery attempts exhausted.
13. **Closed** — workflow terminated (via Admitted, Lost, or manual admin closure).

### 3.3 Terminal States

A lead's workflow is only considered finished when it reaches one of these four terminal states:
- Admission Completed
- Lead Closed
- Lead Marked Lost
- Lead Archived

Until one of these is reached, the lead is an **active workflow** and is continuously evaluated by the Automation Orchestrator (Section 8.11).

---

## 4. Data Model Overview

While full schema design belongs in Phase 0 (Section 10), the following conceptual entities must exist and must be understood by every engine:

- **Lead** — identity, contact info, source, category, current status, assigned admin/counselor.
- **Workflow** — current state, state history (audit trail of transitions), active scheduled jobs tied to this lead, cancellation flags.
- **Conversation** — every inbound and outbound message, tagged with channel (WhatsApp, Instagram, etc.), direction, timestamp, and template/content reference used.
- **Tasks** — pending human actions generated by the system (e.g., "Call Rahul," "Review payment," "Approve scholarship").
- **Calendar** — all scheduled calls/meetings/demos linked to the lead, admin availability, reminders.
- **Timeline** — the immutable chronological event log for the lead (see Engine 5, Section 8.5) — this is what every automation reads before acting.
- **Analytics** — real-time rollups both per-lead and system-wide (see Engine 9, Section 8.9).

**Key principle:** every future automation decision reads from the Timeline before acting. No engine acts blindly — it always checks "what has already happened to this lead" first (see Follow-up Engine "Evaluate Situation" pattern, Section 8.6).

---

## 5. Input Streams

A lead can enter the system from any of the following channels. **Regardless of source, every enquiry follows the exact same underlying workflow** — the input channel only affects *how* the enquiry is captured and *which* output channel is used to respond (Section 6).

### 5.1 Digital Channels
- WhatsApp
- Website Contact Form
- Website Chat Widget
- Instagram Direct Messages
- Facebook Messenger
- Google Business Profile
- Email

---

## 6. Output Streams

### 6.1 Governing Rule

**The system should always respond through the one common channel regardless of the input streams.** 

### 6.2 Internal Output Streams

Beyond lead-facing communication, the system must also communicate internally, continuously, in real time.

**Admin Dashboard (internal):**
- New Lead
- Lead Assigned
- Follow-up Due
- Call Scheduled
- Meeting Scheduled
- Admission Completed
- Payment Pending
- Lost Lead
- Escalation

**Notification System (internal), delivered via:**
- Dashboard
- WhatsApp
- Email
- Push Notifications
- Slack (optional)

**Reports (internal), generated on a schedule:**
- Daily Reports
- Weekly Reports
- Monthly Reports
- Performance Reports
- Lead Reports
- Admission Reports
- Revenue Reports
- Source Reports

---

## 7. Communication Rule

**The system must never generate free-form / random AI-generated responses.** Every single outbound message must be composed exclusively from one of the following approved content sources:

1. Pre-approved Message Templates
2. Course Documents
3. Brochures
4. Fee Structures
5. Admission Information
6. Contact Information
7. Calendar Invitations
8. Meeting Confirmations
9. Reminder Messages

The system's job is to **select** the correct pre-approved content for the situation — never to **invent** content. This constraint is what makes the system auditable, safe, and compliant, and is why so much of the "documents to prepare" work (Section 10) exists: the system is only as good as the completeness of this pre-approved library.

---

## 8. The 11 Core Engines — Detailed Specification

The entire platform is decomposed into 11 engines. Every new feature request should be mapped to exactly one (or a coordination of a few) of these engines rather than becoming an isolated, one-off module. This is what keeps the system easy to design, build, test, and scale as it grows.

### 8.1 Engine 1 — Lead Capture Engine

**Purpose:** Capture every enquiry, regardless of source, and turn it into a fully-formed, workflow-ready Lead record.

**Inputs:** Website, WhatsApp, Instagram, Facebook, Google Business, Phone, Walk-in, Email, Referral (see Section 5 for full list).

**Responsibilities:**
- Capture enquiry
- Identify source
- Validate information
- Generate Lead ID
- Save metadata
- Store timestamp
- Store contact details
- Store initial enquiry content
- Detect enquiry category (e.g., fee enquiry, course enquiry, general enquiry)
- Create Lead record
- Create Timeline (initialize the event log)
- Initialize Workflow (put the lead into its first state)
- Trigger downstream events

**Outputs:**
- Lead Created (event)
- Timeline Created
- Workflow Created
- Admin Notification
- Dashboard Updated

### 8.2 Engine 2 — Response Template Engine

**Purpose:** Provide the correct information back to the lead — **without AI**. This is a deterministic template/content-selection engine, not a conversational generator.

**Responsibilities:**
- Select the correct response template based on detected enquiry category
- Attach brochures
- Attach fee documents
- Attach course documents
- Attach location details
- Attach admission documents
- Send acknowledgement message
- Maintain template versions (so old vs. new brochures/fees don't get mixed up)
- Support multilingual templates

**Dependencies:** Message Template Library, Document Repository, Course Repository (see Section 10).

**Example category → content mapping:**

| Enquiry Category | Content Sent |
|---|---|
| Fee enquiry | Fee PDF, Brochure, Fee Structure, Acknowledgement |
| Location enquiry | Google Maps link, Address, Phone, Timings |
| General enquiry | Institution Brochure, Courses, Faculty, Contact Number |

No intelligence is required for this mapping — it is a lookup table, not a reasoning task.

### 8.3 Engine 3 — Workflow Engine ⭐

**Purpose:** This is the heart of the platform. Every lead owns exactly one active workflow, and this engine is what advances that workflow through its states.

**Responsibilities:**
- Lead state management
- Workflow state management
- Decision logic (what should happen next, given the current state and latest event)
- Workflow progression (move the lead forward)
- Workflow completion (reach a terminal state)
- Workflow cancellation (stop a workflow, e.g., lead unsubscribes)
- Workflow recovery (restart/re-engage a stalled workflow)

**States (canonical list — matches Section 3.2):** New, Information Shared, Waiting, Interested, Call Scheduled, Meeting Scheduled, Demo, Admission Pending, Admitted, Inactive, Recovery, Closed.

**Example workflow instance (illustrative):**
```
Workflow
   ↓
Wait 2 Hours
   ↓
Check Reply
   ↓
No Reply?
   ↓
Send Follow-up
   ↓
Wait 24 Hours
   ↓
Still No Reply?
   ↓
Notify Admin
   ↓
Recovery
```
The system is, at any given moment, maintaining hundreds (eventually thousands) of these workflow instances simultaneously — this is the scaling challenge the rest of the architecture (Section 9) is designed to solve.

### 8.4 Engine 4 — Scheduler Engine

**Purpose:** Execute future actions automatically. "The system should schedule itself" (Section 2.3) is implemented here. This is not limited to meeting scheduling — it schedules **any** future action.

**Responsibilities:**
- Schedule follow-ups
- Schedule calls
- Schedule meetings
- Schedule reminders
- Schedule escalations
- Schedule reports
- Cancel scheduled jobs
- Reschedule tasks
- Retry failed jobs
- Maintain the job queue

**Examples:**
```
Lead Created → Scheduler → Wait 2 Hours → Check Reply
Call Completed → Scheduler → Tomorrow → Feedback Message
Demo Completed → Scheduler → 6 PM → Follow-up
```
Everything that happens later is represented as a scheduled job — nothing is left to human memory.

### 8.5 Engine 5 — Conversation Timeline Engine

**Purpose:** Maintain the complete, chronological history of every interaction with a lead. This is explicitly **not AI** — it is simply structured memory.

**Responsibilities:**
- Log every message
- Log every document shared
- Log every call
- Log every meeting
- Log workflow transitions
- Log notifications
- Log admin actions
- Generate the timeline view
- Support auditing

**Example timeline for a lead ("Rahul"):**
```
10:05 — Asked Fee
10:06 — Fee PDF Sent
10:07 — Brochure Sent
10:30 — Asked About Hostel
10:31 — Hostel PDF Sent
11:00 — Requested Call
```
Every future automation decision reads this timeline before acting — it is the single source of truth for "what has already happened," and it is what allows the Follow-up Engine (8.6) to avoid duplicate or irrelevant actions.

### 8.6 Engine 6 — Follow-up Engine

**Purpose:** Ensure that no lead is ever silently forgotten — but do so intelligently, not blindly.

**Critical design correction (from source discussion):** Do **not** implement follow-up logic as a naive timer:
```
After 2 hours → Send Follow-up   ✗ (wrong — naive)
```
Instead, implement it as an **evaluation** step:
```
After 2 hours → Evaluate Situation
   → Has replied?      YES → Cancel Follow-up
                        NO  → Send Follow-up #1
   → Has admin already called?   YES → Cancel
   → Lead already admitted?      YES → Cancel Everything
```
**Responsibilities:**
- Monitor inactivity
- Evaluate lead status before every scheduled action fires (re-check relevance)
- Select the correct follow-up template for the current stage
- Send follow-up
- Cancel follow-ups that are no longer relevant
- Create recovery workflows for stalled/uninterested leads
- Stop all workflows immediately after admission
- Track follow-up effectiveness (for the Analytics Engine)

**Design principle:** every scheduled action must first check whether it is still relevant before executing. This single rule prevents the single most common failure mode of naive automation systems: sending a "please reply" follow-up to someone who already replied, was already called, or already enrolled.

### 8.7 Engine 7 — Call & Meeting Coordination Engine ⭐⭐⭐

**Purpose:** Coordinate all human-to-human communication (calls, meetings, demos) between leads and admins/counselors. This is called out as something most CRMs handle poorly, and is therefore a key differentiator.

**Responsibilities:**
- Meeting scheduling
- Call scheduling
- Availability management (checking admin calendars)
- Rescheduling
- Calendar integration
- Reminder generation (to both lead and admin)
- Missed call handling
- Meeting completion tracking
- Feedback collection

**Happy path example:**
```
Lead: "I want to talk."
   ↓
System checks admin availability
   ↓
Suggests slots
   ↓
Books slot
   ↓
Calendar updated
   ↓
Reminder to admin
   ↓
Reminder to lead
   ↓
Meeting starts → Meeting ends
   ↓
Ask Feedback
   ↓
Update CRM/records
```

**Missed-call / failure path example:**
```
Admin missed the call
   ↓
Detect missed call
   ↓
Notify Admin
   ↓
Apologize to Lead (via approved template — see Section 7)
   ↓
Offer New Slots
   ↓
Reschedule
   ↓
Update Calendar
   ↓
Notify Everyone
```
The admin should never have to personally remember or manually recover from a missed meeting — the engine detects and resolves it automatically.

### 8.8 Engine 8 — Notification Engine

**Purpose:** Notify administrators about important events, via an event-driven publish model rather than every engine independently deciding to notify someone.

**Design principle:** Every engine simply **emits events**. The Notification Engine is the only thing that decides who gets notified, through which channel, and with what urgency. No other engine sends notifications directly.

**Responsibilities:**
- New Lead notification
- Reminder notification
- Meeting notification
- Follow-up notification
- Escalation notification
- Admission notification
- Daily summary
- Weekly summary
- Critical alerts
- Respecting per-admin notification preferences

**Examples:**
```
Lead Created → Event → Notification Engine decides → Notify Admin
Call Missed → Event → Notify Admin
Lead Waiting (too long) → Event → Notify Admin
```

### 8.9 Engine 9 — Analytics Engine

**Purpose:** Generate operational insight — computed continuously, in real time, as a **side-effect** of workflow events, never as a slow batch job computed later. this is the one which is connecting to the admin crm.

**Responsibilities:**
- Lead analytics
- Source analytics
- Course analytics
- Conversion analytics
- Admission analytics
- Response time analytics
- Follow-up analytics
- Performance analytics
- Revenue analytics
- Dashboard metrics
- Trend analysis
- Export reports

**Examples:**
```
Lead Created         → Analytics Updated
Lead Interested       → Conversion Updated
Action taken by other engine           →  Update crm
```
Nothing is calculated later in a nightly batch job — every event updates analytics immediately.

### 8.10 Engine 10 — Recommendation Engine (Next Best Action)

**Purpose:** Replace passive reminders with active, prioritized recommendations. This is the one place where "smarter" reasoning (potentially AI-assisted) can add real value, though the underlying data (urgency, wait time, interest signals) is deterministic.

**Responsibilities:**
- Evaluate lead condition
- Recommend the specific next admin action
- Prioritize leads relative to each other
- Calculate urgency scores
- Suggest calls
- Suggest meetings
- Suggest follow-ups
- Suggest recovery actions
- Rank the admin's pending task list

**Example — instead of a plain reminder:**
```
Reminder: "Call Rahul"                              ✗ (plain, low-context)
```
**the system produces:**
```
Recommended Next Action
Rahul — Waiting 23 hours — High Interest
→ Call Immediately                                   ✓ (contextual, prioritized)
```
This reframing (from "reminder" to "recommendation with justification") is a deliberate product decision — it feels substantially smarter to the admin using the dashboard even though the underlying computation is rule-based prioritization.

### 8.11 Engine 11 — Automation Orchestrator Engine (the central brain)

**Purpose:** Serve as the central brain of the entire platform. This is not "an AI brain" — it is an **automation brain**: a continuously running coordination process that evaluates every active workflow and ensures every engine is invoked correctly, in the correct order, without duplication.

**The problem it exists to solve:** with (eventually) hundreds or thousands of leads, each with its own timers, follow-ups, meetings, reminders, waiting periods, documents, and notifications — something has to be the single authority asking, for every lead, on an ongoing basis:

```
Is a follow-up due?
   ↓
Is the lead still active?
   ↓
Has the lead replied?
   ↓
Has the admin already contacted them?
   ↓
Is there a meeting scheduled?
   ↓
Was the meeting completed?
   ↓
Should the workflow continue?
   ↓
Should it pause?
   ↓
Should it cancel?
   ↓
Should it escalate?
```

**Full responsibility list:**
- Receive events
- Coordinate engines
- Execute automation rules
- Evaluate workflow conditions
- Manage timers
- Trigger follow-ups
- Cancel obsolete jobs
- Handle exceptions
- Pause workflows
- Resume workflows
- Escalate delays
- Synchronize the CRM/data layer
- Maintain workflow consistency
- Prevent duplicate actions
- Monitor engine health
- Retry failed operations
- Generate system events

**Canonical end-to-end example:**
```
New Lead Created
   ↓
Create Lead
   ↓
Initialize Timeline
   ↓
Select Template
   ↓
Send Documents
   ↓
Create Follow-up
   ↓
Schedule Review
   ↓
Notify Admin
   ↓
Update Dashboard
   ↓
Wait for Next Event
```

See Section 9 for the detailed *how* — specifically, why the Orchestrator must not call every engine sequentially, and how it should instead use a decision/dispatch split with parallel execution.

---

## 9. Orchestration & Execution Architecture

This section captures the critical distinction between a **naive** orchestrator (which would be slow and would not scale) and a **production-grade** orchestrator (event-driven, parallelized where possible, sequential only where a true dependency exists).

### 9.1 The Naive (Wrong) Approach

If the Orchestrator called every engine one after another, sequentially, purely for illustration:
```
New Inquiry
   ↓
Lead Engine        (300ms)
   ↓
Timeline Engine     (200ms)
   ↓
Response Engine     (500ms)
   ↓
Notification Engine (200ms)
   ↓
Analytics Engine     (300ms)
   ↓
Scheduler Engine     (200ms)

Total ≈ 1.7 seconds — and that's the optimistic case where nothing is slow.
```
This does not scale, and most of these steps do not actually need to wait for each other.

### 9.2 Step 1 — Identify What Must Happen First (Mandatory Ordering)

Some actions are genuinely dependent on others. The clearest example: everything downstream needs the Lead ID, so **Lead creation is always the mandatory first step.**
```
New Inquiry → Create Lead
```
Only after the Lead ID exists can any other engine act on that lead.

### 9.3 Step 2 — Run Independent Tasks in Parallel

Once the Lead ID exists, several engines have **no dependency on each other** and should run concurrently:
```
                Lead Created
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 Timeline        Analytics      Notification
      │
      ▼
 Response Engine
      │
      ▼
 Scheduler
```
Timeline, Analytics, and Notification are independent of one another and can all fire simultaneously.

### 9.4 Step 3 — Build It Event-Driven, Not Call-and-Wait

Naive (call-and-wait) pattern to avoid:
```
Orchestrator → Call Engine A → Wait → Call Engine B → Wait → Call Engine C → Wait
```
Correct (event-driven) pattern:
```
Lead Created Event
   ↓
Publish Event
        ┌────────────┬─────────────┬──────────────┐
        ▼            ▼             ▼
   Timeline      Analytics     Notification
```
The Orchestrator publishes an event once. Every engine that cares about that event begins working immediately, with no explicit waiting from the Orchestrator's side.

### 9.5 Step 4 — Only Coordinate Work That Has a Real Dependency

Some sequences are genuinely dependent and must remain sequential. Example:
```
Lead Created
   ↓
Response Engine
   ↓
Message Sent (confirmed)
   ↓
Schedule Follow-up
```
The Scheduler must only create the follow-up job **after** the Response Engine confirms the message was actually sent — that dependency is real and must be preserved, unlike the parallelizable trio above.

### 9.6 Recommended Architectural Split: Decision Engine + Dispatcher

Rather than having the Orchestrator directly call every engine itself, split its responsibility in two:

**1. Decision maker** — decides *what happened* and *what should happen next*.
```
New Lead
   ↓
Needs:
  - Timeline
  - Analytics
  - Notification
  - Response
```

**2. Dispatcher** — launches all independent work concurrently.
```
Decision:
   Run [Timeline, Analytics, Notification] IN PARALLEL
   ↓
   Wait for completion
   ↓
   Now run Response
   ↓
   After success
   ↓
   Schedule Follow-up
```

### 9.7 Implementation Guidance (Current Scale)

- If the stack is NestJS (or similar), **do not** make synchronous HTTP calls between the platform's own internal engines/services. Keep engines as services within the same application and execute independent work concurrently, e.g.:
```js
await Promise.all([
  timelineEngine.log(...),
  analyticsEngine.record(...),
  notificationEngine.notify(...)
]);
```
- Only `await` sequentially when there is a genuine dependency (as in Section 9.5).

### 9.8 Future Scale-Out Path (Not Needed Yet)

When the platform grows to tens of thousands of leads across many institutions, migrate to a message broker — Redis (BullMQ), RabbitMQ, or Google Pub/Sub. At that point, the Orchestrator publishes events and independent worker processes consume them. **For PERC today, this would be unnecessary complexity** — the in-process `Promise.all` pattern is sufficient and should not be over-engineered prematurely.

### 9.9 Target Architecture Diagram

```
                 Automation Orchestrator
                         │
                  Decision Layer
                         │
          ┌──────────────┴──────────────┐
          │                              │
   Parallel Tasks                  Sequential Tasks
          │                              │
     Timeline                       Response
     Analytics                          │
     Notifications                      ▼
     Dashboard                  Schedule Follow-up
```

### 9.10 Guiding Design Principle

**The Orchestrator should coordinate, not block.** As soon as it has enough information to trigger independent engines, it should let them run in parallel and synchronize only where business rules genuinely require ordering. This is the standard pattern used in high-performance workflow systems, and it gives the best of both worlds:
- **Low latency**, by parallelizing all independent work.
- **Correctness**, by strictly preserving execution order only where a real dependency exists.

---

## 10. Documents & Knowledge Assets to Prepare Before Development

The automation engine is only as good as the structured content it has to select from (see Section 7 — Communication Rule). Before implementation begins, PERC must prepare the following 17 knowledge assets. These are **content/business deliverables**, not code, and can be prepared in parallel with early technical work.

### 10.1 Message Template Library ⭐ (the single most important document)

Must contain a ready-made, pre-approved template for every scenario the system will encounter, including at minimum:
- Welcome Message
- General Enquiry
- Course Enquiry
- Fee Enquiry
- Scholarship Enquiry
- Branch Enquiry
- Faculty Enquiry
- Hostel Enquiry
- Admission Process
- Documents Required
- Demo Class Invitation
- Meeting Confirmation
- Follow-up 1
- Follow-up 2
- Follow-up 3
- Recovery Message
- Admission Confirmation
- Payment Reminder
- Welcome Student
- Thank You Message

### 10.2 FAQ Response Library

Standardized answers to frequently asked questions, at minimum:
- What courses do you offer?
- What are your fees?
- What are your timings?
- Which branch is nearest?
- Do you provide study materials?
- Do you provide hostel?
- Is transportation available?
- What are the scholarship criteria?
- How can I contact faculty?
- What is your admission process?

### 10.3 Course Information Repository

For **every** course offered, capture:
- Course Name
- Description
- Duration
- Eligibility
- Subjects
- Curriculum
- Learning Outcomes
- Batch Timings
- Faculty
- Course Brochure
- Course PDF

### 10.4 Fee Repository

For **every** course, capture:
- Fee Structure
- Installment Options
- Scholarship Information
- Discounts
- Refund Policy
- Payment Methods

### 10.5 Branch Repository

For **every** branch/location, capture:
- Address
- Google Maps Link
- Contact Number
- Working Hours
- Branch Manager
- Parking Information
- Nearby Landmarks

### 10.6 Admission Process Document

The canonical step-by-step admission flow:
```
Enquiry
   ↓
Counselling
   ↓
Demo Class
   ↓
Admission Form
   ↓
Document Verification
   ↓
Fee Payment
   ↓
Student Registration
   ↓
Batch Allocation
   ↓
Welcome
```

### 10.7 Brochure Library

Maintain the current, versioned set, including at minimum:
- Institution Brochure
- JEE Brochure
- NEET Brochure
- School Tuition Brochure
- Foundation Courses
- Scholarship Programs

### 10.8 Follow-up Template Library

Distinct templates for each stage of non-response and re-engagement:
- No Reply after 2 Hours
- No Reply after 1 Day
- No Reply after 3 Days
- Demo Reminder
- Call Reminder
- Meeting Reminder
- Admission Reminder
- Payment Reminder
- Recovery Campaign

### 10.9 Notification Templates

Internal admin-facing notification copy for:
- New Lead Created
- Follow-up Due
- Call Scheduled
- Meeting Missed
- Admission Completed
- Payment Pending
- Lead Lost
- Lead Recovered

### 10.10 Meeting Templates

- Call confirmation
- Meeting invitation
- Reschedule confirmation
- Cancellation notice
- Demo invitation
- Demo reminder

### 10.11 Calendar Rules

- Working hours
- Meeting duration
- Buffer time
- Holiday calendar
- Maximum meetings/day
- Rescheduling rules

### 10.12 Automation Rules

The explicit business rules that govern every workflow, at minimum:
- Follow up after 2 hours
- Cancel follow-up if lead replies
- Escalate after 24 hours
- Send reminder before meetings
- Stop workflow after admission
- Restart workflow for recovered leads

### 10.13 Lead Status Definitions

See Section 3.2 (canonical pipeline stages) — this document formalizes those definitions for engineering and business alignment.

### 10.14 Lead Classification Rules

Categories used for prioritization and routing:
- Hot Lead
- Warm Lead
- Cold Lead
- Returning Lead
- Referral Lead
- High Priority
- Scholarship Candidate
- VIP Lead

### 10.15 Analytics Dictionary

Every metric must be formally defined (units, calculation method, refresh frequency), at minimum:
- Total Leads
- Leads by Source
- Leads by Course
- Conversion Rate
- Average Response Time
- Average Admission Time
- Demo Conversion
- Follow-up Success Rate
- Lost Lead Percentage
- Revenue
- Most Popular Course
- Peak Enquiry Time

### 10.16 Activity Timeline Events

The canonical, fixed vocabulary of events that get logged (this is the controlled vocabulary the Timeline Engine, Section 8.5, writes and everything else reads):
- Lead Created
- Brochure Sent
- Fee Structure Sent
- Course Details Sent
- Reply Received
- Call Scheduled
- Meeting Scheduled
- Meeting Completed
- Demo Completed
- Admission Confirmed
- Payment Received
- Workflow Closed

### 10.17 System Configuration

Business-level settings that must be configurable without a code change:
- Working hours
- Office holidays
- Auto-response enable/disable
- Follow-up timings
- Escalation timings
- Default meeting duration
- Notification preferences

**Additional technical deliverables for Phase 0** (see Section 14.1): Business Process Mapping, Workflow Definitions, Lead Lifecycle Definition, Automation Catalog, CRM Schema, Database Design, API Contracts.

---

## 11. Lead Status & Classification Definitions

### 11.1 Pipeline Stages (repeated here for reference — see Section 3.2 for full detail)

New → Information Shared → Waiting for Response → Interested → Call Scheduled → Meeting Completed → Demo Scheduled → Admission Pending → Admitted → Inactive → Recovery → Lost → Closed

### 11.2 Classification Tags (orthogonal to pipeline stage — a lead can carry one or more of these at any stage)

- Hot Lead
- Warm Lead
- Cold Lead
- Returning Lead
- Referral Lead
- High Priority
- Scholarship Candidate
- VIP Lead

---

## 12. Admin Dashboard Specification

The dashboard must not merely **display** data — it must function as an **operational control center** that the admin uses to act, not just observe.

### 12.1 Modules

- Lead Overview
- Today's Tasks
- Today's Calls
- Upcoming Meetings
- Pending Follow-ups
- High Priority Leads
- Recent Activities
- Recommendations (fed by Engine 10, Section 8.10)
- Notifications (fed by Engine 8, Section 8.8)
- Performance
- Analytics (fed by Engine 9, Section 8.9)
- Calendar
- Workflow Monitor (a live view into the Automation Orchestrator's current state, Section 8.11)

### 12.2 Internal Notifications the Dashboard Must Surface

(cross-referenced from Section 6.3): New Lead, Lead Assigned, Follow-up Due, Call Scheduled, Meeting Scheduled, Admission Completed, Payment Pending, Lost Lead, Escalation.

---

## 13. System Configuration

Business-controlled settings (should be editable by an admin without requiring a code deployment):
- Working hours
- Office holidays
- Auto-response enable/disable
- Follow-up timings
- Escalation timings
- Default meeting duration
- Notification preferences
- Calendar rules (working hours, meeting duration, buffer time, holiday calendar, max meetings/day, rescheduling rules — Section 10.11)

---

## 14. Success Criteria

The system is considered successful when **all** of the following are true:

- Every enquiry is automatically converted into a tracked lead.
- Every lead follows a predefined workflow.
- No follow-up is ever missed.
- Every admin action is guided by a system recommendation.
- Communication is fully standardized using approved templates (no free-form AI replies — Section 7).
- All interactions are logged and auditable (Timeline Engine, Section 8.5).
- Reports and dashboards update automatically, in real time (Analytics Engine, Section 8.9).
- Manual operational effort is significantly reduced.
- The admin's job is reduced to counseling, decision-making, and admissions — the system absorbs all repetitive operational work.


*End of Master Document. This document consolidates all architecture, engine, workflow, and implementation discussions to date. Per the request, this has intentionally not been condensed — every mechanism, example, and diagram from the source discussions is preserved in full. This master file can be split into separate per-engine or per-phase files as the next step, if desired.*
