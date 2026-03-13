# SAAS BUILD ROADMAP

Project timeline: 4 weeks

Goal:
Launch MVP within 30 days.

---

# WEEK 1 — Project Foundation

Objective:
Set up the base SaaS infrastructure.

Tasks:

1. Initialize Next.js project
2. Configure TypeScript strict mode
3. Setup Vanilla Extract
4. Install shadcn UI
5. Setup PostgreSQL
6. Setup Prisma ORM
7. Create basic project structure

Project structure:

src/
app/
features/
components/
lib/
db/

Deliverables:

- running web app
- database connection
- basic UI

---

# WEEK 2 — Authentication + SaaS Core

Objective:
Implement SaaS user system.

Tasks:

1. Implement authentication
2. Create user table
3. Implement login / signup
4. Create user dashboard
5. Setup session tracking

Recommended libraries:

- NextAuth or custom auth
- Prisma

Deliverables:

- working login system
- user dashboard

---

# WEEK 3 — Devtool Extension

Objective:
Build Chrome Devtools extension.

Tasks:

1. Create Chrome extension structure
2. Implement content script
3. Inject React profiler
4. Track component renders
5. Capture API request timing
6. Send metrics to backend

Deliverables:

- extension running
- render data collected
- API request tracking

---

# WEEK 4 — Dashboard + Billing

Objective:
Complete SaaS functionality.

Tasks:

1. Build performance dashboard
2. Visualize render heatmap
3. Display API waterfall
4. Store session history
5. Integrate Stripe subscription
6. Deploy to Vercel

Deliverables:

- production deployment
- working subscription
- public MVP

---

# Launch Plan

After deployment:

1. Launch on Product Hunt
2. Share on Twitter / X
3. Share on Reddit (React community)
4. Post on Hacker News

Goal:

First 100 users.
