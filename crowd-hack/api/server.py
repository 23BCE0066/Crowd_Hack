from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store latest AI data here
latest_data = {}
monitoring_active = False

class CrowdData(BaseModel):
    person_count: int
    current_density: float
    predicted_density: float
    current_flow: float
    predicted_flow: float
    risk: bool

class MonitoringToggle(BaseModel):
    active: bool

@app.get("/monitoring-status")
def get_monitoring_status():
    return {"active": monitoring_active}

@app.post("/toggle-monitoring")
def toggle_monitoring(data: MonitoringToggle):
    global monitoring_active
    monitoring_active = data.active
    return {"message": "Monitoring status updated", "active": monitoring_active}


@app.post("/update")
def update(data: CrowdData):
    global latest_data
    latest_data = {
        **data.dict(),
        "timestamp": datetime.utcnow()
    }
    return {"message": "Updated successfully"}


@app.get("/status")
def status():
    return latest_data