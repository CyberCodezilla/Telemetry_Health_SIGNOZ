<div align="center">

# 🩺 TelemetryHealth

### *Observe Your Observability*

**The world's first meta-observability platform — an OpenTelemetry Collector processor that monitors, scores, and auto-heals your entire telemetry pipeline.**

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat-square&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Collector-orange?style=flat-square&logo=opentelemetry)](https://opentelemetry.io)
[![SigNoz](https://img.shields.io/badge/SigNoz-Integrated-FF6B35?style=flat-square)](https://signoz.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Hackathon](https://img.shields.io/badge/SigNoz%20Hackathon-Track%2002-purple?style=flat-square)](https://wemakedevs.org/hackathons/signoz)

> **Built for the SigNoz Agents of Observability Hackathon · Track 02: Signals & Dashboards · Jul 20–26, 2026**

</div>

---

## 🚨 The Problem Nobody Talks About

You spend weeks setting up OpenTelemetry. You deploy SigNoz. You breathe easy.

Then, three months later:
- Your SigNoz bill **quadrupled** — but why?
- Half your traces are **orphaned**, showing broken distributed chains
- A critical microservice **silently stopped emitting** telemetry two weeks ago — nobody noticed
- A developer shipped a feature using `user_id` as a metric label, causing **1.2M unique cardinality values**

**The painful irony: your observability system is unobserved.**

TelemetryHealth solves this by sitting *inside* your OTel Collector pipeline and continuously monitoring the health of your telemetry signals — in real time.

---

## ✨ What TelemetryHealth Does

TelemetryHealth is a **production-grade OTel Collector processor** with a full control plane, React dashboard, and SigNoz MCP integration. It does three things:

1. **Detects** — Runs inline health analyzers on every span, metric, and log passing through your pipeline
2. **Scores** — Aggregates findings into a **Composite Health Score (0–100)** per tenant, visible in SigNoz
3. **Heals** — Generates validated, ready-to-apply OTel Collector YAML config patches to fix the issue

---

## 🎯 Detection Capabilities

| Health Check | What It Catches | Technical Approach |
|---|---|---|
| 🔢 **Cardinality Explosion** | Attributes with label cardinality spiking past configurable thresholds (e.g. `user_id`, `session_id` on metrics) | Per-service/key HyperLogLog (HLL) sketches, merged centrally |
| 🔗 **Broken Trace Chains** | Orphaned spans: spans with a `parent_span_id` referencing a span that never arrived | Bounded out-of-order event correlation with configurable TTL windows |
| 📡 **Coverage Gaps** | Services that silently stop emitting telemetry (zero spans/metrics/logs in a configurable window) | Heartbeat tracking per service against known-endpoint registry |
| 🤖 **AI Agent Health** | Token cost explosions, broken decision chains, silent tool-call failures in LLM-instrumented agents | OTel GenAI semantic convention attribute inspection |
| 📋 **Semantic Convention Violations** | Attributes deviating from OTel GenAI and standard semantic conventions | Attribute key allowlist + convention schema validation |

---

## 🏗 Architecture — Full System View

```
╔══════════════════════════════════════════════════════════════╗
║                  Your OTel Collector Fleet                   ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │      TelemetryHealth Processor  (Go, OTel SDK)       │   ║
║  │                                                       │   ║
║  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   ║
║  │  │ Cardinality │  │  TraceChain  │  │  Coverage  │  │   ║
║  │  │  Tracker    │  │   Detector   │  │  Monitor   │  │   ║
║  │  │ (HLL/svc)   │  │ (orphan TTL) │  │ (heartbeat)│  │   ║
║  │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │   ║
║  │         └────────────────┴────────────────┘          │   ║
║  │              Fail-Open Circuit Breaker                │   ║
║  │        [Processor panic? Pipeline keeps flowing]      │   ║
║  └───────────────────────┬───────────────────────────────┘   ║
╚══════════════════════════╪═══════════════════════════════════╝
                           │ gRPC / OTLP  (mTLS + SPIFFE)
                           ▼
╔══════════════════════════════════════════════════════════════╗
║                    Control Plane  (Go)                       ║
║                                                              ║
║  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐  ║
║  │ Ingest Gtwy  │  │  Stream Jobs   │  │   REST API      │  ║
║  │ (gRPC/OTLP)  │  │  (HLL Merge   │  │  /api/v1/...    │  ║
║  │  mTLS AuthZ  │  │   + Scoring)   │  │  Health Score   │  ║
║  └──────┬───────┘  └───────┬────────┘  └────────┬────────┘  ║
║         │                  ▼                     │           ║
║         │         ┌─────────────────┐            │           ║
║         └────────►│   ClickHouse    │◄───────────┘           ║
║                   │  (TTL / AggMT)  │                        ║
║                   └─────────────────┘                        ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │         MCP Server  (SSE + stdio modes)              │   ║
║  │   GetTelemetryHealth · GenerateRemediation tools     │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════╪═══════════════════════════════════╝
                           │ REST + WebSocket
                 ┌─────────┴──────────┐
                 ▼                    ▼
  ╔════════════════════════╗   ╔══════════════════╗
  ║  React Dashboard       ║   ║  SigNoz Platform ║
  ║  (Vite + TypeScript)   ║   ║  Dashboards &    ║
  ║  Health Gauge · YAML   ║   ║  Alerts Bridge   ║
  ╚════════════════════════╝   ╚══════════════════╝
```

---

## 🗂 Repository Structure

```
TelemetryHealth/
│
├── processor/                        # OTel Collector Processor (Go module)
│   ├── factory.go                    #   Component factory & registration
│   ├── config.go                     #   Processor config schema
│   ├── base_consumer.go              #   Shared signal consumer base
│   ├── traces_consumer.go            #   OTLP Traces hook (10.4KB — most logic here)
│   ├── metrics_consumer.go           #   OTLP Metrics hook
│   ├── logs_consumer.go              #   OTLP Logs hook
│   ├── metrics.go                    #   OTel instrumentation: emits health metrics
│   ├── cardinality/                  #   HyperLogLog cardinality tracker
│   ├── tracechain/                   #   Orphan span detector
│   └── failopen/                     #   Circuit breaker (93.9% test coverage)
│
├── control-plane/                    # Control Plane (Go module)
│   ├── cmd/
│   │   ├── api-server/               #   REST API entrypoint (port 8080)
│   │   ├── mcp-server/               #   MCP server entrypoint (port 8081)
│   │   ├── ingest-gateway/           #   gRPC OTLP receiver
│   │   └── worker/                   #   Kafka consumer / stream job workers
│   └── internal/
│       ├── authz/                    #   mTLS / SPIFFE zero-trust verification (100% coverage)
│       ├── ingest/                   #   gRPC server impl (Traces, Metrics, Logs)
│       ├── streaming/                #   HLL merge + scoring stream jobs
│       ├── storage/clickhouse/       #   ClickHouse DDL schema & query layer
│       ├── api/rest/                 #   HTTP REST API handlers
│       ├── remediation/              #   YAML patch generator + OTel allowlist validator
│       ├── alerting/                 #   SigNoz Alertmanager bridge (15-min cooldown)
│       └── mcp/
│           └── tools.go              #   MCP tool definitions (GetTelemetryHealth, GenerateRemediation)
│
├── dashboard/                        # Frontend (React 19 + Vite + TypeScript)
│   └── src/
│       ├── components/
│       │   ├── HealthGauge.tsx       #   Animated circular SVG health gauge
│       │   ├── MetricCard.tsx        #   KPI metric cards with delta indicators
│       │   ├── RemediationPanel.tsx  #   YAML viewer with one-click copy
│       │   └── Layout.tsx            #   Sidebar + header nav
│       └── App.tsx                   #   Root: API fetch hook + state management
│
├── sdk-clients/                      # Example instrumented services
│   └── ai-agent-demo/                #   Sample LLM agent with OTel GenAI instrumentation
├── alerts/                           # SigNoz alert rule definitions (YAML)
├── dashboard/                        # SigNoz dashboard JSON pack
├── pours/                            # Foundry pour definitions
├── tools/                            # Developer tooling & scripts
├── test/                             # Integration test suite
├── casting.yaml                      # Foundry deployment manifest ✅
├── casting.yaml.lock                 # Foundry lock file ✅
└── docker-compose.yml                # Local ClickHouse + dependencies
```

---

## 🤖 SigNoz MCP Server Integration

TelemetryHealth implements a full **Model Context Protocol (MCP)** server (`control-plane/internal/mcp/tools.go`), natively integrating with SigNoz's AI agent workflows.

The MCP server exposes two autonomous tools:

| MCP Tool | Description |
|---|---|
| `GetTelemetryHealth` | Returns real-time composite health score, cardinality metrics, orphan span rates, and coverage gaps for any tenant |
| `GenerateRemediation` | Autonomously requests a verified, structurally-validated OTel YAML config patch — e.g. drops a high-cardinality attribute |

**Run modes:**
```bash
# SSE mode (default, port 8081)
go run ./cmd/mcp-server

# stdio mode (for direct agent integration)
go run ./cmd/mcp-server --stdio
```

This turns TelemetryHealth from a passive dashboard into an **Autonomous Telemetry Intelligence Platform** — SigNoz AI agents can detect *and fix* pipeline health issues without human intervention.

---

## 📊 SigNoz Deep Integration

TelemetryHealth uses SigNoz as both a **data sink** and a **visualization + alerting platform**:

- **Custom OTel Metrics**: The processor emits `telemetryhealth.*` OTLP metrics (cardinality counts, orphan rates, coverage scores) into SigNoz via the standard OTLP exporter
- **Dashboard Pack**: Pre-built SigNoz JSON dashboards in `dashboard/` — including the **Composite Health Score** gauge, cardinality trend panels, orphan span rate charts, and coverage % heatmaps
- **Alert Rules**: Pre-configured SigNoz alert YAML definitions in `alerts/` — fire when health score drops below threshold or cardinality exceeds budget
- **Alertmanager Bridge**: The control plane's `internal/alerting/` package integrates with SigNoz Alertmanager with 15-minute cooldown deduplication to prevent alert storms
- **Foundry Deployment**: `casting.yaml` + `casting.yaml.lock` enable one-command reproducible deployment via SigNoz Foundry

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Go | ≥ 1.22 |
| Node.js | ≥ 20 |
| Docker | any |

### 1. Clone & Start

```bash
git clone https://github.com/CyberCodezilla/Telemetry_Health_SIGNOZ.git
cd Telemetry_Health_SIGNOZ
```

### 2. Start the Control Plane API

```bash
cd control-plane
go mod tidy
go run ./cmd/api-server
# REST API: http://localhost:8080
```

### 3. Start the MCP Server

```bash
# New terminal
cd control-plane
go run ./cmd/mcp-server
# MCP SSE endpoint: http://localhost:8081
```

### 4. Start the React Dashboard

```bash
# New terminal
cd dashboard
npm install
npm run dev
# Dashboard: http://localhost:5173
```

### 5. (Optional) Run the OTel Processor with ClickHouse

```bash
docker compose up -d
cd processor
go test ./... -v -cover
```

### 6. Deploy via SigNoz Foundry

```bash
# Requires SigNoz Foundry CLI
foundry cast apply casting.yaml
```

---

## 🔌 API Reference

### `GET /api/v1/tenant/{tenant_id}/health`

Returns current composite health state for a tenant.

```json
{
  "healthScore": 84,
  "metrics": {
    "cardinality": { "value": "1.2M", "change": 14.5 },
    "orphans":     { "value": "432",  "change": -5.2 },
    "coverage":    { "value": "14",   "change": 0 }
  },
  "remediation": {
    "issueType": "High Cardinality (user_id on checkout_service)",
    "yaml": "processors:\n  attributes/remediation:\n    actions:\n      - key: user_id\n        action: delete"
  }
}
```

### `POST /api/v1/tenant/{tenant_id}/remediation/apply`

Validates and applies a generated YAML patch to the OTel Collector config.

---

## 🔐 Security Model

TelemetryHealth was built with production-grade security from day one:

- **mTLS Everywhere**: The Ingest Gateway (`cmd/ingest-gateway`) requires mutual TLS for all incoming OTLP connections
- **Zero-Trust Tenant Verification**: Every gRPC call intercepts the `x-tenant-id` header and cryptographically verifies it against the client certificate's SPIFFE URI SAN — tenants cannot spoof each other's identity (`internal/authz/`, **100% test coverage**)
- **Fail-Open Circuit Breaker**: If the processor panics, the circuit breaker trips and allows telemetry to flow through unprocessed — **never drops data** (`processor/failopen/`, **93.9% coverage**)
- **YAML Allowlist Validation**: Generated remediation patches are validated against an OTel component allowlist before being surfaced — no arbitrary config injection

---

## 🧪 Test Coverage

```bash
# Processor
cd processor && go test ./... -cover

# Control Plane
cd control-plane && go test ./...
```

| Package | Coverage | Tests |
|---|---|---|
| `processor/cardinality` | **93.3%** | HLL accuracy, collision resistance |
| `processor/failopen` | **93.9%** | Circuit breaker open/close/reset |
| `control-plane/authz` | **100%** | SPIFFE SAN verification, tenant spoofing prevention |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ using Go · React · OpenTelemetry · SigNoz**

*"Your observability system deserves to be observed."*

</div>