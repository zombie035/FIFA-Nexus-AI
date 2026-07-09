import os
import time
import json
import random
from services.state import (
    stadium_state,
    add_order,
    add_incident,
    add_task,
    resolve_incident,
    update_patient_status
)
from services.rag import query_stadium_docs
import google.generativeai as genai

# Initialize Gemini Model
api_key = os.getenv("GEMINI_API_KEY")
is_model_initialized = False

if api_key and len(api_key.strip()) > 10:
    try:
        genai.configure(api_key=api_key)
        # Verify listing models or test call
        is_model_initialized = True
        print("Gemini LLM model initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Gemini SDK: {e}. Falling back to simulated AI mode.")

def detect_and_execute_tools(message: str) -> dict:
    """
    Scans the user query for specific operational command keywords (Function Calling),
    executes them directly on the stadium state, and returns action logs.
    """
    msg = message.lower()
    actions = []
    
    # 1. Concessions Ordering
    if "order" in msg:
        if "burger" in msg:
            new_ord = add_order("Classic Burger Combo", 12.0, "Seat 42F")
            actions.append({
                "action": "order_food",
                "detail": f"Placed order for Classic Burger Combo ($12) to Seat 42F (Order #{new_ord['id']})",
                "impact": "Volunteer delivery task auto-created and dispatched."
            })
        elif "drink" in msg or "beverage" in msg:
            new_ord = add_order("Cold Beverage", 5.0, "Seat 42F")
            actions.append({
                "action": "order_food",
                "detail": f"Placed order for Cold Beverage ($5) to Seat 42F (Order #{new_ord['id']})",
                "impact": "Order queued at concessions stand."
            })

    # 2. Deploy Volunteers
    if ("deploy" in msg or "dispatch" in msg or "send" in msg) and ("volunteer" in msg or "volunteers" in msg):
        # Check location keywords
        location = "Sector A"
        if "gate 1" in msg: location = "Gate 1"
        elif "gate 2" in msg: location = "Gate 2"
        elif "gate 4" in msg: location = "Gate 4"
        elif "gate 6" in msg: location = "Gate 6"
        elif "section b" in msg: location = "Section B"
        elif "hvac" in msg: location = "HVAC Zone 4"
        
        # Check counts
        count = 5
        for word in msg.split():
            if word.isdigit():
                count = int(word)
                break
                
        new_task = add_task(f"Deploy {count} volunteers for crowd control support", location, "HIGH", "VOLUNTEER")
        actions.append({
            "action": "deploy_volunteers",
            "detail": f"Dispatched {count} volunteers to {location} (Task #{new_task['id']})",
            "impact": "Volunteer shift roster updated. Sector capacity optimized."
        })

    # 3. Security Emergencies / Announcement
    if "sos" in msg or "emergency" in msg or "accident" in msg or "report fight" in msg:
        location = "Gate 6"
        if "gate 1" in msg: location = "Gate 1"
        elif "gate 2" in msg: location = "Gate 2"
        elif "gate 4" in msg: location = "Gate 4"
        
        new_inc = add_incident(location, f"Emergency incident logged via AI Copilot: {message}", "CRITICAL")
        actions.append({
            "action": "trigger_sos",
            "detail": f"Logged CRITICAL security incident #{new_inc['id']} at {location}",
            "impact": "Security & medical crews auto-dispatched. Alarms activated."
        })

    # 4. Open / Block Gates
    if "open gate" in msg or "unlock gate" in msg:
        gate = "Gate 5"
        if "gate 1" in msg: gate = "Gate 1"
        elif "gate 2" in msg: gate = "Gate 2"
        elif "gate 4" in msg: gate = "Gate 4"
        elif "gate 6" in msg: gate = "Gate 6"
        
        # Add INFO incident to show unlocking
        add_incident(gate, f"{gate} unlocked via AI command console.", "INFO")
        actions.append({
            "action": "open_gate",
            "detail": f"Gate unlock signals sent to {gate}",
            "impact": "Turnstiles open. Concourse density diverted."
        })

    # 5. Restock equipment
    if "restock" in msg or "replenish" in msg:
        item = "audio_guides"
        amount = 25
        if "audio" in msg:
            item = "audio_guides"
            amount = 50
        elif "sensory" in msg or "room" in msg:
            item = "sensory_cap"
            amount = -20  # frees up space
            
        # Modify capacity
        if item == "audio_guides":
            stadium_state["accessibility"]["audio_guides"] += amount
        else:
            stadium_state["accessibility"]["sensory_cap"] = max(0, stadium_state["accessibility"]["sensory_cap"] + amount)
            
        actions.append({
            "action": "restock_equipment",
            "detail": f"Restocked {item} by {abs(amount)} units.",
            "impact": "Accessibility inventory levels replenished."
        })

    # 6. Dispatch Paramedics
    if "dispatch medic" in msg or "send paramedic" in msg or "assign ambulance" in msg:
        # Find queued patient and dispatch
        dispatched = False
        for p in stadium_state["medical"]["patients"]:
            if p["status"] == "QUEUED":
                update_patient_status(p["id"], "DISPATCHED")
                actions.append({
                    "action": "dispatch_medical",
                    "detail": f"Dispatched paramedic ambulance crew to Patient {p['name']} ({p['gate']})",
                    "impact": "Triage status updated. Response timer started."
                })
                dispatched = True
                break
        if not dispatched:
            # Create a patient and dispatch
            new_p = add_incident("Gate 6", "Emergency ambulance route assigned via Copilot tool.", "HIGH")
            actions.append({
                "action": "dispatch_medical",
                "detail": f"Dispatched standby medic crew to Gate 6 (Case #{new_p['id']})",
                "impact": "Standby paramedic team active."
            })

    return {"actions": actions}

