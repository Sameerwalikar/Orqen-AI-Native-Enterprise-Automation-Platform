<div align="center">

# Orqen-AI-Native-Enterprise-Automation-Platform

### The AI-Native Workspace Platform for Multi-Agent Automation

Deploy AI agents, orchestrate workflows, and build intelligent data pipelines — all in one place.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Status](https://img.shields.io/badge/status-active--development-orange.svg)](#-roadmap)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

</div>

---

## ✨ What is Orqen-AI?

**Orqen-AI** is an open, AI-native workspace that lets teams build and run multi-agent systems the same way they'd build software — composably, observably, and at scale.

Instead of stitching together separate tools for AI agents, vector search, automation, and data movement, Orqen-AI unifies them into a single platform where every piece talks to every other piece out of the box.

```
  Agents  →  Vectors (RAG)  →  Workflows  →  Pipelines  →  Connectors
     │                              │             │
     └──────────── Schedules ───────┴── Webhooks ─┘
                         │
                    Analytics  ◄── tracks everything
                         │
                   Organizations  ◄── secures everything
```

If you've used tools like Zapier, LangChain, or n8n and wished they shared one data model, one auth system, and one observability layer — that's the gap Orqen-AI fills.

---

## 🚀 Features

| Capability | Description |
|---|---|
| 🤖 **Multi-Agent Orchestration** | Compose agents into sequential or parallel workflows with a visual builder |
| 🔍 **Vector Search & RAG** | Native vector collections power retrieval-augmented generation for any agent |
| 🔗 **Data Pipelines** | ETL-style pipelines with connector, transform, filter, and agent steps |
| 🔌 **Connectors** | Plug in external systems (S3, databases, APIs) as reusable pipeline steps |
| ⏰ **Scheduling** | Cron-based triggers for workflows and pipelines — true set-and-forget automation |
| 🪝 **Webhooks** | Event-driven triggers so external systems can kick off workflows in real time |
| 📊 **Analytics** | Built-in observability: duration, token usage, cost, and success rate for every execution |
| 🏢 **Multi-Tenancy & RBAC** | Organizations, shared resources, and role-based access out of the box |

Every feature below is connected to every other feature — see the [Integration Map](#-integration-map) for details.

---

## 🏗️ Architecture

### Tech Stack

<table>
<tr>
<td valign="top" width="33%">

**Frontend**
- React 18 + TypeScript
- Vite
- shadcn/ui
- Zustand + React Query
- Tailwind CSS

</td>
<td valign="top" width="33%">

**Backend**
- Node.js 20+
- Express.js
- PostgreSQL 15+ (Prisma ORM)
- Qdrant (vector DB)
- Redis (cache)
- RabbitMQ (message queue)

</td>
<td valign="top" width="33%">

**Infrastructure**
- Kubernetes
- Kong (API Gateway)
- GitHub Actions (CI/CD)
- Prometheus + Grafana
- Terraform (IaC)

</td>
</tr>
</table>

**AI/ML:** OpenAI, Anthropic, Cohere for LLM integration · OpenAI & Sentence Transformers for embeddings · LangChain/LangGraph for agent orchestration

### Integration Map

Every resource in Orqen-AI is connected. Agents feed workflows and pipelines, vectors give agents memory via RAG, schedules and webhooks trigger automation, and analytics + organizations wrap the whole platform in observability and access control.

| | Agents | Vectors | Workflows | Pipelines | Connectors | Schedules | Webhooks |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Agents** | — | ✅ RAG | ✅ Nodes | ✅ Steps | — | — | — |
| **Vectors** | ✅ RAG | — | ⚠️ via Agents | ⚠️ via Agents | — | — | — |
| **Workflows** | ✅ Nodes | ⚠️ via Agents | — | — | — | ✅ Scheduled | ✅ Triggered |
| **Pipelines** | ✅ Steps | ⚠️ via Agents | — | — | ✅ Steps | ✅ Scheduled | ✅ Triggered |

`✅` direct integration · `⚠️` indirect integration · all resources also flow into **Analytics** and are scoped to **Organizations**.

<details>
<summary><strong>Example: RAG-powered customer support bot</strong></summary>

```
1. Create a Vector Collection "Knowledge Base" and load product docs
2. Create an Agent "Support Bot" linked to that collection
3. Wrap the agent in a Workflow: Start → Support Bot → End
4. Add a Schedule to run it hourly, or a Webhook to trigger it on demand
5. Watch cost, latency, and success rate roll into Analytics automatically
```

</details>

<details>
<summary><strong>Example: Scheduled data pipeline</strong></summary>

```
1. Create an S3 Connector
2. Create an Agent "Data Analyzer"
3. Build a Pipeline: S3 Connector → Transform → Agent → Output
4. Attach a Schedule (every 6 hours) or a Webhook for event-driven runs
5. Every run is tracked in Analytics — records processed, duration, errors
```

</details>

---

## 📦 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm (or your package manager of choice)

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-org>/Orqen-AI.git
cd Orqen-AI

# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure environment
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Set up the database
npm run migrate
npm run prisma:generate
cd ..
```

### Run locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:5173` (or whatever port Vite reports) to see the dashboard.

> For a deeper walkthrough, see the [Quick Start Guide](./docs/QUICK_START_GUIDE.md).

---

## 📖 Documentation

| Document | Description |
|---|---|
| [Executive Summary](./docs/EXECUTIVE_SUMMARY.md) | High-level overview — start here |
| [Strategic Plan](./docs/STRATEGIC_PLAN.md) | Full business and technical strategy |
| [Technical Implementation Plan](./docs/TECHNICAL_IMPLEMENTATION_PLAN.md) | Step-by-step build guide |
| [Quick Start Guide](./docs/QUICK_START_GUIDE.md) | Get running in ~30 minutes |
| [Project Structure](./docs/PROJECT_STRUCTURE.md) | Directory layout and conventions |

---

## 🗺️ Roadmap

### ✅ Where we are today
- Authentication (JWT + Google OAuth)
- User management
- Dashboard shell
- Core tech stack in place (React 18, TypeScript, Node.js, PostgreSQL, Prisma)

### 🔨 What's next

| Phase | Timeline | Focus |
|---|---|---|
| **1 — Foundation** | Months 1–3 | Microservices architecture, Qdrant, RabbitMQ, basic agent execution & vector search, workflow engine |
| **2 — Core Features** | Months 4–6 | Agent marketplace, advanced vector search, visual workflow builder, pipeline system |
| **3 — Enterprise** | Months 7–9 | Multi-tenancy, RBAC, SSO/SAML, SOC 2 & GDPR compliance |
| **4–6 — Scale & Launch** | Months 10–18 | Performance hardening, multi-region deployment, public launch |

We're building this in the open — check the [issues](../../issues) and [projects](../../projects) tabs to see what's actively in progress and where you can help.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn and build. Any contribution you make is **greatly appreciated**.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for coding standards, commit conventions, and the PR review process.

---

## ⭐ Support the Project

If Orqen-AI is useful to you, consider giving it a star — it genuinely helps the project gain visibility and lets us know we're building something people want.

---



<div align="center">

Built with ❤️ by Sameer Walikar

</div>
