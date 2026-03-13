# SAAS DATABASE SCHEMA

This document defines the database structure for the React Performance Devtool SaaS.

Database type:

PostgreSQL

ORM:

Prisma

---

# Database Overview

The system stores:

1. Users
2. Sessions
3. Component Render Metrics
4. API Request Metrics
5. Subscription Information

---

# Table: users

Stores user accounts.

Fields:

id (uuid, primary key)

email (string, unique)

password_hash (string)

plan (string)
Possible values:

- free
- pro

created_at (timestamp)

updated_at (timestamp)

Example

{
id: "user_123",
email: "dev@example.com",
plan: "free"
}

---

# Table: sessions

Represents a debugging session captured from the browser.

Fields:

id (uuid)

user_id (uuid)

url (string)

user_agent (string)

started_at (timestamp)

ended_at (timestamp)

Example

{
id: "session_001",
user_id: "user_123",
url: "https://app.example.com/products"
}

---

# Table: component_metrics

Stores React component render metrics.

Fields:

id (uuid)

session_id (uuid)

component_name (string)

render_count (integer)

average_render_time (float)

max_render_time (float)

created_at (timestamp)

Example

{
component_name: "ProductCard",
render_count: 12,
average_render_time: 3.2
}

---

# Table: api_metrics

Stores API performance metrics.

Fields:

id (uuid)

session_id (uuid)

endpoint (string)

method (string)

status_code (integer)

latency_ms (integer)

response_size (integer)

created_at (timestamp)

Example

{
endpoint: "/api/products",
method: "GET",
latency_ms: 240
}

---

# Table: subscriptions

Stores Stripe subscription information.

Fields:

id (uuid)

user_id (uuid)

stripe_customer_id (string)

stripe_subscription_id (string)

plan (string)

status (string)

current_period_end (timestamp)

---

# Indexing Strategy

Indexes should be created on:

users.email

sessions.user_id

component_metrics.session_id

api_metrics.session_id

---

# Data Retention Policy

Free plan:

store last 5 sessions

Pro plan:

store unlimited sessions
