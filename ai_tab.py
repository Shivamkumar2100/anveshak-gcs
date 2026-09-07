import streamlit as st
from ultralytics import YOLO
import requests
from PIL import Image

# FastAPI Server ka Address
FASTAPI_URL = "http://localhost:8000/trigger"

# Website ka UI Setup
st.set_page_config(page_title="Project Anveshak - AI Brain", layout="centered", page_icon="🚁")
st.title("🧠 UAV AI Vision Simulator")
st.markdown("**Simulating Hailo-8L Edge NPU Processing** | Upload drone feed to detect targets.")

# YOLO Model Load Karna 
@st.cache_resource
def load_model():
    return YOLO('yolov8n.pt') 

model = load_model()

# Image Upload Option
uploaded_file = st.file_uploader("Upload Drone Image (JPG/PNG)", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Upload ki hui image dikhana
    image = Image.open(uploaded_file)
    # FIX: Updated to use_container_width
    st.image(image, caption="Raw Drone Camera Feed", use_container_width=True)
    
    # Detect Button
    if st.button("🚨 Run Search & Rescue AI", type="primary", use_container_width=True):
        with st.spinner("Processing image through Hailo-8L NPU Simulation..."):
            
            # Classes: 0=Person, 2=Car, 5=Bus, 7=Truck. Conf=0.15 matlab minimum 15% confidence.
            results = model(image, conf=0.15, classes=[0, 2, 5, 7])
            
            # Bounding box wali image nikalna aur dikhana
            res_plotted = results[0].plot()
            res_image = res_plotted[..., ::-1] 
            
            st.success("Target Analysis Complete!")
            # FIX: Updated to use_container_width
            st.image(res_image, caption="AI Detected Targets", use_container_width=True)
            
            # Data nikalna aur Server ko bhejna
           # Data nikalna aur Single Aggregated Alert bhejna
            boxes = results[0].boxes
            
            if len(boxes) > 0:
                person_count = 0
                max_conf = 0.0

                for box in boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    conf = float(box.conf[0]) * 100
                    
                    if class_name == "person":
                        person_count += 1
                        if conf > max_conf:
                            max_conf = conf

                if person_count > 0:
                    alert_title = f"Survivor (Solo)" if person_count == 1 else f"Survivor Cluster ({person_count} Persons)"
                    payload = {
                        "type": alert_title,
                        "confidence": round(max_conf, 1)
                    }
                    
                    try:
                        response = requests.post(FASTAPI_URL, json=payload)
                        if response.status_code == 200:
                            st.info(f"📡 Alert sent to GCS Map: {alert_title} ({round(max_conf, 1)}% max confidence)")
                    except Exception:
                        st.error("❌ Ground Control Station (FastAPI) offline hai.")
                else:
                    st.warning("No humans detected in this frame.")
            else:
                st.warning("No targets detected.")