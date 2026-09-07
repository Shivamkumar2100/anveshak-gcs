
# 🚁 Project Anveshak - Autonomous UAV Ground Control Station (GCS)

Project Anveshak is an enterprise-grade Search and Rescue (SAR) software pipeline designed for rapid deployment. It features a React-based Ground Control Station (GCS) Dashboard, a FastAPI WebSocket telemetry bridge, and a simulated Edge AI Vision processing unit powered by YOLOv8.

This repository contains the Minimum Viable Product (MVP) demonstrating autonomous geofencing, lawnmower grid-search path generation, and real-time AI telemetry transmission without cloud dependency.

## 🏗️ System Architecture

1. **Frontend (GCS Dashboard):** Built with React + Vite, visualizing live UAV telemetry, geofenced search zones, and target event logs via `react-leaflet`.
2. **Backend (Telemetry Bridge):** A lightweight `FastAPI` WebSocket server that acts as a secure communication bridge between the drone and the dashboard.
3. **Edge AI Simulator (Vision Node):** A `Streamlit` application running an `Ultralytics YOLOv8` model to simulate onboard NPU processing for human/vehicle detection.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:
* **Node.js** (v18 or higher)
* **Python** (v3.9 or higher)
* **Git** (to clone the repository)

---

## 🛠️ Installation & Setup

### 1. Frontend Setup (React Dashboard)
Navigate to the project root directory and install the required Node modules, including geospatial and UI libraries:

```bash
# Install base dependencies and extra libraries (Leaflet for maps, Lucide for UI icons)
npm install
npm install leaflet react-leaflet lucide-react

```

### 2. Backend & AI Setup (Python Engine)

Open a new terminal in the project root directory and install the required Python packages for the server and AI model:

```bash
# Install FastAPI, WebSockets, Streamlit, and Computer Vision libraries
pip install fastapi uvicorn websockets streamlit ultralytics requests pillow opencv-python

```

---

## 🚀 Running the System (3-Terminal Pipeline)

To run the full end-to-end pipeline, you need to start the three core components simultaneously in separate terminal windows.

### Terminal 1: Launch the GCS Dashboard

```bash
npm run dev

```

*Access the dashboard at:* `http://localhost:5173`

### Terminal 2: Launch the Telemetry Bridge

```bash
uvicorn mock_server:app --reload

```

*This server listens on:*

* WebSocket (Map Link): `ws://localhost:8000/ws`
* HTTP POST (AI Trigger): `http://localhost:8000/trigger`

### Terminal 3: Launch the Edge AI Simulator

```bash
streamlit run ai_tab.py

```

*Access the AI upload portal at:* `http://localhost:8501`

---

## 🎯 Demonstration Protocol (How to Use)

1. **Initialize Mission:** Open the GCS Dashboard (Terminal 1). Click **"Select Region on Map"** and plot 4 distinct coordinate points to create a geofenced sector.
2. **Deploy UAV:** Click **"Deploy UAV Mission"**. The system will mathematically generate a lawnmower sweep pattern and deploy the drone marker.
3. **Trigger Edge AI:** Open the AI Vision Simulator (Terminal 3). Upload an aerial disaster/flood image and click **"Run Search & Rescue AI"**.
4. **Real-Time Handshake:** The YOLOv8 model will process the frame, identify targets, and send an automated POST payload to the server. The server instantly pushes a WebSocket alert to the GCS, dropping a numbered red target pin at the UAV's exact coordinates.
5. **Mission Reset:** Use the **"Clear & Reset Mission"** button in the dashboard sidebar to safely wipe telemetry data and prepare for a new flight.

```

```



anveshak-gcs/
│
├── src/
│   └── components/
│       └── Dashboard.jsx    # (Frontend Core) React map, telemetry UI, and WebSocket receiver.
│
├── ai_tab.py                # (Edge AI Node) Streamlit UI & YOLOv8 integration for target detection.
├── mock_server.py           # (Backend Bridge) FastAPI server handling WebSocket and HTTP POST routing.
├── package.json             # (Node Dependencies) Contains React, Leaflet, and Lucide configuration.
└── sample_images/           # (Testing Data) Directory for storing aerial test images.
