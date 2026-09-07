from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()

# CORS Middleware (Taki alag-alag websites aapas mein baat kar sakein bina error ke)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yahan hum store karenge ki kitne Dashboard (Tab-2) humse jude hue hain
connected_dashboards = []

# =================================================================
# DOOR 1: RECEIVER (Tab-2 React Dashboard yahan judega)
# =================================================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_dashboards.append(websocket)
    print("🟢 STATUS: React Dashboard Connected & Waiting for alerts...")
    
    try:
        # Loop chalu rakho taki connection toot na jaye
        while True:
            await websocket.receive_text()
    except Exception:
        connected_dashboards.remove(websocket)
        print("🔴 STATUS: React Dashboard Disconnected.")

# =================================================================
# DOOR 2: TRANSMITTER (Tab-1 Python AI yahan signal bhejega)
# =================================================================
@app.post("/trigger")
async def trigger_alert(request: Request):
    # Tab-1 jab kuch detect karega, toh wo data yahan aayega
    ai_data = await request.json()
    print(f"🚨 AI ALERT RECEIVED: {ai_data}")
    
    # Ab is data ko turant apne connected Tab-2 (React Map) ko bhej do
    if not connected_dashboards:
        print("⚠️ Warning: Data received but no Dashboard is connected to see it!")
    
    for dashboard in connected_dashboards:
        await dashboard.send_json(ai_data)
        
    return {"status": "success", "message": "Alert successfully blasted to Dashboard!"}