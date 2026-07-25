# Code File Status Registry

This document lists every code file in the repository, its role, exports, dependencies, and current status.

---

## Root Configurations & Scripts

| File Path            | Status | Purpose / Description                                      | Key Dependencies / Exports                                 |
| -------------------- | ------ | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `package.json`       | Active | Workspace definition (`packages/*`), build & start scripts | NestJS 11, Supabase (`@supabase/supabase-js`), RxJS, axios    |
| `.env`               | Active | Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`) | Live project credentials |
| `nest-cli.json`      | Active | NestJS CLI monorepo setup mapping projects                 | `api-gateway`, `communication-service`, `workflow-service` |
| `tsconfig.base.json` | Active | Base TypeScript compiler options                           | ES2022, target ES2021, decorator flags                     |
| `tsconfig.json`      | Active | Root TypeScript entry referencing base config              | Extends `tsconfig.base.json`                               |
| `docker-compose.yml` | Active | Container orchestrator mapping ports 3000, 3001, 3002      | `api-gateway`, `communication-service`, `workflow-service` |

---

## 1. `packages/shared` (Shared Library)

| File Path              | Status | Purpose / Description                                               | Key Exports                                                                                      |
| ---------------------- | ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/index.ts`         | Active | Main barrel export file for shared package                          | Export all from entities, enums, interfaces, constants, supabase client, database-seed           |
| `src/enums.ts`         | Active | Master enumerations for channel, lead state, workflow, promises     | `ChannelType`, `LeadStatus`, `WorkflowState`, `PromiseType`, `PromiseStatus`, `NotificationType` |
| `src/interfaces.ts`    | Active | TypeScript interfaces for lead capture payload & category maps      | `LeadCapturePayload`, `CategoryResult`, `SendMessagePayload`                                     |
| `src/constants.ts`     | Active | Constants for system messages, category keywords, defaults          | `CATEGORY_KEYWORDS`, `CATEGORY_MESSAGES`, `DEFAULT_SYSTEM_SETTINGS`                              |
| `src/supabase.ts`      | Active | Supabase client singleton (`@supabase/supabase-js`) using service-role key | `getSupabaseClient()`                                                                      |
| `src/database-seed.ts` | Active | Database seeder populating channels, event types, settings via Supabase | `seedDatabase(supabase: SupabaseClient)`                                                     |

### Shared Entities (`packages/shared/src/entities/`) — Plain TypeScript interfaces

| File Path                | Status | Interface(s)                        | Table Name                               | Purpose                                                             |
| ------------------------ | ------ | ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `lead.entity.ts`         | Active | `Lead`                              | `leads`                                  | Lead master record (name, phone, email, source, status, categories) |
| `workflow.entity.ts`     | Active | `WorkflowInstance`, `WorkflowHistory` | `workflow_instances`, `workflow_history` | State machine tracking state, variables, state change history       |
| `promise.entity.ts`      | Active | `PromiseEntity`                     | `promises`                               | Scheduled background promises (followup, reminder, escalation)      |
| `message.entity.ts`      | Active | `Message`                           | `messages`                               | Inbound & outbound messages across all channels                     |
| `conversation.entity.ts` | Active | `Conversation`                      | `conversations`                          | Conversation thread per channel per lead                            |
| `timeline.entity.ts`     | Active | `TimelineEvent`                     | `timeline_events`                        | Immutable audit log of all system & lead actions                    |
| `notification.entity.ts` | Active | `Notification`                      | `notifications`                          | Admin notification inbox entries                                    |
| `channel.entity.ts`      | Active | `Channel`                           | `channels`                               | Registered integration channels & configuration                     |
| `event-type.entity.ts`   | Active | `EventType`                         | `event_types`                            | Master taxonomy of timeline event types                             |
| `course.entity.ts`       | Active | `Course`, `LeadCourse`              | `courses`, `lead_courses`                | Offered academic courses/programs catalog                           |
| `user.entity.ts`         | Active | `User`                              | `users`                                  | Admin & agent user accounts                                         |
| `setting.entity.ts`      | Active | `Setting`                           | `settings`                               | System-wide key-value configuration settings                        |

---

## 2. `packages/api-gateway` (Port 3000)

