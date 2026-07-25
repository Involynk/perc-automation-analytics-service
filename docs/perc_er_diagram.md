# PERC Admission Operations Engine — Entity Relationship Diagram

## Visual Legend

```
Entity Box:  ┌────────────┐     Relationship:  ──||──  = One
             │  Entity    │                   ── o{── = Many
             │ ────────   │
             │ attr1      │     Example:  Lead ||──o{ Message
             │ attr2      │     Means:  One Lead has many Messages
             └────────────┘
```

---

## 1. Core Entity — Lead (Aggregate Root)

```
┌─────────────────────────────────────────────────┐
│                    LEAD                          │
├─────────────────────────────────────────────────┤
│  PK  id                UUID                      │
│      first_name        String                    │
│      last_name         String                    │
│      phone             String                    │
│      email             String                    │
│      source            String (whatsapp, web..)  │
│      category          String (fee, course...)   │
│      status            String (new..closed)      │
│      classification    String (hot, warm, cold)  │
│  FK  assigned_to       UUID → users             │
│      last_contacted_at DateTime                  │
│      is_active         Boolean                   │
│      created_at        DateTime                  │
└─────────────────────────────────────────────────┘
         │
         │  ┌──────────────────────┬──────────────────────┐
         │  │                      │                      │
         ▼  ▼                      ▼                      ▼
   ┌───────────┐           ┌──────────────┐       ┌──────────────┐
   │ WORKFLOW  │           │ CONVERSATION │       │ ADMISSION    │
   │ (1 only)  │           │ (per channel)│       │ (1 only)     │
   └───────────┘           └──────┬───────┘       └──────┬───────┘
         │                        │                      │
         ▼                        ▼                      ▼
   ┌───────────┐           ┌──────────────┐       ┌──────────────┐
   │ WORKFLOW  │           │   MESSAGE    │       │   STUDENT    │
   │ HISTORY   │           │ (in/outbound)│       │ (post-adm)   │
   └───────────┘           └──────┬───────┘       └──────────────┘
         │                        │
         ▼                        ▼
   ┌───────────┐           ┌──────────────┐
   │  PROMISE  │           │   ATTACHMENT │
   │ (sched.)  │           │  (pdf, img)  │
   └─────┬─────┘           └──────────────┘
         │
         ▼
   ┌───────────┐
   │ PROMISE   │
   │ EXECUTION │
   └───────────┘
```

---

## 2. Full Entity Map

### Core Lead Entities

```
leads ──||──o{ lead_courses : "interested in"
courses ──||──o{ lead_courses : "enrolled in"

leads ──||──o{ lead_tags : "classified as"
tags ──||──o{ lead_tags : "tagged to"

leads ──||──o{ timeline_events : "history of"
event_types ──||──o{ timeline_events : "categorized as"
```

### Communication Module

```
leads ──||──o{ conversations : "communicates through"
channels ──||──o{ conversations : "hosted on"

conversations ──||──o{ messages : "contains"
leads ──||──o{ messages : "sends/receives"
messages ──||──o{ message_attachments : "attaches files"

templates ──||──o{ messages : "used by"
channels ──||──o{ templates : "delivered on"
```

### Workflow Module

```
leads ──||──|| workflow_instances : "one active per lead"

workflow_instances ──||──o{ workflow_history : "state changes"
workflow_instances ──||──o{ promises : "schedules future"
workflow_instances ──||──o{ tasks : "generates todos"
workflow_instances ──||──o{ analytics_events : "emits metrics"

promises ──||──o{ promise_executions : "execution log"
```

### People & Actions Module

```
users ──||──o{ leads : "assigned to"
users ──||──o{ tasks : "responsible for"
users ──||──o{ meetings : "organizes"
users ──||──o{ notifications : "receives"
users ──||──o{ audit_logs : "performed by"

leads ──||──o{ tasks : "needs action on"
leads ──||──o{ meetings : "attends"
leads ──||──o{ notifications : "triggers alerts for"
leads ──||──o{ analytics_events : "generates data about"
```

### Admission Module

```
leads ──||──o{ admissions : "converts to enrollment"
admissions ──||──|| students : "produces one student"
students ──||──|| admissions : "belongs to one admission"
courses ──||──o{ admissions : "targets course"
courses ──||──o{ students : "studies course"
```

---

## 3. Entity-Attribute Details

### leads

| Column         | Type    | Description                                                                                                                                                                                |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id             | UUID PK | Unique identifier                                                                                                                                                                          |
| first_name     | String  | Lead's first name                                                                                                                                                                          |
| last_name      | String  | Lead's last name                                                                                                                                                                           |
| phone          | String  | Contact number                                                                                                                                                                             |
| email          | String  | Email address                                                                                                                                                                              |
| source         | String  | Input channel (whatsapp, instagram, website_form, etc.)                                                                                                                                    |
| category       | String  | Enquiry type (fee, course, general, etc.)                                                                                                                                                  |
| status         | String  | Pipeline stage: new → information_shared → waiting → interested → call_scheduled → meeting_completed → demo_scheduled → admission_pending → admitted → inactive → recovery → lost → closed |
| classification | String  | Hot, warm, cold, returning, referral, high_priority, scholarship_candidate, vip                                                                                                            |
| assigned_to    | UUID FK | Counselor/admin handling this lead                                                                                                                                                         |
| metadata       | JSON    | Flexible extra data                                                                                                                                                                        |

