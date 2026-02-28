"""
FastAPI backend — API endpoints for plant disease classification.
"""

import os
import uuid
from datetime import datetime
from io import BytesIO

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image

from predictor import PlantDiseasePredictor

# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────
app = FastAPI(
    title="Plant Disease Classifier API",
    description="API phân loại bệnh cây trồng qua ảnh lá cây",
    version="1.0.0",
)

# CORS — allow NextJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Load model at startup
predictor = PlantDiseasePredictor()

# In-memory prediction history
prediction_history: list[dict] = []
MAX_HISTORY = 50


# ──────────────────────────────────────────────
# API Routes
# ──────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": True,
        "num_classes": predictor.num_classes,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/classes")
async def get_classes():
    """Return all disease classes with Vietnamese names."""
    from predictor import DISEASE_INFO

    classes = []
    for class_name in predictor.class_names:
        info = DISEASE_INFO.get(class_name, {})
        classes.append({
            "class_name": class_name,
            "name_vi": info.get("name_vi", class_name),
            "description": info.get("description", ""),
            "recommendation": info.get("recommendation", ""),
            "is_healthy": "healthy" in class_name.lower(),
        })
    return {"classes": classes, "total": len(classes)}


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """Predict disease from uploaded leaf image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File phải là ảnh (jpg, png, ...)")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(BytesIO(contents))

        # Save uploaded image
        file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
        saved_filename = f"{uuid.uuid4().hex}.{file_ext}"
        saved_path = os.path.join(UPLOAD_DIR, saved_filename)
        image.save(saved_path)

        # Run prediction
        result = predictor.predict(image)

        # Add metadata
        result["id"] = uuid.uuid4().hex[:8]
        result["filename"] = file.filename
        result["image_url"] = f"/uploads/{saved_filename}"
        result["timestamp"] = datetime.now().isoformat()

        # Store in history
        prediction_history.insert(0, result)
        if len(prediction_history) > MAX_HISTORY:
            prediction_history.pop()

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý ảnh: {str(e)}")


@app.get("/api/history")
async def get_history():
    """Return prediction history."""
    # Compute statistics
    total = len(prediction_history)
    disease_counts: dict[str, int] = {}
    healthy_count = 0

    for item in prediction_history:
        cls = item.get("name_vi", "Unknown")
        disease_counts[cls] = disease_counts.get(cls, 0) + 1
        if item.get("is_healthy", False):
            healthy_count += 1

    return {
        "history": prediction_history,
        "total": total,
        "disease_counts": disease_counts,
        "healthy_count": healthy_count,
        "disease_count": total - healthy_count,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
