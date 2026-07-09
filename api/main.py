from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from services.agents import process_message, generate_streaming_response
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
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="FIFA Nexus AI API",
    description="The Intelligent Stadium Operating System Backend",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial state on connection
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
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def broadcast_state():
    await manager.broadcast(json.dumps({
        "type": "state_update",
        "state": stadium_state
    }))

@app.get("/")
def read_root():
    return {"message": "Welcome to FIFA Nexus AI API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/state")
def get_state():
    return stadium_state

# Incident Endpoints
class IncidentCreate(BaseModel):
    location: str
    desc: str
    severity: str

@app.post("/api/incidents")
async def create_incident_endpoint(inc: IncidentCreate):
    new_inc = add_incident(inc.location, inc.desc, inc.severity)
    await broadcast_state()
    return new_inc

@app.post("/api/incidents/{incident_id}/resolve")
async def resolve_incident_endpoint(incident_id: int):
    success = resolve_incident(incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found")
    await broadcast_state()
    return {"status": "success"}

class ThreatLevelUpdate(BaseModel):
    threat_level: str

@app.post("/api/security/threat")
async def update_threat_level_endpoint(req: ThreatLevelUpdate):
    stadium_state["threat_level"] = req.threat_level
    await broadcast_state()
    return {"status": "success", "threat_level": req.threat_level}

# Task Endpoints
class TaskCreate(BaseModel):
    title: str
    location: str
    priority: str
    category: Optional[str] = "VOLUNTEER"

@app.post("/api/tasks")
async def create_task_endpoint(task: TaskCreate):
    new_task = add_task(task.title, task.location, task.priority, task.category)
    await broadcast_state()
    return new_task

@app.post("/api/tasks/{task_id}/accept")
async def accept_task_endpoint(task_id: int):
    success = accept_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    await broadcast_state()
    return {"status": "success"}

@app.post("/api/tasks/{task_id}/complete")
async def complete_task_endpoint(task_id: int):
    success = complete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    await broadcast_state()
    return {"status": "success"}

# Order Endpoints
class OrderCreate(BaseModel):
    item: str
    price: float
    location: str

@app.post("/api/orders")
async def create_order_endpoint(order: OrderCreate):
    new_order = add_order(order.item, order.price, order.location)
    await broadcast_state()
    return new_order

# Logistics / Transportation Endpoints
class RerouteRequest(BaseModel):
    corridor: str
    action: str

@app.post("/api/logistics/reroute")
async def reroute_endpoint(req: RerouteRequest):
    stadium_state["transport"]["traffic_signals"] = f"AI_SYNC_{req.corridor.upper()}_{req.action.upper()}"
    # Simulate a path redirection or custom notification
    add_incident(
        location="Corridor C",
        desc=f"Traffic diverted: routing fans via {req.corridor}.",
        severity="INFO"
    )
    await broadcast_state()
    return {"status": "success"}

class ParkingToggle(BaseModel):
    lot: str
    status: str

@app.post("/api/logistics/parking")
async def parking_endpoint(req: ParkingToggle):
    if req.lot in stadium_state["transport"]["parking_lots"]:
        stadium_state["transport"]["parking_lots"][req.lot] = req.status
        # If a parking lot becomes FULL, add a routing task / recommendation
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
async def dispatch_shuttle(shuttle_id: str = Body(..., embed=True)):
    for s in stadium_state["transport"]["shuttles"]:
        if s["id"] == shuttle_id:
            s["status"] = "EN_ROUTE"
            await broadcast_state()
            return {"status": "success"}
    
    # Or create a new shuttle dispatch
    new_shuttle = {"id": shuttle_id, "name": f"Backup Shuttle {shuttle_id}", "status": "EN_ROUTE", "route": "Terminal B - Gate 4"}
    stadium_state["transport"]["shuttles"].append(new_shuttle)
    await broadcast_state()
    return {"status": "success"}

# Medical Endpoints
class PatientTriage(BaseModel):
    name: str
    gate: str
    condition: str
    severity: str

@app.post("/api/medical/triage")
async def triage_patient(p: PatientTriage):
    new_patient = add_patient(p.name, p.gate, p.condition, p.severity)
    await broadcast_state()
    return new_patient

@app.post("/api/medical/patients/{patient_id}/status")
async def set_patient_status(patient_id: int, status: str = Body(..., embed=True)):
    success = update_patient_status(patient_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    await broadcast_state()
    return {"status": "success"}

# Accessibility Endpoints
class RestockRequest(BaseModel):
    item: str
    amount: int

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
    for r in stadium_state["accessibility"]["requests"]:
        if r["id"] == req_id:
            r["status"] = "DISPATCHED"
            # Automatically add a Volunteer task
            add_task(f"Assist with {r['type']} at {r['location']}", r["location"], "MEDIUM", "ACCESSIBILITY")
            await broadcast_state()
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Request not found")

# Volunteer Check In/Out
class VolunteerShiftToggle(BaseModel):
    active: bool

@app.post("/api/volunteer/shift")
async def toggle_volunteer_shift(req: VolunteerShiftToggle):
    if req.active:
        stadium_state["volunteers"] += 1
    else:
        stadium_state["volunteers"] = max(0, stadium_state["volunteers"] - 1)
    await broadcast_state()
    return {"volunteers": stadium_state["volunteers"]}

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
                
                # Send typing indicator
                await websocket.send_text(json.dumps({
                    "type": "status",
                    "content": "Thinking..."
                }))
                
                # Signal start of streaming
                await websocket.send_text(json.dumps({
                    "type": "stream_start"
                }))
                
                # Stream chunks back
                for token in generate_streaming_response(user_msg, role):
                    await websocket.send_text(json.dumps({
                        "type": "token",
                        "content": token
                    }))
                    await asyncio.sleep(0.01)
                
                # Signal end of streaming
                await websocket.send_text(json.dumps({
                    "type": "stream_end"
                }))
                
                # Broadcast updated state since tools might have executed changes!
                await broadcast_state()
                
            except json.JSONDecodeError:
                await websocket.send_text("Invalid JSON format")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulate_events())
    asyncio.create_task(simulate_security_events())

async def simulate_events():
    while True:
        await asyncio.sleep(25)
        import random
        gates = ["Gate 1", "Gate 2", "Gate 3", "Gate 4", "Gate 5", "Gate 6"]
        high_gate = random.choice(gates)
        # Update state directly
        stadium_state["attendance"] += random.randint(-10, 15)
        # Randomly toggle crowd alert for demonstration
        if random.random() > 0.7:
            # Add a temporary task or notice
            pass
        await broadcast_state()

async def simulate_security_events():
    while True:
        await asyncio.sleep(60)
        import random
        incidents_list = [
            {"location": "Gate 2", "desc": "Unauthorized entry attempt detected.", "severity": "MEDIUM"},
            {"location": "Sector F", "desc": "Medical assistance required near food court.", "severity": "HIGH"},
            {"location": "VIP Lounge", "desc": "Access control door status irregular.", "severity": "MEDIUM"}
        ]
        chosen = random.choice(incidents_list)
        add_incident(chosen["location"], chosen["desc"], chosen["severity"])
        await broadcast_state()
