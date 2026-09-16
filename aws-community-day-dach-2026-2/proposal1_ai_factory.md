# Proposal 1 — AI DevOps Agent (was: Serverless AI Factory)

**Event:** AWS Community Day DACH 2026 — Kosmos Berlin, 15 Sep 2026
**Form:** https://sessionize.com/aws-community-day-dach-2026
**Status:** Waitlist backup (Sessionize 10798)

---

## Session

### Session Title
AI DevOps Agent: VPS Control Plane, AWS Production

### Description (400–1500 chars)
I run OpenClaw, my AI agent, on a €10/month Hostinger VPS — not on Lambda. Telegram is the control plane; GitHub issues and heartbeats trigger plan → code → PR workflows with human merge gates. The AWS story is what the agent actually manages: HalloCasa (CDK, CodePipeline, prod SSO), ai-secure.dev (AgentCore, MCP scans), and qr-plakat.de (OpenNext on Lambda + CloudFront). In this session I'll show the honest two-tier architecture — persistent VPS for Cursor CLI sessions and state, AWS for production targets — and why I kept the VPS instead of migrating to serverless (no 15-minute ceiling, MEMORY.md on disk, Telegram always on). Then the real learnings: AWS SSO device-code from your phone, debugging agent runs vs CloudWatch, runaway token spend, and when human approval saves prod. Economics: ~€10 VPS + variable AWS + ~95% LLM tokens. Live demo: Telegram message → agent → PR → optional SSO deploy. For builders who want production AI agents without pretending everything belongs on Lambda.

### Session Type
Technical Session

### Level
400 (alt: 300)

---

## Speaker

Martin Mueller · office@martinmueller.dev · martinmueller.dev