def build_system_prompt(role: str, rag_context: str) -> str:
    """
    Constructs a comprehensive operational prompt reflecting the Coordinator
    and sub-agent roles, active user role context, RAG documents, and the Digital Twin state.
    """
    state_summary = {
        "attendance": stadium_state["attendance"],
        "active_incidents": stadium_state["active_incidents"],
        "volunteers": stadium_state["volunteers"],
        "deployed_officers": stadium_state["deployed_officers"],
        "threat_level": stadium_state["threat_level"],
        "metro_load": stadium_state["transport"]["metro_load"],
        "parking_cap": stadium_state["transport"]["parking_cap"],
        "sensory_cap": stadium_state["accessibility"]["sensory_cap"],
    }
    
    prompt = (
        "You are the central **FIFA Nexus AI Coordinator Agent** governing the MetLife Stadium Operating System.\n"
        "Your task is to coordinate 9 specialized agents (Navigation, Security, Medical, Volunteer, Transportation, Accessibility, Sustainability, Communication, Operations Intelligence) to provide operational reasoning.\n\n"
        f"### Active User Context\n"
        f"- Role: {role}\n"
        f"- Digital Twin Stadium Metrics: {json.dumps(state_summary)}\n\n"
        f"### RAG Context (Knowledge Base)\n"
        f"{rag_context}\n\n"
        "### Output Formatting Requirements\n"
        "Your response MUST be fully formatted in polished Markdown. You must adapt your reasoning directly to the user's role.\n"
        "At the end of your response, you MUST output a structured **Explainable AI (XAI)** block with the following exact metrics:\n"
        "1. **Reasoning**: A 1-sentence logic justification.\n"
        "2. **Confidence Score**: A percentage value (e.g., 95%).\n"
        "3. **Supporting Evidence**: Core metrics or RAG manuals cited.\n"
        "4. **Expected Impact**: Numerical outcome prediction.\n"
        "5. **Alternative Options**: Fallback or backup choices.\n\n"
        "Format this block inside a neat code-like visual block using standard markdown style."
    )
    return prompt

