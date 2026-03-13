# EXTENSION_BACKEND_COMMUNICATION.md

## Purpose

This document defines how the Chrome Extension communicates with the SaaS backend.

All AI agents and contributors must follow this communication protocol.

The goal is to ensure:

- secure data transmission
- efficient batching
- scalable metrics ingestion
- predictable API design

---

# Communication Overview

Data flows from the Chrome Extension to the SaaS backend.

Flow:

Chrome Extension
→ Next.js API
→ Controller
→ Service Layer
→ Prisma
→ PostgreSQL

The extension never communicates directly with the database.

---

# Authentication

All extension requests must include an API key.

Header:

Authorization: Bearer <extension_api_key>

The key is issued when a user installs the extension and logs into the SaaS dashboard.

Rules:

- Keys must be validated on every request
- Invalid keys must return HTTP 401
- Keys must be stored securely

---

# Allowed API Endpoints

The extension is allowed to call only these endpoints.

POST /api/session/start
POST /api/metrics/batch
POST /api/session/end

No other endpoints should accept extension traffic.

---

# Session Lifecycle

A session represents a monitoring period for a specific webpage.

Flow:

1. Extension loads
2. Session start request sent
3. Metrics collected
4. Metrics batched and sent periodically
5. Session end request sent

Example:

POST /api/session/start

Payload:

{
"url": "https://example.com",
"timestamp": 1710000000
}

Response:

{
"sessionId": "abc123"
}

---

# Metrics Batching

Metrics must be sent in batches to reduce server load.

Batch interval:

Every 5 seconds OR when 50 events collected.

Example payload:

POST /api/metrics/batch

{
"sessionId": "abc123",
"events": [
{
"type": "component_render",
"componentName": "ProductCard",
"renderTime": 4.3,
"timestamp": 1710000010
},
{
"type": "api_request",
"endpoint": "/api/products",
"latency": 120
}
]
}

---

# Rate Limiting

The backend must enforce rate limiting.

Rules:

- Maximum 100 requests per minute per API key
- Excess requests return HTTP 429

This prevents abuse and protects the backend.

---

# Security Rules

The extension must never send:

- full DOM snapshots
- sensitive user input
- authentication tokens
- cookies

Allowed data types:

- component render metrics
- performance metrics
- API request timings

---

# Error Handling

If a request fails:

1. retry up to 3 times
2. apply exponential backoff
3. drop metrics if retries exhausted

Example retry delay:

1s → 2s → 5s

---

# Data Size Limits

Maximum request size:

1 MB

Maximum events per batch:

50

---

# API Response Format

All API responses must follow this structure:

{
"success": true,
"data": {},
"error": null
}

Error example:

{
"success": false,
"error": "INVALID_API_KEY"
}

---

# Goal

This communication architecture ensures:

- predictable API behavior
- secure extension communication
- scalable metrics ingestion
- stable SaaS backend performance
