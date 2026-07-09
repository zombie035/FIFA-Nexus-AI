import os
import chromadb
from chromadb.config import Settings
import google.generativeai as genai

# Setup Chroma Client
# We use a persistent store in /app/chroma_db
try:
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
except Exception:
    chroma_client = chromadb.EphemeralClient()

COLLECTION_NAME = "stadium_operations"

# Default documents for seeding
seed_documents = [
    {
        "id": "doc_emerg_1",
        "title": "Emergency SOS Response Protocols",
        "content": "In the event of a Critical SOS alert, security personnel are automatically dispatched to the exact turnstile or gate coordinates. Nearest medical triage is East Station (Sector A). Evacuation routes exit through Gate 4 (South) which remains cleared for emergency vehicles.",
        "category": "SECURITY"
    },
    {
        "id": "doc_emerg_2",
        "title": "Fire Evacuation Procedures",
        "content": "If fire alarms are active, digital stadium signage automatically displays illuminated green exit arrows. All gates open automatically. Volunteers should direct crowd flows away from Concourse C towards Gates 1 and 4.",
        "category": "SECURITY"
    },
    {
        "id": "doc_vol_1",
        "title": "Volunteer Shifts and Breaks Guidelines",
        "content": "Volunteers work 6-hour shifts. Standard schedules allocate a 15-minute rest break after 3 hours. Standard duties include wheelchair escorts at Gate 2, language translations at merchandise hubs, and digital sign redirect enforcement.",
        "category": "VOLUNTEER"
    },
    {
        "id": "doc_transit_1",
        "title": "Metro Line A Transit Capacity",
        "content": "The Red Line Metro departs Stadium North Station every 7 minutes. Capacity limits: Green (optimal, <50%), Yellow (moderate, 50-80%), Red (severe overcrowding, >80%). When Line A exceeds 90%, dynamic signage redirects passengers to shuttle buses at Zone B.",
        "category": "TRANSPORT"
    },
    {
        "id": "doc_parking_1",
        "title": "VIP Parking Lots Allocations",
        "content": "VIP North Lot is the primary lot for convoys and sponsors. If VIP North Lot is marked FULL, upcoming transport vehicles must be rerouted to VIP South Underground or East Outer Lot to prevent bottlenecks.",
        "category": "TRANSPORT"
    },
    {
        "id": "doc_access_1",
        "title": "Accessibility Services and Audio Guides",
        "content": "Sensory Rooms are located in Section 104, Level 2 (75% normal occupancy capacity). Multilingual audio guides can be checked out at the Guest Services booth near Sector B (Gate 1). Wheelchair assistance requires volunteer guides dispatched to Gates 1, 2, or 6.",
        "category": "ACCESSIBILITY"
    },
    {
        "id": "doc_sus_1",
        "title": "Sustainability and Recycling Mandates",
        "content": "MetLife Stadium is committed to zero waste. Food vendors must use compostable containers. Recycling bins are color-coded: blue for plastic/aluminum, green for compostables, black for trash. Energy utilization is optimized via zone-based HVAC shutoffs.",
        "category": "SUSTAINABILITY"
    },
    {
        "id": "doc_faq_1",
        "title": "Concessions Food Locations and Hours",
        "content": "FIFA Grill stands are located at Section 112 (East) and Section 115 (West). Burger Combos cost $12 and beverages cost $5. Concessions open 2 hours before kickoff and close 15 minutes after final whistle.",
        "category": "FAQ"
    }
]

def get_embedding(text: str):
    """
    Generate Gemini embeddings if API key is active.
    Otherwise fall back to mock numerical vectors for ChromaDB compatibility.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and len(api_key.strip()) > 10:
        try:
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_query"
            )
            return result["embedding"]
        except Exception as e:
            print(f"Gemini embedding error: {e}, using fallback.")
            
    # Lightweight deterministic hash fallback embedding (128-dimensions)
    import hashlib
    h = hashlib.sha256(text.encode('utf-8')).digest()
    vec = []
    for i in range(128):
        # Generate pseudo-random float vector from hash bytes
        val = (h[i % 32] + (i * 7)) % 256
        vec.append(float(val - 128) / 128.0)
    return vec

def seed_database():
    """
    Seeds the ChromaDB collection with operational manuals and stadium guides.
    """
    try:
        collection = chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "FIFA Stadium Operations Manuals"}
        )
        
        # Check if already seeded
        existing = collection.get(ids=[doc["id"] for doc in seed_documents])
        if len(existing["ids"]) == len(seed_documents):
            print("ChromaDB is already seeded.")
            return

        documents = []
        embeddings = []
        metadatas = []
        ids = []

        for doc in seed_documents:
            text = f"Title: {doc['title']}\nContent: {doc['content']}"
            documents.append(text)
            embeddings.append(get_embedding(text))
            metadatas.append({"title": doc["title"], "category": doc["category"]})
            ids.append(doc["id"])

        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        print("ChromaDB seeded successfully with operational documents.")
    except Exception as e:
        print(f"Failed to seed ChromaDB: {e}. Running in memory-only query fallback.")

def query_stadium_docs(query_text: str, max_results: int = 2) -> list:
    """
    Queries the ChromaDB operations collection using Gemini or fallback embeddings.
    If database queries fail, returns a keyword-based lexical search fallback.
    """
    try:
        collection = chroma_client.get_collection(name=COLLECTION_NAME)
        emb = get_embedding(query_text)
        results = collection.query(
            query_embeddings=[emb],
            n_results=max_results
        )
        # Parse output
        docs = []
        if results and "documents" in results and len(results["documents"]) > 0:
            for i, doc_list in enumerate(results["documents"]):
                for j, text in enumerate(doc_list):
                    meta = results["metadatas"][i][j] if "metadatas" in results else {}
                    docs.append({
                        "text": text,
                        "title": meta.get("title", "Operations Manual"),
                        "category": meta.get("category", "GENERAL")
                    })
        if docs:
            return docs
    except Exception as e:
        print(f"ChromaDB query error: {e}. Using lexical keyword search fallback.")

    # Lexical keyword search fallback
    docs = []
    q_words = query_text.lower().split()
    for doc in seed_documents:
        score = 0
        content_lower = doc["content"].lower()
        title_lower = doc["title"].lower()
        for word in q_words:
            if word in content_lower:
                score += 1
            if word in title_lower:
                score += 2
        if score > 0:
            docs.append({
                "text": f"Title: {doc['title']}\nContent: {doc['content']}",
                "title": doc["title"],
                "category": doc["category"],
                "score": score
            })
    docs.sort(key=lambda x: x.get("score", 0), reverse=True)
    return docs[:max_results]

# Seed immediately on load
seed_database()