def generate_streaming_response(message: str, role: str = "Fan"):
    """
    Generates structured tokens either from Gemini streaming SDK or simulated local streaming,
    integrating real-time RAG context and executed tool logs.
    """
    # 1. Execute state-mutating tools first
    tool_results = detect_and_execute_tools(message)
    executed_actions = tool_results.get("actions", [])
    
    # 2. Query RAG vector database
    docs = query_stadium_docs(message)
    rag_context = "\n".join([f"- [{doc['title']}] ({doc['category']}): {doc['text']}" for doc in docs])
    if not rag_context:
        rag_context = "No relevant operations manual found. Fallback to general crowd control procedures."
        
    system_prompt = build_system_prompt(role, rag_context)

    # 3. Check if Gemini SDK is initialized
    if is_model_initialized:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash"
            )
            
            # Format user prompt with system instructions prefixed
            user_prompt = f"{system_prompt}\n\nUser Message: {message}\n"
            if executed_actions:
                user_prompt += f"\n[SYSTEM ALERTS: Automatically executed the following backend commands based on user message: {json.dumps(executed_actions)}]"
                
            response = model.generate_content(user_prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            print(f"Gemini streaming exception: {e}. Falling back to simulation.")

    # 4. Rich Local Mock Streaming Fallback
    time.sleep(0.5)
    
    # Generate action summaries in text
    action_text = ""
    if executed_actions:
        action_text = "\n\n🛠️ **SYSTEM ACTIONS EXECUTED**:\n"
        for act in executed_actions:
            action_text += f"- **{act['action'].upper()}**: {act['detail']}. Impact: *{act['impact']}*\n"
            
    # Mock text based on categories
    msg = message.lower()
    response_body = ""
    category = "GENERAL"
    evidence = "Standard Operating Manual"
    impact = "Stabilized crowd distribution throughput."
    alternatives = "Maintain current gate allocations."
    confidence = 90

    if "seat" in msg or "gate" in msg or "route" in msg:
        category = "NAVIGATION"
        evidence = "RAG Doc: Seat & Turnstile Flow Maps"
        impact = "Reduces congestion walking delays by 4 mins."
        alternatives = "Direct user via Escalator A concourse."
        response_body = (
            "🗺️ **Navigation Agent Active**\n\n"
            "I have calculated the optimal route. Proceed straight through Gate 6 turnstiles, take Escalator B to Level 2, and turn right to Section 104. "
            "Corridor C currently has a minor density bottleneck; this route avoids it completely."
        )
    elif "order" in msg or "burger" in msg or "drink" in msg or "food" in msg:
        category = "CONCESSIONS"
        evidence = "RAG Doc: Concessions locations & pricing"
        impact = "Concession order prepared and volunteer delivery dispatched."
        alternatives = "Pick up order directly at Section 112 FIFA Grill."
        response_body = (
            "🍔 **Concessions Agent Active**\n\n"
            "Order registered on the backend state database. A standby volunteer in Sector B has been assigned to deliver the concessions directly to Seat 42F. "
            "Delivery ETA is approximately 4 minutes."
        )
    elif "sos" in msg or "emergency" in msg or "danger" in msg:
        category = "SECURITY"
        evidence = "RAG Doc: Emergency Evacuation Procedures"
        impact = "Alarms triggered and first responders dispatched within 20s."
        alternatives = "Direct fans to nearest emergency exit Gate 4."
        confidence = 98
        response_body = (
            "🚨 **CRITICAL: Emergency and Security Agent Active**\n\n"
            "**PLEASE REMAIN CALM.**\n"
            "I have triggered an immediate stadium-wide SOS incident in the operating system database. "
            "Security guards and medical teams have been targeted to your Sector. Stand by, help is arriving."
        )
    elif "volunteer" in msg or "task" in msg:
        category = "VOLUNTEER"
        evidence = "RAG Doc: Volunteer shift handbook"
        impact = "Roster count balanced. Concourse tasks dispatched."
        alternatives = "Reallocate tasks via the manual organizer console."
        response_body = (
            "📋 **Volunteer Orchestrator Active**\n\n"
            "Task schedules updated. The volunteer dispatcher has assigned active tasks in the queue. "
            "The shift roster shows on-shift personnel are active and patrolling Sector B."
        )
    elif "metro" in msg or "shuttle" in msg or "parking" in msg:
        category = "TRANSPORT"
        evidence = "RAG Doc: Public transportation schedules"
        impact = "Divert incoming flow to avoid 20-minute traffic delays."
        alternatives = "Divert passenger arrivals to Metro Line B."
        response_body = (
            "🚆 **Transportation Agent Active**\n\n"
            "Real-time logistics indicate Metro Line A load factor is elevated. "
            "Traffic control routing updates have been pushed to dynamic digital displays to reroute VIP shuttles."
        )
    elif "wheelchair" in msg or "sensory" in msg or "access" in msg:
        category = "ACCESSIBILITY"
        evidence = "RAG Doc: Accessibility guide & sensory room"
        impact = "Escorts dispatched. Sensory room occupancy capacity managed."
        alternatives = "Access standard ramp entrance at Gate 1."
        response_body = (
            "♿ **Accessibility Coordinator Active**\n\n"
            "Wheelchair guide support has been requested. A volunteer helper is en route to Gate 2 for escort assistance. "
            "Sensory room reservations checked."
        )
    else:
        response_body = (
            "🤖 **FIFA Nexus AI Operations Agent Active**\n\n"
            "I am monitoring the digital twin. How can I assist you with stadium navigation, security alerts, medical triage, or transport logistics today?"
        )

    full_text = (
        f"{response_body}"
        f"{action_text}\n\n"
        f"```\n"
        f"🎯 AI RECOMMENDATION REPORT [{category}]\n"
        f"├── Reasoning: Optimization requested for query parameters.\n"
        f"├── Confidence Score: {confidence}%\n"
        f"├── Supporting Evidence: {evidence}\n"
        f"├── Expected Impact: {impact}\n"
        f"└── Alternative Options: {alternatives}\n"
        f"```"
    )

    # Stream text chunk by chunk to simulate token delay
    words = full_text.split(" ")
    current_out = ""
    for w in words:
        current_out += w + " "
        yield w + " "
        time.sleep(0.04) # Simulate network token streaming latency
