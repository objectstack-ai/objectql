---
layout: home

hero:
  name: ObjectQL
  text: One Protocol, Any Database, AI-Ready
  tagline: A universal data query engine for the modern stack. Write your logic once in JSON-DSL, run it seamlessly on MongoDB or PostgreSQL.
  image:
    src: /logo.svg
    alt: ObjectQL Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/objectql/objectql

features:
  - icon: 🚀
    title: Dual-Stack Engine
    details: Native performance for schema-less MongoDB and first-class support for PostgreSQL, MySQL, and SQLite with a unique "Core Columns + JSONB" strategy.
  - icon: 🤖
    title: AI-Native Protocol
    details: Queries defined as standardized JSON ASTs, optimized for LLMs to understand schema and generate accurate, safe business logic without hallucinating SQL syntax.
  - icon: ⚡
    title: Modern & Lightweight
    details: Written in 100% TypeScript with zero heavy legacy dependencies. Promise-based asynchronous API with no runtime requirements beyond Node.js.
  - icon: 🔌
    title: Pluggable Architecture
    details: Core logic completely decoupled from storage drivers. Easily extensible to support other data sources like REST APIs, GraphQL, or additional SQL/NoSQL databases.
  - icon: 📖
    title: Comprehensive Documentation
    details: Detailed guides for developers and comprehensive protocol specifications for system integrators and driver contributors.
  - icon: 🛡️
    title: Production Ready
    details: Built-in security features, transaction support, and optimized queries for both development flexibility and production reliability.
---

## Documentation Overview

We have organized the documentation into three main categories:

### [User & Developer Guide](/guide/)
**Target Audience**: Application Developers, Customer Success, End Users.

Learn how to build applications using ObjectQL:
- Data modeling (Objects, Fields, Relationships)
- Writing business logic (Hooks, Actions)
- Using the Node.js SDK
- Security configuration

### [Protocol Specifications](/spec/)
**Target Audience**: System Architects, Driver Contributors, Integrators.

Understand the low-level protocols:
- Metadata File Format Specification (YAML/JSON schema)
- Unified Query Language Protocol
- HTTP API Reference

### [Airtable Functionality Roadmap](/AIRTABLE_DOCS_INDEX) 🆕
**Target Audience**: Project Managers, Product Managers, Development Teams.

Comprehensive resources for implementing Airtable-like functionality:
- [Comprehensive evaluation](/AIRTABLE_EVALUATION) of gaps between ObjectQL and Airtable (Chinese)
- [Detailed implementation roadmap](/AIRTABLE_IMPLEMENTATION_ROADMAP) with 6 development phases (English)
- [GitHub Issues templates](/GITHUB_ISSUES_TEMPLATE) for task creation
- Resource requirements, timeline estimates, and risk assessment
- Technical design proposals for multi-view system, collaboration, and automation
