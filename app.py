from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="Heart Disease Predictor API")

# Load the model
MODEL_PATH = "heart_disease_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load model: {e}")
    model = None

class PatientData(BaseModel):
    age: float
    sex: float
    cp: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float
    exang: float
    oldpeak: float
    slope: float
    ca: float
    thal: float

@app.post("/predict")
def predict(data: PatientData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train and save the model first.")
    
    input_df = pd.DataFrame([data.dict()])
    
    try:
        proba = model.predict_proba(input_df)[0]
        risk_score = float(proba[1]) # Probability of class 1 (High Risk)
        
        risk_level = "Unknown"
        if risk_score > 0.7:
            risk_level = "High"
        elif risk_score < 0.3:
            risk_level = "Low"
        else:
            risk_level = "Moderate"
            
        return {
            "probability": risk_score,
            "risk_level": risk_level
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Serve static files from the React dist folder (if exists)
FRONTEND_DIST = os.path.join("frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Serve index.html for all non-API paths to support SPA routing
        if not full_path.startswith("predict"):
            # Check if file exists, if not serve index.html (React handles routing)
            path = os.path.join(FRONTEND_DIST, full_path)
            if os.path.isfile(path) and full_path != "":
                return FileResponse(path)
            return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"message": "API is running, but frontend is not built yet. Run 'npm run build' inside frontend directory."}

if __name__ == "__main__":
    import uvicorn
    # Make sure app is running on localhost
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
