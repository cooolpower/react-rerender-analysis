# PROJECT CONTEXT

This document defines the global context of the project.

All AI agents must read and understand this document before implementing features.

The purpose of this document is to ensure the agent understands:

- the purpose of the product
- the problem being solved
- the target users
- the product scope
- the business model
- the long-term vision

---

# Project Overview

Project Name (temporary)

React Performance Devtool SaaS

This project aims to build a developer tool that helps analyze performance issues in React and Next.js applications.

The system consists of:

1. Chrome Devtools Extension
2. Performance Data Collector
3. Backend API
4. SaaS Dashboard

---

# Problem Statement

React applications often suffer from performance issues such as:

- unnecessary component re-renders
- slow API requests
- inefficient component structures
- large bundle sizes
- memory leaks

Many developers struggle to quickly identify these issues.

Existing tools often have the following problems:

- difficult to use
- poor visualization
- limited focus on React render behavior

---

# Product Vision

The goal of this product is to help developers quickly detect performance issues in React applications.

The product focuses on **visual performance debugging**.

Developers should be able to identify performance problems within seconds.

---

# Target Users

Primary users include:

1. React developers
2. Next.js developers
3. Frontend engineers
4. Startup engineering teams

User characteristics:

- builds modern frontend applications
- cares about performance
- frequently uses browser devtools

---

# Core Features (MVP)

The MVP must only include the following features.

1. React Render Heatmap
2. API Request Waterfall
3. Component Render Metrics
4. Performance Dashboard
5. Session Performance Logs

Features outside this scope must NOT be implemented during MVP.

---

# Product Architecture

The system architecture consists of four layers.

1. Chrome Extension
2. Performance Metrics Collector
3. Backend API
4. SaaS Dashboard

Data flow:

Browser Extension
↓
Performance Metrics Collector
↓
Backend API
↓
Database
↓
Dashboard Visualization

---

# Business Model

The product uses a SaaS subscription model.

Pricing structure:

Free Plan

- basic render heatmap
- limited session history

Pro Plan ($9/month)

- unlimited sessions
- performance history
- advanced metrics

---

# Market Opportunity

React is one of the most widely used frontend libraries in the world.

Millions of developers use React.

Developer tools targeting the React ecosystem represent a strong market opportunity.

---

# Competitors

Existing tools include:

- React Developer Tools
- Sentry
- Lighthouse

However, these tools have limitations:

- limited visualization of render behavior
- difficult performance debugging workflow
- not focused on React component render analysis

---

# Differentiation

This product differentiates itself by providing:

1. visual render heatmap
2. API waterfall visualization
3. developer-focused debugging UX
4. devtools-centered workflow

---

# Success Metrics

The product is considered successful when the following milestones are reached.

Extension installs

1000+

Paid users

100+

Monthly Recurring Revenue

$900+

---

# Product Philosophy

The product must follow these principles.

- simplicity
- fast performance debugging
- developer-focused experience

---

# Important Constraint

This project is a Micro SaaS product.

Therefore the following constraints apply:

- small scope
- fast development
- minimal features

Feature creep must be avoided.

---

# Long Term Vision

Possible features after MVP:

- memory leak detection
- bundle size analyzer
- Next.js performance recommendations
- CI performance regression alerts

These features must NOT be implemented before MVP launch.
