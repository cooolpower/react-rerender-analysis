# SECURITY ARCHITECTURE

This document defines the security rules for the React Performance Devtool SaaS.

All agents must follow these rules strictly.

---

# Security Principles

The system must follow these core principles:

1. Least privilege
2. Secure by default
3. No sensitive data collection
4. Encryption for all sensitive data
5. Secure API communication

---

# Authentication Security

Authentication must follow these rules.

- Use secure session management
- Never store plaintext passwords
- Hash passwords using bcrypt or argon2

Example:

bcrypt hash

---

# API Security

All backend APIs must enforce authentication.

Rules:

- Every request must include a valid session
- Use server-side validation
- Never trust client input

Example protection:

- rate limiting
- request validation

---

# Database Security

Sensitive fields must be protected.

Examples:

- password_hash
- stripe_customer_id

Rules:

- never store raw passwords
- restrict direct DB access
- use environment variables for DB credentials

---

# Extension Security

The Chrome extension must follow strict rules.

Forbidden:

- reading cookies
- accessing localStorage
- capturing user input

Allowed data:

- performance metrics
- component render information
- API timing

---

# Network Security

All communication must use HTTPS.

Rules:

- no HTTP endpoints
- secure TLS connections

---

# Data Privacy

The system must not collect personal data.

Forbidden data:

- authentication tokens
- cookies
- form inputs
- user typed content

---

# Secrets Management

Secrets must never be committed to source code.

Use environment variables for:

- database URL
- stripe keys
- API secrets

Example:

.env

---

# Logging Rules

Logs must not contain:

- passwords
- tokens
- cookies
- user private data

---

# Rate Limiting

API endpoints must implement rate limiting.

Example:

100 requests per minute per user

---

# Extension Permissions

The Chrome extension must request minimal permissions.

Allowed permissions:

- activeTab
- scripting

Forbidden permissions:

- cookies
- history
- downloads

---

# Production Security

Before deployment ensure:

- HTTPS enabled
- environment variables configured
- no debug logs in production

---

# Security Responsibility

If any feature introduces potential security risk, the agent must stop implementation and review the security rules.
