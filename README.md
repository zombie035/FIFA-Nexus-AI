# ⚽ FIFA Nexus AI — Intelligent Stadium Operating System

<div align="center">

![FIFA Nexus AI](https://img.shields.io/badge/FIFA%20Nexus%20AI-World%20Cup%202026-gold?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**The world's most advanced AI-powered stadium management platform for FIFA World Cup 2026**

[🚀 Quick Start](#quick-start) • [🏗️ Architecture](#architecture) • [✨ Features](#features) • [📖 API Docs](#api-documentation) • [🤝 Contributing](#contributing)

</div>

---

## 🌟 Overview

FIFA Nexus AI is a production-grade, enterprise-level Intelligent Stadium Operating System designed specifically for **FIFA World Cup 2026**. It acts as the central AI brain of a stadium — coordinating fans, volunteers, security, medical teams, and transportation in real time through a unified dashboard ecosystem powered by Google's Gemini LLM.

---

## ✨ Features

### 🤖 AI Copilot (Gemini-Powered)
- **Multi-Agent Architecture**: 9 specialized agents (Navigation, Security, Medical, Volunteer, Transportation, Accessibility, Sustainability, Communication, Operations Intelligence)
- **RAG (Retrieval-Augmented Generation)**: ChromaDB vector store indexing stadium manuals, emergency procedures, and operational guides
- **Real-Time Token Streaming**: Token-by-token response rendering via WebSockets
- **Explainable AI**: Every recommendation includes confidence score, evidence, expected impact, and alternatives
- **Voice Commands**: Speech-to-Text and Text-to-Speech via Web Speech API
- **Function Calling**: AI can directly mutate live stadium state (dispatch volunteers, place orders, trigger SOS)
- **Multilingual Support**: 10+ languages supported
- **Graceful Fallback**: Full functionality even without an API key via intelligent simulation

### 🏟️ Stadium Dashboards (7 Role-Based Views)
| Dashboard | Role | Key Features |
|-----------|------|--------------|
| **Fan Hub** | Fan | Food ordering, seat navigation, SOS alerts |
| **Command Center** | Organizer | Live attendance, volunteer management, crowd analytics |
| **Security Ops** | Security Officer | Incident management, threat levels, CCTV dispatch |
| **Volunteer Hub** | Volunteer | Task management, shift tracking, AR navigation |
| **Medical Hub** | Medical Staff | Patient triage queue, ambulance dispatch, paramedic routing |
| **Transport Hub** | Transport Manager | Parking control, shuttle dispatch, metro monitoring |
| **Accessibility Hub** | Accessibility Coordinator | Wheelchair escorts, audio guides, sensory room management |

### 🗺️ Real-Time Digital Twin
- Live stadium map with Leaflet.js integration
- Dynamic route highlighting and emergency zone overlays
- Real-time crowd density heatmaps
- WebSocket-powered state broadcasting to all connected clients

### 🔔 Cross-Dashboard Coordination
- Food order in Fan Hub → volunteer task auto-created in Volunteer Hub
- SOS trigger → incident logged in Security + Medical + Organizer dashboards simultaneously
- Volunteer task completion → fan order marked as delivered

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FIFA Nexus AI                        │
├─────────────────┬───────────────────────────────────────┤
│   Frontend      │           Backend                     │
│   (Next.js 16)  │         (FastAPI)                     │
│                 │                                       │
│  ┌───────────┐  │  ┌──────────┐  ┌──────────────────┐  │
│  │ Fan Hub   │  │  │ REST API │  │  Gemini AI Agent │  │
│  │ Organizer │◄─┼─►│ WebSocket│  │  ChromaDB RAG    │  │
│  │ Security  │  │  │ /ws      │  │  Multi-Agent     │  │
│  │ Volunteer │  │  └──────────┘  └──────────────────┘  │
│  │ Medical   │  │       │                │              │
│  │ Transport │  │  ┌────▼────────────────▼─────────┐   │
│  │ Access.   │  │  │       Stadium State Manager   │   │
│  └───────────┘  │  │  Incidents | Tasks | Orders   │   │
│                 │  │  Medical   | Transport | Access│   │
│  ┌───────────┐  │  └───────────────────────────────┘   │
│  │ AIChat    │  │       │              │                │
│  │ Streaming │  │  ┌────▼────┐   ┌────▼────┐           │
│  │ Voice     │  │  │Postgres │   │  Redis  │           │
│  └───────────┘  │  └─────────┘   └─────────┘           │
└─────────────────┴───────────────────────────────────────┘
```

### Services
| Service | Port | Description |
|---------|------|-------------|
| `web` | 3000 | Next.js Frontend |
| `api` | 8000 | FastAPI Backend + WebSocket Server |
| `postgres` | 5432 | PostgreSQL Database |
| `redis` | 6379 | Redis Cache & Message Broker |

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/zombie035/FIFA-Nexus-AI.git
cd FIFA-Nexus-AI
```

### 2. Configure API Key (Optional but Recommended)
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> 💡 Get a free Gemini API key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
> 
> Without an API key, the application runs in **smart simulation mode** — all features remain functional with intelligent mock AI responses.

### 3. Launch the Application
```bash
docker-compose up --build
```

### 4. Access the Platform
| Service | URL |
|---------|-----|
| 🌐 **Stadium Dashboard** | http://localhost:3000 |
| 📖 **API Documentation** | http://localhost:8000/docs |
| 🔌 **WebSocket Endpoint** | ws://localhost:8000/ws |

---

## 📁 Project Structure

```
FIFA-Nexus-AI/
├── api/                          # FastAPI Backend
│   ├── main.py                   # REST API routes + WebSocket server
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # API container definition
│   ├── test_copilot.py           # Unit & integration tests
│   └── services/
│       ├── agents.py             # Gemini multi-agent system + function calling
│       ├── rag.py                # ChromaDB RAG indexing & retrieval
│       └── state.py              # In-memory digital twin state manager
│
├── web/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                  # Page routes
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── fan/              # Fan Hub dashboard
│   │   │   ├── organizer/        # Command Center
│   │   │   ├── security/         # Security Operations
│   │   │   ├── volunteer/        # Volunteer Hub
│   │   │   ├── medical/          # Medical Hub
│   │   │   ├── transportation/   # Transport Hub
│   │   │   └── accessibility/    # Accessibility Hub
│   │   └── components/
│   │       ├── AIChat.tsx        # Gemini AI Copilot chat widget
│   │       ├── StadiumMap.tsx    # Leaflet.js interactive map
│   │       ├── Modal.tsx         # Reusable modal component
│   │       └── Toast.tsx         # Real-time notification system
│   ├── Dockerfile                # Web container definition
│   └── package.json
│
├── docker-compose.yml            # Full-stack orchestration
├── .gitignore                    # Excludes secrets & build artifacts
└── README.md
```

---

## 🔌 API Documentation

### REST Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/state` | Get full stadium digital twin state |
| `POST` | `/api/incidents` | Create a new security incident |
| `POST` | `/api/incidents/{id}/resolve` | Resolve an active incident |
| `POST` | `/api/tasks/{id}/accept` | Accept a volunteer task |
| `POST` | `/api/tasks/{id}/complete` | Complete a volunteer task |
| `POST` | `/api/orders` | Place a concessions food order |
| `POST` | `/api/medical/patients/{id}/status` | Update patient triage status |
| `POST` | `/api/logistics/parking` | Toggle VIP parking lot status |
| `POST` | `/api/logistics/shuttles` | Dispatch a backup shuttle |
| `POST` | `/api/accessibility/dispatch` | Dispatch accessibility guide |
| `POST` | `/api/accessibility/restock` | Restock accessibility equipment |
| `POST` | `/api/volunteer/shift` | Toggle volunteer shift status |
| `POST` | `/api/security/threat` | Update stadium threat level |

### WebSocket Protocol (`/ws`)
Send JSON messages to the WebSocket:
```json
{
  "message": "Deploy 5 volunteers to Gate 4",
  "role": "Organizer"
}
```

The server streams back:
```json
{ "type": "stream_start" }
{ "type": "token", "content": "🏟️ " }
{ "type": "token", "content": "Deploying..." }
{ "type": "stream_end" }
{ "type": "state", "data": { ...updatedStadiumState } }
```

---

## 🧪 Running Tests

```bash
docker-compose exec api python test_copilot.py
```

Test coverage includes:
- ✅ RAG document seeding and vector retrieval
- ✅ Food order tool calling → state mutation
- ✅ Volunteer dispatch tool calling → task creation
- ✅ SOS emergency tool → critical incident logging
- ✅ Streaming response with Explainable AI block validation

---

## 🛠️ Development

### Running Without Docker (Local Development)

**Backend:**
```bash
cd api
pip install -r requirements.txt
GEMINI_API_KEY=your_key uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full history of changes.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for **FIFA World Cup 2026** by the FIFA Nexus AI Team

⭐ **Star this repo** if you find it useful!

</div>