| File Path                              | Status | Purpose / Description                                                          | Key Components / Services                 |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------ | ----------------------------------------- |
| `src/main.ts`                          | Active | API Gateway entrypoint starting NestJS on port 3000                            | `bootstrap()`                             |
| `src/api-gateway.module.ts`            | Active | Gateway root module initializing Supabase & importing engine                   | `ApiGatewayModule`                        |
| `src/supabase/supabase.module.ts`      | Active | Global NestJS module providing `SupabaseClient` (service-role, no session) — replaces TypeORM | `SupabaseModule`, `getSupabaseClient()`   |
| `src/webhooks/webhook.controller.ts`   | Active | Handles webhook verifications & incoming payloads from WhatsApp, IG, FB, Email | `WebhookController` (`/webhooks/*`)       |
| `src/webhooks/lead.controller.ts`      | Active | REST endpoints for lead capture, list, detail, status update, timeline         | `LeadController` (`/api/leads/*`)         |
| `src/webhooks/message.controller.ts`   | Active | REST endpoints for sending & querying messages                                 | `MessageController` (`/api/messages/*`)   |
| `src/webhooks/promise.controller.ts`   | Active | REST endpoints for promises; tick composes+stores follow-up messages & timeline | `PromiseController` (`/api/promises/*`)   |
| `src/webhooks/workflow.controller.ts`  | Active | REST endpoints for inspecting and triggering state transitions                 | `WorkflowController` (`/api/workflows/*`) |
| `src/webhooks/lead.service.ts`         | Active | Core service for lead capture, phone extraction, status management             | `LeadService`                             |
| `src/webhooks/routing.service.ts`      | Active | Lead routing, category matching, composes+stores outbound replies in `messages`             | `RoutingService`                          |
| `src/webhooks/category.service.ts`     | Active | Multi-category keyword detection & message response composition (calls from routing & tick) | `CategoryService`                         |
| `src/webhooks/notification.service.ts` | Active | Admin notification dispatcher & database logger                                | `NotificationService`                     |
| `src/webhooks/engine.module.ts`        | Active | Feature module bundling services (CategoryService, RoutingService, NotificationService) — imported by ApiGatewayModule | `EngineModule`                            |

---

## 3. `packages/communication-service` (Port 3001)

| File Path                           | Status | Purpose / Description                                          | Key Components / Services                                  |
| ----------------------------------- | ------ | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/main.ts`                       | Active | Communication service entrypoint running on port 3001          | `bootstrap()`                                              |
| `src/communication.module.ts`       | Active | Module configuring communication handlers & HTTP services      | `CommunicationModule`                                      |
| `src/communication.controller.ts`   | Active | REST endpoint for sending outbound messages via target channel | `CommunicationController` (`POST /api/communication/send`) |
| `src/handlers/whatsapp.service.ts`  | Active | Outbound WhatsApp message dispatcher using WhatsApp Cloud API  | `WhatsAppService`                                          |
| `src/handlers/email.service.ts`     | Active | Outbound Email dispatcher using Nodemailer                     | `EmailService`                                             |
| `src/handlers/instagram.service.ts` | Active | Outbound Instagram message handler via Graph API               | `InstagramService`                                         |
| `src/handlers/facebook.service.ts`  | Active | Outbound Facebook Messenger handler via Graph API              | `FacebookService`                                          |

---

## 4. `packages/workflow-service` (Port 3002)

| File Path                      | Status | Purpose / Description                                           | Key Components / Services                   |
| ------------------------------ | ------ | --------------------------------------------------------------- | ------------------------------------------- |
| `src/main.ts`                  | Active | Workflow service entrypoint running on port 3002                | `bootstrap()`                               |
| `src/workflow.module.ts`       | Active | Module importing NestJS Schedule (`@nestjs/schedule`) & engines | `WorkflowModule`                            |
| `src/workflow.controller.ts`   | Active | REST controller exposing workflow health & execution endpoints  | `WorkflowServiceController`                 |
| `src/engine/routing.engine.ts` | Active | Workflow state machine engine (handles transitions & history)   | `RoutingEngine`                             |
| `src/engine/promise.engine.ts` | Active | Cron-driven scheduler running every 30s to process due promises | `PromiseEngine` (`@Cron('*/30 * * * * *')`) |

---

## 5. `web` (Frontend Widgets)

| File Path            | Status | Purpose / Description                                              | Key Components / Exports                             |
| -------------------- | ------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `web/integration.js` | Active | Embeddable client-side JavaScript chat widget for web lead capture | Client-side lead capture form & floating chat window |
