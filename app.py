from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fpdf import FPDF
import joblib
import pandas as pd
import os
import io

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

class ReportData(BaseModel):
    patient: PatientData
    probability: float
    risk_level: str


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

@app.post("/generate-report")
def generate_report(data: ReportData):
    try:
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_font("Helvetica", "B", 24)
        pdf.set_text_color(220, 38, 38) # Cardio Red
        pdf.cell(0, 20, "CardioAI Diagnostics", ln=True, align="C")
        
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(100, 116, 139) # Slate 500
        pdf.cell(0, 10, "Cardiovascular Risk Assessment Report", ln=True, align="C")
        pdf.ln(15)
        
        # Patient Data Section
        pdf.set_fill_color(248, 250, 252) # Slate 50
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42) # Slate 900
        pdf.cell(0, 10, " PATIENT CLINICAL SUMMARY", ln=True, fill=True)
        pdf.ln(2)
        
        pdf.set_font("Helvetica", "", 10)
        p = data.patient
        
        col_width = pdf.epw / 2
        
        pdf.cell(col_width, 8, f"Age: {int(p.age)} years")
        pdf.cell(col_width, 8, f"Sex: {'Male' if p.sex == 1 else 'Female'}", ln=True)
        
        pdf.cell(col_width, 8, f"Resting Blood Pressure: {int(p.trestbps)} mmHg")
        pdf.cell(col_width, 8, f"Serum Cholestoral: {int(p.chol)} mg/dl", ln=True)
        
        pdf.cell(col_width, 8, f"Max Heart Rate: {int(p.thalach)} bpm")
        pdf.cell(col_width, 8, f"Chest Pain Type: {int(p.cp)}", ln=True)
        
        pdf.cell(col_width, 8, f"Oldpeak (ST Depr): {p.oldpeak}")
        pdf.cell(col_width, 8, f"Major Vessels: {int(p.ca)}", ln=True)
        
        pdf.ln(10)
        
        # Result Section
        pdf.set_fill_color(241, 245, 249) # Slate 100
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, " AI RISK ANALYSIS", ln=True, fill=True)
        pdf.ln(4)
        
        pdf.set_font("Helvetica", "B", 20)
        pdf.cell(0, 15, f"Risk Probability: {data.probability * 100:.1f}%", ln=True, align="C")
        
        pdf.set_font("Helvetica", "B", 16)
        if data.risk_level == "High":
            pdf.set_text_color(220, 38, 38)
        elif data.risk_level == "Moderate":
            pdf.set_text_color(202, 138, 4)
        else:
            pdf.set_text_color(22, 163, 74)
        
        pdf.cell(0, 10, f"Classification: {data.risk_level.upper()} RISK", ln=True, align="C")
        
        pdf.set_text_color(15, 23, 42)
        pdf.ln(10)
        
        # Recommendations
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, " CLINICAL RECOMMENDATIONS", ln=True)
        pdf.set_font("Helvetica", "", 10)
        
        if data.risk_level == "High":
            recs = [
                "IMMEDIATE Action: Consult a cardiologist for a comprehensive evaluation.",
                "Avoid intense physical exertion until cleared by a medical professional.",
                "Monitor blood pressure and symptoms like chest pain or shortness of breath.",
                "Review family history and existing medication with a doctor."
            ]
        elif data.risk_level == "Moderate":
            recs = [
                "Schedule a follow-up appointment with your primary care physician.",
                "Evaluate lifestyle factors including diet, stress, and sleep quality.",
                "Consider light cardiovascular exercise (walking) as tolerated.",
                "Regular monitoring of blood pressure and lipid profile is advised."
            ]
        else:
            recs = [
                "Maintain your healthy lifestyle and balanced diet.",
                "Continue regular physical activity (minimum 150 minutes per week).",
                "Ensure annual cardiovascular check-ups and screenings.",
                "Keep tracking heart rate and blood pressure trends."
            ]
            
        for rec in recs:
            pdf.multi_cell(0, 7, f"• {rec}")
            
        # Footer
        pdf.set_y(-40)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(148, 163, 184)
        pdf.multi_cell(0, 5, "Disclaimer: This AI-generated report is for experimental and educational purposes only. It is not a clinical diagnosis. Always seek professional medical advice for health-related decisions.", align="C")

        # Get PDF output as a bytearray
        pdf_output = pdf.output()
        
        return Response(
            content=pdf_output,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=CardioAI_Risk_Report.pdf"}
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")


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
