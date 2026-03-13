# NEXTJS_SAAS_PROJECT_STRUCTURE.md

## Purpose

This document defines the **official project structure** for the Devtool SaaS application.

All AI agents and contributors **must follow this structure** when creating files or implementing features.

Do not introduce new root-level directories unless absolutely necessary.

---

# Tech Stack

The SaaS application is built with the following technologies:

- Framework: Next.js (App Router)
- Language: TypeScript (strict mode)
- ORM: Prisma
- Database: PostgreSQL
- Deployment: Vercel
- Extension: Chrome Extension (Manifest V3)

---

# Root Directory Structure

```
/project-root

/app
/components
/lib
/hooks
/types
/services
/api
/prisma
/public
/extension
/docs
/scripts
/config
```

Each directory has a specific responsibility described below.

---

# /app

Next.js App Router directory.

Responsibilities:

- Page routes
- Layouts
- Server components
- Server actions
- Route handlers

Example:

```
/app
  /dashboard
    page.tsx
    layout.tsx

  /login
    page.tsx

  /api
    /metrics
      route.ts
```

Rules:

- Prefer **server components**
- Use **client components only when necessary**
- Keep page files thin and delegate logic to services

---

# /components

Reusable UI components.

```
/components
  /ui
    button.tsx
    modal.tsx

  /charts
    render-chart.tsx

  /dashboard
    metrics-panel.tsx
```

Rules:

- Components must be reusable
- Avoid business logic inside components
- Prefer composition

---

# /lib

Shared utilities and infrastructure code.

```
/lib
  prisma.ts
  auth.ts
  logger.ts
  fetcher.ts
```

Examples:

- Prisma client
- Authentication helpers
- Logging utilities

---

# /hooks

Custom React hooks.

```
/hooks
  useSession.ts
  useMetrics.ts
  useRenderStats.ts
```

Rules:

- Hooks must start with `use`
- Hooks must not contain UI logic

---

# /services

Business logic layer.

This is where most application logic lives.

```
/services
  metricsService.ts
  sessionService.ts
  userService.ts
```

Responsibilities:

- Data processing
- Business rules
- Database access via Prisma

Components should call services instead of directly accessing the database.

---

# /types

Global TypeScript types.

```
/types
  metrics.ts
  api.ts
  user.ts
```

Rules:

- Do not duplicate types across files
- Prefer shared interfaces

---

# /api

Server-side API logic.

Although Next.js route handlers live in `/app/api`,
complex API logic should be extracted into this directory.

```
/api
  metricsController.ts
  sessionController.ts
```

---

# /prisma

Prisma ORM configuration.

```
/prisma
  schema.prisma
  migrations/
```

Rules:

- All schema changes must go through Prisma migrations
- Never modify database tables manually

---

# /extension

Chrome Extension source code.

```
/extension
  manifest.json

  /background
    background.ts

  /content
    content-script.ts

  /panel
    devtools-panel.tsx

  /detector
    react-render-detector.ts
```

Responsibilities:

- React render detection
- API request interception
- Data transmission to SaaS backend

This directory is **separate from the Next.js application**.

---

# /docs

Project documentation.

```
/docs
  PROJECT_CONTEXT.md
  AGENT_RULES.md
  SAAS_BUILD_ROADMAP.md
  DEVTOOL_EXTENSION_ARCHITECTURE.md
  SECURITY_ARCHITECTURE.md
```

AI agents must always read documentation before implementing features.

---

# /public

Static assets.

```
/public
  logo.svg
  icons/
```

---

# /scripts

Development and automation scripts.

Examples:

```
/scripts
  seed-db.ts
  cleanup-sessions.ts
```

---

# /config

Configuration files.

```
/config
  rate-limit.ts
  feature-flags.ts
```

---

# Architectural Rules

1. UI must never directly access the database.

2. All database operations must go through:

```
services → Prisma
```

3. API routes must remain thin.

```
API Route → Service Layer → Prisma
```

4. Extension logic must stay isolated from the web app.

5. Business logic belongs in `/services`.

---

# Example Request Flow

```
Chrome Extension
        ↓
Next.js API Route
        ↓
Controller
        ↓
Service Layer
        ↓
Prisma
        ↓
PostgreSQL
```

---

# Important Constraints

AI agents must follow these rules:

- Do not introduce random folders
- Do not bypass the service layer
- Do not access Prisma directly from UI components
- Keep architecture consistent with documentation

---

# Goal

The goal of this structure is to ensure:

- maintainable code
- predictable architecture
- safe AI-assisted development
- scalable SaaS infrastructure
