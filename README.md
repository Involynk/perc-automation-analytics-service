# PERC Admission Operations Engine

Multi-service admission lead management system with automated WhatsApp routing, built on NestJS microservices.

## Architecture

```
packages/
├── shared/               # Shared types, entities, constants
├── api-gateway/          # Webhooks, lead CRUD, lead capture
├── communication-service # WhatsApp, Email, Instagram, Facebook
└── workflow-service/     # State machine, promises, scheduling
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 3000 | All webhook endpoints, lead management, routing |
| Communication | 3001 | Send messages via external channels |
| Workflow | 3002 | Promise scheduling, state transitions |

## Quick Start

```bash
npm install
# Start all services individually:
npm run start:dev -w packages/api-gateway
npm run start:dev -w packages/communication-service
npm run start:dev -w packages/workflow-service

# Or via Docker:
docker compose up
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/webhooks/whatsapp` | WhatsApp Cloud API |
| GET/POST | `/webhooks/instagram` | Instagram messaging |
| GET/POST | `/webhooks/facebook` | Facebook Messenger |
| POST | `/webhooks/email/poll` | Poll email inbox |
| POST | `/api/leads/capture` | Generic lead capture |
| GET | `/api/leads` | List leads |
| GET | `/api/leads/:id` | Lead detail with timeline |
| POST | `/api/messages` | Inbound message |

## Database

SQLite for dev (`perc_dev.db` auto-created). Seed data (channels, event types, settings) inserted on first run.

## Env

Copy `.env` and fill in API keys for WhatsApp, Instagram, Facebook, and Email.
