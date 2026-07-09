import time

# Global in-memory state
stadium_state = {
    "incidents": [
        {"id": 1, "time": "16:42", "location": "Gate 4", "desc": "Suspicious package reported. Officer deployed.", "severity": "HIGH", "status": "IN_PROGRESS"},
        {"id": 2, "time": "16:35", "location": "Sector C", "desc": "Crowd crush warning. Flow rate restricted.", "severity": "MEDIUM", "status": "IN_PROGRESS"}
    ],
    "tasks": [
        {"id": 1, "title": "Wheelchair Assistance Required", "location": "Gate 2, Sector A", "status": "PENDING", "priority": "HIGH", "category": "ACCESSIBILITY"},
        {"id": 2, "title": "Crowd Control Support", "location": "Concourse C", "status": "IN_PROGRESS", "priority": "MEDIUM", "category": "SECURITY"},
        {"id": 3, "title": "Language Translation (Spanish)", "location": "Merchandise Store East", "status": "PENDING", "priority": "LOW", "category": "VOLUNTEER"}
    ],
    "orders": [
        {"id": 1, "item": "Classic Burger Combo", "price": 12, "quantity": 1, "status": "PREPARING", "location": "Seat 42F"},
        {"id": 2, "item": "Cold Beverage", "price": 5, "quantity": 2, "status": "DELIVERED", "location": "Seat 12B"}
    ],
    "attendance": 45200,
    "energy": 1.2,  # MW
    "active_incidents": 2,
    "volunteers": 450,
    "deployed_officers": 142,
    "camera_status": "98% ONLINE",
    "threat_level": "ELEVATED",
    "medical": {
        "active_cases": 3,
        "available_beds": 42,
        "deployed_medics": 18,
        "response_time": "1m 45s",
        "patients": [
            {"id": 1, "name": "Patient #102", "gate": "Gate 6", "condition": "Heat Stroke", "status": "QUEUED", "severity": "HIGH"},
            {"id": 2, "name": "Patient #103", "gate": "Gate 2", "condition": "Minor Injury", "status": "QUEUED", "severity": "LOW"},
            {"id": 3, "name": "Patient #104", "gate": "Sector C", "condition": "Dehydration", "status": "DISPATCHED", "severity": "MEDIUM"}
        ]
    },
    "transport": {
        "metro_load": 95,
        "bus_fleet": 45,
        "parking_cap": 82,
        "traffic_delay": 12,
        "shuttles": [
            {"id": "SH-1", "name": "VIP Shuttle 1", "status": "EN_ROUTE", "route": "Terminal A - Gate 6"},
            {"id": "SH-2", "name": "Shuttle Bus 2", "status": "DELAYED", "route": "Metro - Gate 2"},
            {"id": "SH-3", "name": "Shuttle Bus 3", "status": "TERMINAL", "route": "Parking Lot East - Gate 1"}
        ],
        "parking_lots": {
            "VIP North": "OPEN",
            "VIP South": "OPEN",
            "East Lot": "OPEN"
        },
        "traffic_signals": "AI_SYNC"
    },
    "accessibility": {
        "requests": [
            {"id": 1, "type": "Wheelchair Escort", "location": "Gate 2", "status": "PENDING"},
            {"id": 2, "type": "ASL Interpreter", "location": "Gate 6", "status": "PENDING"}
        ],
        "sensory_cap": 75,
        "audio_guides": 150,
        "asl_volunteers": 8
    }
}

task_id_counter = 4
incident_id_counter = 3
order_id_counter = 3
patient_id_counter = 4

def get_current_time_str():
    import datetime
    return datetime.datetime.now().strftime("%H:%M")

def add_incident(location: str, desc: str, severity: str) -> dict:
    global incident_id_counter
    new_inc = {
        "id": incident_id_counter,
        "time": get_current_time_str(),
        "location": location,
        "desc": desc,
        "severity": severity,
        "status": "IN_PROGRESS"
    }
    stadium_state["incidents"].insert(0, new_inc)
    stadium_state["active_incidents"] = len([i for i in stadium_state["incidents"] if i["status"] != "RESOLVED"])
    incident_id_counter += 1
    
    # If CRITICAL or HIGH, also add medical case/triage automatically
    if severity in ["CRITICAL", "HIGH"]:
        add_patient(f"Casualty #{incident_id_counter-1}", location, "Trauma/SOS Alert", severity)
        
    # Also add a high priority volunteer task
    add_task(f"Assist Security at {location}", location, severity, "SECURITY")
    
    return new_inc

def resolve_incident(incident_id: int) -> bool:
    for inc in stadium_state["incidents"]:
        if inc["id"] == incident_id:
            inc["status"] = "RESOLVED"
            stadium_state["active_incidents"] = len([i for i in stadium_state["incidents"] if i["status"] != "RESOLVED"])
            return True
    return False

def add_task(title: str, location: str, priority: str, category: str = "VOLUNTEER") -> dict:
    global task_id_counter
    new_task = {
        "id": task_id_counter,
        "title": title,
        "location": location,
        "status": "PENDING",
        "priority": priority,
        "category": category
    }
    stadium_state["tasks"].insert(0, new_task)
    task_id_counter += 1
    return new_task

def accept_task(task_id: int) -> bool:
    for t in stadium_state["tasks"]:
        if t["id"] == task_id:
            t["status"] = "IN_PROGRESS"
            return True
    return False

def complete_task(task_id: int) -> bool:
    for t in stadium_state["tasks"]:
        if t["id"] == task_id:
            t["status"] = "COMPLETED"
            
            # If this task was associated with a food/merch order, mark order delivered
            if "Deliver" in t["title"]:
                for o in stadium_state["orders"]:
                    if o["status"] != "DELIVERED" and o["location"] in t["title"]:
                        o["status"] = "DELIVERED"
            return True
    return False

def add_order(item: str, price: float, location: str) -> dict:
    global order_id_counter
    new_order = {
        "id": order_id_counter,
        "item": item,
        "price": price,
        "quantity": 1,
        "status": "PREPARING",
        "location": location
    }
    stadium_state["orders"].insert(0, new_order)
    order_id_counter += 1
    
    # Automatically add a Volunteer task to deliver the order!
    add_task(f"Deliver {item} to {location}", f"Stand -> {location}", "MEDIUM", "VOLUNTEER")
    return new_order

def add_patient(name: str, gate: str, condition: str, severity: str) -> dict:
    global patient_id_counter
    new_patient = {
        "id": patient_id_counter,
        "name": name,
        "gate": gate,
        "condition": condition,
        "status": "QUEUED",
        "severity": severity
    }
    stadium_state["medical"]["patients"].append(new_patient)
    stadium_state["medical"]["active_cases"] = len([p for p in stadium_state["medical"]["patients"] if p["status"] != "RESOLVED"])
    patient_id_counter += 1
    return new_patient

def update_patient_status(patient_id: int, status: str) -> bool:
    for p in stadium_state["medical"]["patients"]:
        if p["id"] == patient_id:
            p["status"] = status
            stadium_state["medical"]["active_cases"] = len([p for p in stadium_state["medical"]["patients"] if p["status"] != "RESOLVED"])
            return True
    return False
