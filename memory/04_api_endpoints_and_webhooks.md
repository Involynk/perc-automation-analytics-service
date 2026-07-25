# API Endpoints & Webhooks Specification

This document contains the complete specification of all REST endpoints, webhook verification algorithms, request/response structures, and inter-service HTTP calls.

---

## 1. API Gateway Endpoints (`packages/api-gateway` — Port 3000)

### Webhook Verification & Processing Controllers (`WebhookController`)

#### 1. WhatsApp Cloud API Webhook
- **`GET /webhooks/whatsapp`**
  - **Query Params**: `hub.mode`, `hub.verify_token`, `hub.challenge`
  - **Behavior**: Compares `hub.verify_token` against `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (default: `perc_webhook_verify_2026`). Returns `hub.challenge` if valid.
- **`POST /webhooks/whatsapp`**
  - **Body**: Meta WhatsApp Cloud API payload object.
  - **Behavior**: Extracts sender phone, profile name, message text/media, calls `LeadService.captureInboundLead()`. Returns `{ status: "ok" }`.

#### 2. Instagram Messaging Webhook
- **`GET /webhooks/instagram`**
  - **Query Params**: `hub.mode`, `hub.verify_token`, `hub.challenge`
  - **Behavior**: Validates `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.
- **`POST /webhooks/instagram`**
  - **Body**: Meta Instagram webhook payload.
  - **Behavior**: Extracts Instagram IGSID, message text/attachments, calls `LeadService.captureInboundLead()`.

#### 3. Facebook Messenger Webhook
- **`GET /webhooks/facebook`** / **`POST /webhooks/facebook`**
  - **Behavior**: Same structure as Instagram/WhatsApp, handling FB Page Scoped User IDs (PSID).

#### 4. Email Inbound Webhook / Poller
- **`POST /webhooks/email/poll`**
  - **Behavior**: Inbound email capture hook receiving email body, sender email address, and subject line.

---

### Lead Management Endpoints (`LeadController` — `/api/leads`)

| Method | Endpoint Path | Description | Query / Body Parameters |
|---|---|---|---|
| `POST` | `/api/leads/capture` | Generic lead capture endpoint | `{ source, first_name, phone, email, message }` |
| `GET` | `/api/leads` | List leads with pagination & status filters | `?status=new&page=1&limit=20` |
| `GET` | `/api/leads/:id` | Get detailed lead record | Includes Lead, Conversation, Workflow & Timeline |
| `PATCH` | `/api/leads/:id/status` | Update lead status manually | `{ status: "interested" }` |
| `GET` | `/api/leads/:id/timeline` | Fetch audit timeline events for lead | Array of `TimelineEvent` records |

---

### Message Endpoints (`MessageController` — `/api/messages`)

| Method | Endpoint Path | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/messages` | Process inbound/outbound manual message | `{ lead_id, channel, text, direction }` |
| `GET` | `/api/messages/lead/:leadId` | Fetch message history for a lead | Returns ordered `Message` list |

---

### Promise Endpoints (`PromiseController` — `/api/promises`)

| Method | Endpoint Path | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/promises` | Manually schedule a promise | `{ lead_id, promise_type, scheduled_at, payload }` |
| `POST` | `/api/promises/:id/execute` | Immediately trigger promise execution | N/A |
| `DELETE` | `/api/promises/:id` | Cancel a pending promise | N/A |

---

### Workflow Endpoints (`WorkflowController` — `/api/workflows`)

| Method | Endpoint Path | Description | Request Body |
|---|---|---|---|
| `GET` | `/api/workflows/lead/:leadId` | Get current workflow instance for lead | Returns `WorkflowInstance` |
| `POST` | `/api/workflows/transition` | Manually trigger state transition | `{ lead_id, to_state, reason }` |

---

## 2. Communication Service Endpoints (`packages/communication-service` — Port 3001)

### Outbound Message Dispatcher

- **`POST /api/communication/send`**
  - **Description**: Universal outbound message endpoint invoked by API Gateway or Workflow Service.
  - **Request Body**:
    ```json
    {
      "channel": "whatsapp",
      "recipient": "+1234567890",
      "content": "Hello! Thank you for inquiring about B.Tech Computer Science.",
      "content_type": "text",
      "metadata": {
        "template_name": "welcome_info"
      }
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message_id": "wamid.HBgLMTIzNDU2Nzg5MA...",
      "status": "sent"
    }
    ```

---

## 3. Workflow Service Endpoints (`packages/workflow-service` — Port 3002)

- **`GET /health`**: Health check endpoint returning `{ status: "ok", service: "workflow-service" }`.
- **`POST /api/workflow-service/promises/run-due`**: Endpoint to manually trigger the promise evaluation run outside of the 30-second cron cycle.
