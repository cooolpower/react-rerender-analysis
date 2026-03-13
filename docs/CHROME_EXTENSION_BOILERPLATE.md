# CHROME EXTENSION BOILERPLATE

This document defines the architecture of the Chrome Devtools Extension.

---

# Extension Purpose

The extension collects performance metrics from React applications and sends them to the SaaS backend.

Metrics include:

- component renders
- API request timings
- session metadata

---

# Extension Folder Structure

extension/

background/
background.ts

content-script/
injectProfiler.ts
networkInterceptor.ts

devtools/
panel.html
panel.ts
panel.css

shared/
types.ts
utils.ts

manifest.json

---

# Manifest Configuration

Manifest version:

v3

Key permissions:

- activeTab
- scripting
- storage

Example manifest:

{
"manifest_version": 3,
"name": "React Performance Devtool",
"version": "0.1.0",
"permissions": ["activeTab", "scripting"],
"background": {
"service_worker": "background/background.js"
},
"devtools_page": "devtools/panel.html"
}

---

# Content Script Responsibilities

The content script runs inside the web page.

Responsibilities:

- detect React presence
- inject performance instrumentation
- collect render metrics
- intercept API requests

---

# Background Script Responsibilities

The background script manages:

- communication with backend API
- session management
- message passing

---

# Devtools Panel

The devtools panel displays debugging information.

UI components:

- Render Heatmap
- API Waterfall
- Component Metrics

---

# Data Transmission

Metrics are sent to the SaaS backend.

Endpoint:

POST /api/metrics

Payload example:

{
sessionId: "abc123",
url: "https://example.com",
components: [...],
apiRequests: [...]
}

---

# Performance Requirements

The extension must:

- minimize runtime overhead
- avoid memory leaks
- batch network requests
