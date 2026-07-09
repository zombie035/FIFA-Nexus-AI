# FIFA Nexus AI: The Intelligent Stadium Operating System

An enterprise-level GenAI platform designed for the FIFA World Cup 2026. This system acts as an AI Operating System for stadiums, featuring real-time dashboards, multi-agent AI assistants, crowd intelligence, and emergency routing.

## Features

- **AI Stadium Copilot**: Conversational assistant for navigation and stadium info.
- **Smart Crowd Intelligence**: Heatmaps and density monitoring.
- **AI Route Optimizer**: Dynamic path planning.
- **Emergency AI Assistant**: Automated evacuation routing and alerts.
- **Dashboards**: Dedicated views for Fans, Organizers, Volunteers, and Security.

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Backend**: FastAPI, Python 3.11, WebSockets
- **AI Engine**: LangChain, OpenAI/Gemini support
- **Infrastructure**: Docker, PostgreSQL, Redis

## Quick Start (Local Development)

The entire application can be run locally using Docker Compose.

### Prerequisites
- Docker & Docker Compose installed.

### Environment Variables
You can optionally provide an API key in a `.env` file in the `api/` directory if you want to use real LLMs instead of mock responses.
```env
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### Run the System

1. Clone this repository (or navigate to the project directory).
2. Run the following command:
```bash
docker-compose up --build
```
3. Access the web dashboard at: `http://localhost:3000`
4. Access the API documentation at: `http://localhost:8000/docs`

## Architecture

The project consists of two main microservices:
- `api/`: FastAPI backend handling business logic, DB interactions, and AI agent orchestration.
- `web/`: Next.js frontend serving the beautiful, responsive, and dynamic UI.