### users

| Column                   | Type    | Description                                     |
| ------------------------ | ------- | ----------------------------------------------- |
| id                       | UUID PK | Unique identifier                               |
| email                    | String  | Login email                                     |
| name                     | String  | Display name                                    |
| role                     | String  | super_admin, admin, counselor, teacher, student |
| phone                    | String  | Contact number                                  |
| notification_preferences | JSON    | Per-channel notification settings               |

### messages

| Column          | Type     | Description                                   |
| --------------- | -------- | --------------------------------------------- |
| id              | UUID PK  | Unique identifier                             |
| conversation_id | UUID FK  | Parent conversation                           |
| lead_id         | UUID FK  | Parent lead                                   |
| direction       | String   | inbound (from lead) or outbound (to lead)     |
| content_type    | String   | text, image, document, video, audio, template |
| content         | String   | Message body or URL                           |
| template_id     | UUID FK  | Which template was used (for outbound)        |
| sent_at         | DateTime | When message was sent                         |

### workflow_instances

| Column         | Type             | Description                          |
| -------------- | ---------------- | ------------------------------------ |
| id             | UUID PK          | Unique identifier                    |
| lead_id        | UUID FK (unique) | One workflow per lead enforced       |
| current_state  | String           | Current pipeline stage               |
| previous_state | String           | Previous stage for rollback tracking |
| is_paused      | Boolean          | Whether workflow is paused           |
| is_completed   | Boolean          | Whether workflow terminated          |

### promises

| Column             | Type     | Description                                                                                 |
| ------------------ | -------- | ------------------------------------------------------------------------------------------- |
| id                 | UUID PK  | Unique identifier                                                                           |
| lead_id            | UUID FK  | Parent lead                                                                                 |
| promise_type       | String   | followup, reminder, escalation, report, message_delay, meeting_reminder, recovery, feedback |
| status             | String   | pending, executing, completed, failed, cancelled                                            |
| scheduled_at       | DateTime | When to execute                                                                             |
| payload            | JSON     | What action to perform                                                                      |
| is_recurring       | Boolean  | Whether it repeats                                                                          |
| recurring_interval | String   | e.g. "1 day", "2 hours"                                                                     |

### timeline_events

| Column        | Type     | Description                     |
| ------------- | -------- | ------------------------------- |
| id            | UUID PK  | Unique identifier               |
| lead_id       | UUID FK  | Parent lead                     |
| event_type_id | UUID FK  | Type of event                   |
| actor_type    | String   | system, admin, lead, automation |
| description   | String   | Human-readable event summary    |
| created_at    | DateTime | Immutable timestamp             |

---

## 4. Domain-to-Table Mapping

| Domain          | Tables                                                 | Engine                             |
| --------------- | ------------------------------------------------------ | ---------------------------------- |
| Lead Management | leads, lead_courses, tags, lead_tags                   | Lead Capture Engine                |
| Communication   | channels, conversations, messages, message_attachments | Response Template Engine           |
| Knowledge       | templates, faqs, branches, documents                   | Response Template Engine           |
| Workflow        | workflow_instances, workflow_history                   | Workflow Engine                    |
| Scheduling      | promises, promise_executions                           | Scheduler / Promise Engine         |
| Timeline        | event_types, timeline_events                           | Conversation Timeline Engine       |
| Tasks           | tasks                                                  | Follow-up Engine                   |
| Meetings        | meetings                                               | Call & Meeting Coordination Engine |
| Notifications   | notifications                                          | Notification Engine                |
| Analytics       | analytics_events                                       | Analytics Engine                   |
| Admissions      | admissions, students                                   | Admission Engine                   |
| System          | users, settings, audit_logs                            | Automation Orchestrator            |
| Automation      | automation_rules                                       | Automation Orchestrator            |

---

## 5. Relationship Summary

```
One-to-One (1:1):
  lead → workflow_instance        (one active workflow per lead)
  lead → admission                (one admission per lead)
  lead → student                  (one student record per lead)

One-to-Many (1:N):
  lead → conversation             (one lead, many channel conversations)
  lead → message                  (one lead, many messages)
  lead → timeline_event           (one lead, many timeline entries)
  lead → promise                  (one lead, many scheduled actions)
  lead → task                     (one lead, many pending tasks)
  lead → meeting                  (one lead, many meetings)
  lead → notification             (one lead, many alerts)
  lead → analytics_event          (one lead, many data points)
  user → lead                     (one user, many assigned leads)
  user → task                     (one user, many assigned tasks)
  conversation → message          (one conversation, many messages)
  message → attachment            (one message, many attachments)
  workflow → workflow_history     (one workflow, many state changes)
  workflow → promise              (one workflow, many promises)
  promise → promise_execution     (one promise, many executions)
  course → lead_course            (one course, many lead interests)
  channel → conversation          (one channel, many conversations)

Many-to-One (N:1):
  messages → template             (many messages use one template)
  timeline_events → event_type    (many events share one type)
  admins → notification           (many notifications target one user)
```
