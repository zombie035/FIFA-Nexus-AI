from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import json
import re
import asyncio
from services.agents import generate_streaming_response
from services.state import (
    stadium_state,
    add_incident,
    resolve_incident,
    add_task,
    accept_task,
    complete_task,
    add_order,
    add_patient,
    update_patient_status
)
from pydantic import BaseModel, Field, field_validator
from typing import Optional

# ── Rate Limiter ────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="FIFA Nexus AI API",
    description="The Intelligent Stadium Operating System Backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# ── Prompt Injection Guard ───────────────────────────────────────────────────
INJECTION_PATTERNS = [
    r"ignore (all |previous |above |prior )?instructions",
    r"forget (all |previous |above |prior )?instructions",
    r"you are now",
    r"act as (a|an) (different|new|unrestricted)",
    r"jailbreak",
    r"system prompt",
    r"disregard (your|all) (rules|guidelines|constraints)",
    r"pretend (you are|to be)",
    r"reveal (your|the) (system|hidden) prompt",
]

def detect_prompt_injection(text: str) -> bool:
    text_lower = text.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False

def sanitize_input(text: str) -> str:
    """Remove potential HTML/script injection and trim whitespace."""
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Normalize whitespace
    text = " ".join(text.split())
    return text.strip()

# ── Connection Manager ───────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        try:
            await websocket.send_text(json.dumps({
                "type": "state_update",
                "state": stadium_state
            }))
        except Exception:
            pass

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

manager = ConnectionManager()

async def broadcast_state():
    await manager.broadcast(json.dumps({
        "type": "state_update",
        "state": stadium_state
    }))

# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "FIFA Nexus AI API", "version": "1.0.0", "status": "operational"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "connections": len(manager.active_connections)}

@app.get("/api/state")
def get_state():
    return stadium_state

# ── Input Models with Validation ─────────────────────────────────────────────
class IncidentCreate(BaseModel):
    location: str = Field(..., min_length=1, max_length=100)
    desc: str = Field(..., min_length=1, max_length=500)
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL|INFO)$")

    @field_validator("location", "desc")
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        return sanitize_input(v)

class ThreatLevelUpdate(BaseModel):
    threat_level: str = Field(..., pattern="^(NORMAL|ELEVATED|HIGH|CRITICAL ALARM)$")

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    location: str = Field(..., min_length=1, max_length=100)
    priority: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    category: Optional[str] = Field("VOLUNTEER", pattern="^(VOLUNTEER|SECURITY|MEDICAL|TRANSPORT|ACCESSIBILITY|VOLUNTEER|SUSTAINABILITY)$")

    @field_validator("title", "location")
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        return sanitize_input(v)

class OrderCreate(BaseModel):
    item: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0.0, le=1000.0)
    location: str = Field(..., min_length=1, max_length=100)

    @field_validator("item", "location")
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        return sanitize_input(v)

class RerouteRequest(BaseModel):
    corridor: str = Field(..., min_length=1, max_length=50)
    action: str = Field(..., pattern="^(divert|open|close|monitor)$")

class ParkingToggle(BaseModel):
    lot: str = Field(..., min_length=1, max_length=50)
    status: str = Field(..., pattern="^(OPEN|FULL|CLOSED|RESERVED)$")

