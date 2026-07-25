# Developer & AI Agent Operational Guidelines

This document establishes standard operating procedures, execution guardrails, verification steps, and maintenance rules for AI agents and human developers working in this codebase.

---

## 1. Principles of Engagement

1. **Monorepo Build Dependency**:
   - `packages/shared` must ALWAYS be compiled (`npm run build:shared`) before running or building dependant microservices (`api-gateway`, `communication-service`, `workflow-service`).
   - Node packages reference shared entities and types via standard TypeScript project references or compiled output in `packages/shared/dist`.

2. **Codebase Preservation**:
   - Do NOT edit core function signatures or API endpoints without checking all call sites across `packages/api-gateway`, `packages/communication-service`, and `packages/workflow-service`.

3. **Database & Schema Updates**:
   - In development, TypeORM SQLite auto-synchronizes schema (`synchronize: true`).
   - If adding or modifying fields on TypeORM entities (`packages/shared/src/entities/*.ts`), remember to update `memory/03_database_and_entities.md` to reflect schema changes.

4. **Audit Trail Requirement**:
   - Any new lead action, state transition, or message event MUST log a record to `TimelineEvent` via `LeadService` or `RoutingService` to preserve full system auditability.

---

## 2. Monorepo Commands & Scripts

### Build Commands
```bash
# 1. Build shared library (REQUIRED FIRST STEP)
npm run build:shared

# 2. Build all workspaces
npm run build:all
```

### Running Services Locally
```bash
# Option A: Start all services concurrently
npm run dev:all

# Option B: Start services individually
npm run start:api       # API Gateway (Port 3000)
npm run start:comm      # Communication Service (Port 3001)
npm run start:workflow  # Workflow Service (Port 3002)

# Option C: Run via Docker Compose
docker compose up --build
```

### Testing & Linting
```bash
npm run test           # Run Jest test suites across all workspaces
npm run lint           # Run ESLint across all workspaces
```

---

## 3. Maintaining the `memory/` Directory

Whenever a developer or AI agent makes changes to this project, follow this protocol:

1. **Adding a New Code File**:
   - Add an entry for the new file in `memory/01_code_file_status.md` with its purpose, exports, and status.

2. **Modifying Architecture or Data Flow**:
   - Update `memory/02_architecture_and_dataflow.md` if lead routing logic, category matching, or promise handling changes.

3. **Modifying Database Entities**:
   - Update `memory/03_database_and_entities.md` with new columns, tables, or relations.

4. **Adding/Changing API Endpoints**:
   - Update `memory/04_api_endpoints_and_webhooks.md` with the new route contract, method, and payload structure.

---

## 4. AI Agent Context Protocol

When an AI agent is spawned or assigned a prompt in this workspace:
- Read `memory/00_overview.md` first to obtain high-level context.
- Check `memory/01_code_file_status.md` to understand existing code structure.
- Always run `npm run build:shared` (or `npm run build:all`) after making changes to verify compilation cleanly before marking a task complete.
