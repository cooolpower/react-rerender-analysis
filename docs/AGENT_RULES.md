1. Project Goal

This project aims to build a React Performance Devtool SaaS.

The product provides:

React component render analysis

API request waterfall visualization

performance insights for frontend developers

Target users:

React developers

Next.js developers

frontend performance engineers

Primary goal:

Reach $5,000 MRR as a Micro SaaS product.

2. Product Definition

Product type:

Developer Tool SaaS

Core components:

Chrome Devtools Extension

SaaS Web Dashboard

Performance Data Collector

Analysis Engine

Core value:

Help developers quickly detect:

unnecessary re-renders

slow API calls

component performance issues

bundle inefficiencies

3. MVP Scope (Strict)

The agent MUST only implement the following features for MVP.

MVP features:

React Render Heatmap

API Waterfall Visualization

Dashboard for session logs

Basic performance metrics

User authentication

Stripe subscription

Anything outside this scope is not allowed in MVP.

4. Tech Stack Rules

The agent MUST follow this stack.

Frontend

Next.js (App Router)

TypeScript strict mode

Vanilla Extract

shadcn UI components

Backend

Next.js Server Actions or API Routes

PostgreSQL

Prisma ORM

Infrastructure

Vercel deployment

Stripe billing

GitHub repository

Browser Extension

Chrome Devtools Extension

TypeScript

React (optional)

5. Coding Rules

Strict rules:

TypeScript strict mode must be enabled.

Do not use any.

Use unknown and type narrowing if necessary.

All components must be functional components.

Avoid global mutable state.

Prefer server components when possible.

Use TanStack Query for client data fetching.

Performance rules:

Avoid unnecessary re-renders

Use memoization where appropriate

Use lazy loading for heavy components

6. Architecture Rules

Follow a feature-based architecture.

Example:

src/
app/
features/
auth/
performance/
session/
components/
lib/
db/

Rules:

Business logic must live inside features.

UI components must remain reusable.

Database logic must be isolated in lib/db.

7. Extension Architecture

Chrome extension structure:

extension/
devtools/
content-script/
background/

Responsibilities:

content-script

inject React profiler

collect render metrics

background

manage data transmission

devtools panel

display performance metrics

8. Performance Data Collection

Metrics to collect:

Component

render count

render duration

Network

API endpoint

latency

response size

Session

page URL

timestamp

user session id

9. Security Rules

Must follow:

No sensitive data collection

No cookies captured

No authentication tokens captured

Only performance metrics allowed

User consent must be clear.

10. SaaS Billing Rules

Billing must be implemented using:

Stripe subscription

Plans:

Free

basic heatmap

limited sessions

Pro ($9/month)

unlimited sessions

history dashboard

team sharing

11. Development Workflow

The agent must follow this workflow:

Step 1

Initialize project structure.

Step 2

Implement authentication.

Step 3

Build Chrome extension MVP.

Step 4

Implement performance data collector.

Step 5

Create dashboard UI.

Step 6

Implement Stripe billing.

Step 7

Deploy to Vercel.

12. Deployment Rules

Production must run on:

Vercel

PostgreSQL (managed)

Environment variables must be used for:

database URL

Stripe keys

API secrets

Never hardcode secrets.

13. UI Rules

UI principles:

simple

developer focused

minimal design

performance first

Use:

dark mode default

monospace metrics display

14. Quality Rules

Before release:

No TypeScript errors

No console errors

Lighthouse performance score > 90

15. Anti Scope-Creep Rule

The agent must refuse implementing features not in MVP scope.

Forbidden examples:

AI features

team collaboration

advanced analytics

mobile app

These can only be implemented after product-market fit.

16. Success Metrics

Success is defined as:

1000 installs of extension

100 paid users

$900+ MRR

17. Launch Strategy

Launch channels:

Product Hunt

Twitter / X developer community

Reddit (React / WebDev)

Hacker News

18. Long Term Vision

Future features:

memory leak detection

bundle analyzer

Next.js optimization suggestions

CI performance regression

These must NOT be implemented in MVP.

19. Agent Behavior Rules

The agent must:

prioritize speed over perfection

avoid unnecessary abstraction

ship MVP fast

focus on core value

20. Golden Rule

Always ask:

"Does this help developers find performance problems faster?"

If not, do not implement it.