class PatientTriage(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    gate: str = Field(..., min_length=1, max_length=50)
    condition: str = Field(..., min_length=1, max_length=200)
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")

    @field_validator("name", "condition")
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        return sanitize_input(v)

class RestockRequest(BaseModel):
    item: str = Field(..., pattern="^(audio_guides|sensory_cap)$")
    amount: int = Field(..., ge=1, le=500)

class VolunteerShiftToggle(BaseModel):
    active: bool

# ── Incident Endpoints ───────────────────────────────────────────────────────
@app.post("/api/incidents")
async def create_incident_endpoint(inc: IncidentCreate):
    new_inc = add_incident(inc.location, inc.desc, inc.severity)
    await broadcast_state()
    return new_inc

@app.post("/api/incidents/{incident_id}/resolve")
async def resolve_incident_endpoint(incident_id: int):
    if incident_id < 0 or incident_id > 100000:
        raise HTTPException(status_code=400, detail="Invalid incident ID")
    success = resolve_incident(incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found")
    await broadcast_state()
    return {"status": "success"}

@app.post("/api/security/threat")
async def update_threat_level_endpoint(req: ThreatLevelUpdate):
    stadium_state["threat_level"] = req.threat_level
    await broadcast_state()
    return {"status": "success", "threat_level": req.threat_level}

# ── Task Endpoints ────────────────────────────────────────────────────────────
@app.post("/api/tasks")
async def create_task_endpoint(task: TaskCreate):
    new_task = add_task(task.title, task.location, task.priority, task.category)
    await broadcast_state()
    return new_task

@app.post("/api/tasks/{task_id}/accept")
async def accept_task_endpoint(task_id: int):
    if task_id < 0:
        raise HTTPException(status_code=400, detail="Invalid task ID")
    success = accept_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    await broadcast_state()
    return {"status": "success"}

@app.post("/api/tasks/{task_id}/complete")
async def complete_task_endpoint(task_id: int):
    if task_id < 0:
        raise HTTPException(status_code=400, detail="Invalid task ID")
    success = complete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    await broadcast_state()
    return {"status": "success"}

# ── Order Endpoints ───────────────────────────────────────────────────────────
@app.post("/api/orders")
async def create_order_endpoint(order: OrderCreate):
    new_order = add_order(order.item, order.price, order.location)
    await broadcast_state()
    return new_order

# ── Logistics / Transportation ────────────────────────────────────────────────
@app.post("/api/logistics/reroute")
async def reroute_endpoint(req: RerouteRequest):
    stadium_state["transport"]["traffic_signals"] = f"AI_SYNC_{req.corridor.upper()}_{req.action.upper()}"
    add_incident(
        location="Corridor C",
        desc=f"Traffic diverted: routing fans via {sanitize_input(req.corridor)}.",
        severity="INFO"
    )
    await broadcast_state()
    return {"status": "success"}

@app.post("/api/logistics/parking")
async def parking_endpoint(req: ParkingToggle):
    if req.lot in stadium_state["transport"]["parking_lots"]:
        stadium_state["transport"]["parking_lots"][req.lot] = req.status
        if req.status == "FULL":
            add_task(
                title=f"Redirect parking traffic from {req.lot}",
                location=req.lot,
                priority="MEDIUM",
                category="TRANSPORT"
            )
        await broadcast_state()
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Parking lot not found")

@app.post("/api/logistics/shuttles")
async def dispatch_shuttle(shuttle_id: str = Body(..., embed=True, min_length=1, max_length=20)):
    shuttle_id = sanitize_input(shuttle_id)
    for s in stadium_state["transport"]["shuttles"]:
        if s["id"] == shuttle_id:
            s["status"] = "EN_ROUTE"
            await broadcast_state()
            return {"status": "success"}
    new_shuttle = {"id": shuttle_id, "name": f"Backup Shuttle {shuttle_id}", "status": "EN_ROUTE", "route": "Terminal B - Gate 4"}
    stadium_state["transport"]["shuttles"].append(new_shuttle)
    await broadcast_state()
    return {"status": "success"}

# ── Medical Endpoints ─────────────────────────────────────────────────────────
@app.post("/api/medical/triage")
async def triage_patient(p: PatientTriage):
    new_patient = add_patient(p.name, p.gate, p.condition, p.severity)
    await broadcast_state()
    return new_patient

@app.post("/api/medical/patients/{patient_id}/status")
async def set_patient_status(patient_id: int, status: str = Body(..., embed=True)):
    if patient_id < 0:
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    allowed = {"QUEUED", "DISPATCHED", "TREATING", "RESOLVED"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed}")
    success = update_patient_status(patient_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    await broadcast_state()
    return {"status": "success"}

# ── Accessibility Endpoints ───────────────────────────────────────────────────
@app.post("/api/accessibility/restock")
async def restock_accessibility(req: RestockRequest):
    if req.item == "audio_guides":
        stadium_state["accessibility"]["audio_guides"] += req.amount
    elif req.item == "sensory_cap":
        stadium_state["accessibility"]["sensory_cap"] = min(100, stadium_state["accessibility"]["sensory_cap"] + req.amount)
    await broadcast_state()
    return {"status": "success"}

@app.post("/api/accessibility/dispatch")
async def dispatch_accessibility_volunteer(req_id: int = Body(..., embed=True)):
    if req_id < 0:
        raise HTTPException(status_code=400, detail="Invalid request ID")
    for r in stadium_state["accessibility"]["requests"]:
        if r["id"] == req_id:
            r["status"] = "DISPATCHED"
            add_task(f"Assist with {r['type']} at {r['location']}", r["location"], "MEDIUM", "ACCESSIBILITY")
            await broadcast_state()
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Request not found")

# ── Volunteer Endpoints ───────────────────────────────────────────────────────
@app.post("/api/volunteer/shift")
async def toggle_volunteer_shift(req: VolunteerShiftToggle):
    if req.active:
        stadium_state["volunteers"] += 1
    else:
        stadium_state["volunteers"] = max(0, stadium_state["volunteers"] - 1)
    await broadcast_state()
    return {"volunteers": stadium_state["volunteers"]}

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                user_msg = payload.get("message", "")
                role = payload.get("role", "Fan")

                # Input validation
                if not user_msg or not isinstance(user_msg, str):
                    await websocket.send_text(json.dumps({"type": "error", "content": "Invalid message."}))
                    continue

                # Truncate oversized messages
                user_msg = user_msg[:1000]
                role = role[:50] if isinstance(role, str) else "Fan"

                # Prompt injection detection
                if detect_prompt_injection(user_msg):
                    await websocket.send_text(json.dumps({
                        "type": "message",
                        "content": "⚠️ Query flagged as potentially unsafe. Please rephrase your request using standard stadium operations commands.",
                        "sender": "Security Filter"
                    }))
                    continue

                user_msg = sanitize_input(user_msg)

                # Send typing indicator
                await websocket.send_text(json.dumps({
                    "type": "status",
                    "content": "Thinking..."
                }))

                # Signal start of streaming
                await websocket.send_text(json.dumps({"type": "stream_start"}))

                # Stream chunks back
                for token in generate_streaming_response(user_msg, role):
                    await websocket.send_text(json.dumps({
                        "type": "token",
                        "content": token
                    }))
                    await asyncio.sleep(0.01)

                # Signal end of streaming
                await websocket.send_text(json.dumps({"type": "stream_end"}))

                # Broadcast updated state
                await broadcast_state()

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "content": "Invalid JSON format."}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ── Background Simulation ─────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulate_events())
    asyncio.create_task(simulate_security_events())

async def simulate_events():
    while True:
        await asyncio.sleep(25)
        import random
        stadium_state["attendance"] += random.randint(-10, 15)
        await broadcast_state()

async def simulate_security_events():
    while True:
        await asyncio.sleep(60)
        import random
        incidents_list = [
            {"location": "Gate 2", "desc": "Unauthorized entry attempt detected.", "severity": "MEDIUM"},
            {"location": "Sector F", "desc": "Medical assistance required near food court.", "severity": "HIGH"},
            {"location": "VIP Lounge", "desc": "Access control door status irregular.", "severity": "MEDIUM"},
        ]
        chosen = random.choice(incidents_list)
        add_incident(chosen["location"], chosen["desc"], chosen["severity"])
        await broadcast_state()
