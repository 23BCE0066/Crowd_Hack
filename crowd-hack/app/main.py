import cv2
import time
import serial
import requests
from datetime import datetime
from ultralytics import YOLO

from modules.detection import CrowdEstimator
from modules.prediction import CrowdPredictor

# ==============================
# CONFIG
# ==============================
SERIAL_PORT = "/dev/cu.usbserial-5B150116871"  # Change if needed
BAUD_RATE = 115200
RISK_THRESHOLD = 0.65  # Increased from 0.30

status_data = {
    "timestamp": None,
    "current_density": 0,
    "predicted_density": 0,
    "current_flow": 0,
    "predicted_flow": 0,
    "risk": False,
}

# ==============================
# MAIN FUNCTION
# ==============================
def check_monitoring():
    try:
        response = requests.get("http://127.0.0.1:8000/monitoring-status", timeout=1)
        return response.json().get("active", False)
    except:
        return False

def main():
    global status_data

    # --------------------------
    # SERIAL CONNECTION
    # --------------------------
    try:
        esp = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print("✅ Connected to ESP32")
        time.sleep(2)
    except:
        esp = None
        print("⚠ Running without ESP32")

    # --------------------------
    # YOLO MODEL & OTHER MODULES
    # --------------------------
    print("⏳ Loading YOLO model (Medium)...")
    model = YOLO("yolov8m.pt") # Upgraded to Medium for maximum detection accuracy
    estimator = CrowdEstimator()
    predictor = CrowdPredictor()
    predictor.load()
    print("✅ System Ready. Waiting for dashboard start signal...")

    cap = None
    
    while True:
        monitoring_active = check_monitoring()
        
        if not monitoring_active:
            if cap:
                print("🛑 Monitoring stopped by dashboard. Closing camera.")
                cap.release()
                cv2.destroyAllWindows()
                cap = None
            time.sleep(1)
            continue

        if cap is None:
            print("🚀 Monitoring started by dashboard. Opening camera...")
            cap = cv2.VideoCapture(0)
            # Standard stable resolution for YOLO
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            
            if not cap.isOpened():
                print("❌ Camera not accessible")
                time.sleep(5)
                continue
            prev_count = 0
            prev_time = time.time()
            buffer = []

        ret, frame = cap.read()
        if not ret:
            print("⚠ Failed to grab frame")
            time.sleep(1)
            continue

        start_time = time.time()

        # --------------------------
        # YOLO PERSON COUNT (High Precision)
        # --------------------------
        # conf=0.2 ensures even partial detections are counted
        results = model(frame, conf=0.2, iou=0.7, classes=[0], verbose=False)[0]
        person_count = len(results.boxes)

        # --------------------------
        # DENSITY ESTIMATION
        # --------------------------
        frame, density = estimator.estimate_density(frame)

        # --------------------------
        # FLOW CALCULATION
        # --------------------------
        current_time = time.time()
        flow = abs(person_count - prev_count) / (
            current_time - prev_time + 1e-6
        )

        prev_count = person_count
        prev_time = current_time

        # --------------------------
        # BUFFER FOR GRU (2 FEATURES)
        # --------------------------
        buffer.append([density, flow])
        if len(buffer) > 10:
            buffer.pop(0)

        if len(buffer) == 10:
            predicted_density, predicted_flow = predictor.predict(buffer)
        else:
            predicted_density = density
            predicted_flow = flow

        # --------------------------
        # RISK LOGIC
        # --------------------------
        # Risk is high if density is very high OR if there are many people
        risk = (predicted_density > RISK_THRESHOLD) or (person_count >= 5)

        # --------------------------
        # SERIAL OUTPUT
        # --------------------------
        if esp:
            try:
                if risk:
                    esp.write(b"RISK_ON\n")
                else:
                    esp.write(b"RISK_OFF\n")
            except:
                print("⚠ Serial write failed")

        # --------------------------
        # STATUS FOR API
        # --------------------------
        status_data = {
            "timestamp": datetime.now().isoformat(),
            "person_count": int(person_count),
            "current_density": float(density),
            "predicted_density": float(predicted_density),
            "current_flow": float(flow),
            "predicted_flow": float(predicted_flow),
            "risk": bool(risk), # Ensured risk is cast to standard python boolean
        }

        # Send data to FastAPI backend
        try:
            requests.post("http://127.0.0.1:8000/update", json=status_data, timeout=0.5)
        except Exception as e:
            pass

        # --------------------------
        # DISPLAY OVERLAY
        # --------------------------
        fps = 1 / (time.time() - start_time + 1e-6)

        cv2.putText(frame, f"People: {person_count}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)

        cv2.putText(frame, f"Density: {density:.2f}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

        cv2.putText(frame, f"Pred Density: {predicted_density:.2f}", (20, 120),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)

        cv2.putText(frame, f"Flow: {flow:.2f}", (20, 160),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 200, 255), 2)

        if risk:
            cv2.putText(frame, "⚠ RISK ALERT!", (20, 200),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        cv2.putText(frame, f"FPS: {int(fps)}", (20, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("AI Crowd Monitor", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    if cap:
        cap.release()
    cv2.destroyAllWindows()
    if esp:
        esp.close()

if __name__ == "__main__":
    main()