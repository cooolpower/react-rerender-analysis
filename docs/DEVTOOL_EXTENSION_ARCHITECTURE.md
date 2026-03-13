# DEVTOOL EXTENSION ARCHITECTURE

This document defines the architecture for the React Performance Devtool extension.

---

# System Overview

The system has four layers:

1. Browser Extension
2. Data Collector
3. Backend API
4. SaaS Dashboard

---

# Extension Architecture

Chrome extension structure:

extension/
background/
content-script/
devtools-panel/
utils/

Responsibilities:

background

- manage communication
- send data to backend

content-script

- inject profiler
- collect performance metrics

devtools-panel

- display debugging UI

---

# React Render Detection

Use one of these strategies:

1. React DevTools hook
2. React Profiler API
3. monkey patch render functions

Metrics to collect:

- component name
- render count
- render duration
- component tree

Example data:

{
component: "ProductCard",
renderCount: 8,
renderTime: 4.3
}

---

# API Performance Tracking

Intercept:

- fetch
- XMLHttpRequest

Capture:

- endpoint
- response time
- response size

Example:

{
endpoint: "/api/products",
latency: 240,
status: 200
}

---

# Data Transmission

Extension sends collected metrics to backend.

Transport:

POST /api/metrics

Payload:

{
sessionId: "...",
url: "...",
metrics: {...}
}

---

# Backend Storage

Database tables:

users
sessions
component_metrics
api_metrics

Example schema:

users

- id
- email
- createdAt

sessions

- id
- userId
- url
- createdAt

---

# Dashboard Visualization

Dashboard must show:

1. Render heatmap
2. API waterfall
3. session timeline

Example UI:

Component Render Heatmap

Header 🔴
Sidebar 🟡
ProductCard 🔴

---

# Performance Constraints

Extension must:

- add minimal runtime overhead
- avoid memory leaks
- avoid excessive network calls

---

# Privacy Rules

Extension must NOT collect:

- cookies
- authentication tokens
- user input data

Only performance metrics.

---

# Future Features (NOT MVP)

Possible future upgrades:

- memory leak detection
- bundle analyzer
- Next.js optimization suggestions
- CI performance regression detection

These must not be implemented before MVP launch.
