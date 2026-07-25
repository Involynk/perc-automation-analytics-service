# Getting Started

## Prerequisites
- Node.js 18+
- npm
- A Supabase project (free tier works)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your Supabase credentials
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# 3. Create database tables
# Open your Supabase project → SQL Editor → paste & run docs/perc_schema.pg.sql

# 4. Build shared library
npm run build:shared

# 5. Start API Gateway
npm run start:api
```

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Build shared + start api-gateway |
| `npm run build:shared` | Rebuild shared library |
| `npm run start:api` | Start API Gateway (port 3000) |
| `npm run start:workflow` | Start Workflow Service (port 3002) |
| `npm run start:comm` | Start Communication Service (port 3001) |

## Verify

```bash
curl http://localhost:3000/health
# → {"status":"ok"}

curl -X POST http://localhost:3000/api/leads/capture \
  -H "Content-Type: application/json" \
  -d '{"source":"website","first_name":"Test","message":"Hello"}'
# → {"status":"success","lead_id":"...","message":"Lead captured"}
```
