# Changelog

All notable changes to **FIFA Nexus AI** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.2.0] - 2026-07-09

### Added
- **Production-Grade Gemini AI Copilot** powered by `google-generativeai >= 0.5.0`
- **ChromaDB RAG** integration: 8 indexed stadium operational manuals including emergency procedures, volunteer handbooks, transport schedules, and accessibility guides
- **Multi-Agent Architecture**: Coordinator + 9 specialized sub-agents (Navigation, Security, Medical, Volunteer, Transportation, Accessibility, Sustainability, Communication, Operations Intelligence)
- **Real-Time Token Streaming** via WebSocket — token-by-token response rendering
- **Explainable AI (XAI)** blocks on every AI recommendation (Confidence %, Evidence, Expected Impact, Alternative Options)
- **Voice Support**: Speech-to-Text (Web Speech API) and Text-to-Speech output on AI responses
- **Function Calling Tools**: AI can now directly mutate live stadium state:
  - `order_food` — Places food concession orders
  - `deploy_volunteers` — Dispatches volunteers with task creation
  - `trigger_sos` — Logs critical security incidents
  - `open_gate` — Sends gate unlock commands
  - `restock_equipment` — Restores accessibility equipment inventory
  - `dispatch_medical` — Dispatches paramedic crews
- **Quick Action Prompts**: Role-based suggested prompts for every dashboard
- **Chat History Download**: Export conversation logs as `.txt` files
- **Copy to Clipboard**: Copy individual AI messages with one click
- **Graceful Fallback**: Intelligent simulation mode if Gemini API key is missing or rate-limited
- Unit & integration test suite `api/test_copilot.py` covering 5 test scenarios

### Changed
- Upgraded AI Copilot from mock simulation to real Gemini LLM integration
- Volunteer dashboard now uses the unified `<AIChat>` component with role-based context
- WebSocket `/ws` endpoint now streams tokens instead of returning complete responses
- `api/services/agents.py` fully rewritten with multi-agent coordinator architecture

### Fixed
- Modal z-index conflict with Leaflet map layers (Modal: `z-[10000]`, Toast: `z-[10002]`)
- Volunteer dispatch keyword matching now handles numbers between verb and noun
- Gemini GenerativeModel constructor compatibility with SDK `>= 0.5.0`

---

## [1.1.0] - 2026-07-09

### Added
- **Centralized Operational State Manager** (`api/services/state.py`) — in-memory digital twin for incidents, tasks, orders, medical queue, transport, and accessibility
- **Global Toast Notification System** (`web/src/components/Toast.tsx`)
- **Interactive Leaflet Map** with dynamic route polylines and emergency distress zones (`web/src/components/StadiumMap.tsx`)
- Full set of **REST API endpoints** in `api/main.py`:
  - Incident creation and resolution
  - Volunteer task accept/complete lifecycle
  - Food order placement with auto volunteer task creation
  - Patient triage status updates
  - Parking lot and shuttle management
  - Accessibility guide dispatch and equipment restocking
  - Volunteer shift check-in/out
  - Security threat level updates

### Changed
- **Fan Hub**: Connected food ordering, seat navigation, and SOS APIs
- **Command Center**: Real-time attendance/volunteers/incidents via WebSocket
- **Security Ops**: Live incident feed, threat level selector, manual incident forms
- **Volunteer Hub**: Interactive task accept/complete, shift check-in toggle
- **Medical Hub**: Patient triage table with ambulance dispatch actions
- **Transportation Hub**: VIP parking toggles, shuttle dispatch, traffic light presets
- **Accessibility Hub**: Wheelchair dispatch, audio guide restock, sensory room controls

### Fixed
- JSX unescaped `->` operator in Fan Hub causing Next.js build failures

---

## [1.0.0] - 2026-07-08

### Added
- Initial release of **FIFA Nexus AI** platform
- 7 role-based dashboards: Fan Hub, Command Center, Security Ops, Volunteer Hub, Medical Hub, Transportation Hub, Accessibility Hub
- Landing page with stadium selector and role navigation
- AI Chat mockup with WebSocket foundation
- Stadium map with Leaflet.js integration
- Docker Compose full-stack orchestration (Next.js + FastAPI + PostgreSQL + Redis)
- Glassmorphism dark UI theme with Framer Motion animations

---

[1.2.0]: https://github.com/zombie035/FIFA-Nexus-AI/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/zombie035/FIFA-Nexus-AI/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/zombie035/FIFA-Nexus-AI/releases/tag/v1.0.0
