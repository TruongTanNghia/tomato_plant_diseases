"""
Predictor module — loads ONNX model and performs inference on leaf images.
"""

import json
import os
import numpy as np
import onnxruntime as ort
from PIL import Image

# Paths relative to the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

ONNX_MODEL_PATH = os.path.join(MODELS_DIR, "plant_disease_model.onnx")
CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "class_names.json")
MODEL_CONFIG_PATH = os.path.join(MODELS_DIR, "model_config.json")

# Vietnamese disease descriptions & recommendations
DISEASE_INFO = {
    "Pepper__bell___Bacterial_spot": {
        "name_vi": "Ớt chuông - Đốm vi khuẩn",
        "description": "Bệnh do vi khuẩn Xanthomonas campestris gây ra, tạo các đốm nâu đen trên lá.",
        "recommendation": "Sử dụng giống kháng bệnh, phun thuốc gốc đồng, luân canh cây trồng."
    },
    "Pepper__bell___healthy": {
        "name_vi": "Ớt chuông - Khỏe mạnh",
        "description": "Lá ớt chuông khỏe mạnh, không có dấu hiệu bệnh.",
        "recommendation": "Tiếp tục chăm sóc bình thường, tưới nước và bón phân đều đặn."
    },
    "Potato___Early_blight": {
        "name_vi": "Khoai tây - Cháy lá sớm",
        "description": "Bệnh do nấm Alternaria solani gây ra, tạo các vòng đồng tâm trên lá.",
        "recommendation": "Phun thuốc trừ nấm, loại bỏ lá bệnh, đảm bảo thoát nước tốt."
    },
    "Potato___Late_blight": {
        "name_vi": "Khoai tây - Cháy lá muộn",
        "description": "Bệnh do nấm Phytophthora infestans, tạo vết bầm nước trên lá.",
        "recommendation": "Phun thuốc trừ nấm phòng ngừa, tránh tưới nước lên lá, thu hoạch sớm nếu nặng."
    },
    "Potato___healthy": {
        "name_vi": "Khoai tây - Khỏe mạnh",
        "description": "Lá khoai tây khỏe mạnh, không có dấu hiệu bệnh.",
        "recommendation": "Tiếp tục chăm sóc bình thường."
    },
    "Tomato_Bacterial_spot": {
        "name_vi": "Cà chua - Đốm vi khuẩn",
        "description": "Bệnh do vi khuẩn Xanthomonas gây ra, tạo đốm nước nhỏ trên lá.",
        "recommendation": "Phun thuốc gốc đồng, tránh tưới nước từ trên cao, luân canh cây trồng."
    },
    "Tomato_Early_blight": {
        "name_vi": "Cà chua - Cháy lá sớm",
        "description": "Bệnh do nấm Alternaria solani, tạo vòng đồng tâm màu nâu trên lá già.",
        "recommendation": "Cắt bỏ lá bệnh, phun thuốc trừ nấm, giữ khoảng cách giữa các cây."
    },
    "Tomato_Late_blight": {
        "name_vi": "Cà chua - Cháy lá muộn",
        "description": "Bệnh do nấm Phytophthora infestans, lan nhanh trong điều kiện ẩm ướt.",
        "recommendation": "Phun thuốc phòng ngừa, tránh tưới buổi tối, tiêu hủy cây bệnh nặng."
    },
    "Tomato_Leaf_Mold": {
        "name_vi": "Cà chua - Mốc lá",
        "description": "Bệnh do nấm Passalora fulva, tạo lớp mốc vàng-xanh mặt dưới lá.",
        "recommendation": "Tăng thông thoáng, giảm độ ẩm, phun thuốc trừ nấm."
    },
    "Tomato_Septoria_leaf_spot": {
        "name_vi": "Cà chua - Đốm lá Septoria",
        "description": "Bệnh do nấm Septoria lycopersici, tạo đốm nhỏ tròn với tâm xám.",
        "recommendation": "Cắt bỏ lá bị nhiễm, phun thuốc trừ nấm, tránh tưới nước lên lá."
    },
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "name_vi": "Cà chua - Nhện đỏ hai chấm",
        "description": "Nhện đỏ hút nhựa lá, làm lá chuyển vàng và có mạng nhện nhỏ.",
        "recommendation": "Phun nước mạnh rửa lá, sử dụng thuốc trừ nhện, duy trì độ ẩm."
    },
    "Tomato__Target_Spot": {
        "name_vi": "Cà chua - Đốm mục tiêu",
        "description": "Bệnh do nấm Corynespora cassiicola, tạo đốm tròn đồng tâm trên lá.",
        "recommendation": "Phun thuốc trừ nấm, loại bỏ tàn dư thực vật, luân canh."
    },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "name_vi": "Cà chua - Virus xoăn vàng lá",
        "description": "Virus TYLCV do bọ phấn trắng truyền, lá xoăn vàng và cây còi cọc.",
        "recommendation": "Diệt bọ phấn trắng, sử dụng lưới chắn côn trùng, trồng giống kháng."
    },
    "Tomato__Tomato_mosaic_virus": {
        "name_vi": "Cà chua - Virus khảm",
        "description": "Virus TMV làm lá có vân khảm vàng-xanh, biến dạng lá.",
        "recommendation": "Loại bỏ cây bệnh, khử trùng dụng cụ, trồng giống kháng virus."
    },
    "Tomato_healthy": {
        "name_vi": "Cà chua - Khỏe mạnh",
        "description": "Lá cà chua khỏe mạnh, không có dấu hiệu bệnh.",
        "recommendation": "Tiếp tục chăm sóc bình thường, theo dõi định kỳ."
    },
}


class PlantDiseasePredictor:
    """Loads ONNX model and performs plant disease classification."""

    def __init__(self):
        # Load class names
        with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
            self.class_names: list[str] = json.load(f)

        # Load model config
        with open(MODEL_CONFIG_PATH, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.image_size = tuple(self.config["image_size"])  # (256, 256)
        self.num_classes = self.config["num_classes"]

        # Load ONNX model
        self.session = ort.InferenceSession(
            ONNX_MODEL_PATH,
            providers=["CPUExecutionProvider"],
        )
        self.input_name = self.session.get_inputs()[0].name
        print(f"✅ Model loaded: {self.num_classes} classes, input {self.image_size}")

    def preprocess(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for model input: resize, normalize, to NCHW tensor."""
        # Resize to model input size
        image = image.convert("RGB")
        image = image.resize(self.image_size, Image.BILINEAR)

        # Convert to numpy array and normalize (ImageNet statistics)
        img_array = np.array(image, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_array = (img_array - mean) / std

        # HWC → CHW → NCHW
        img_array = np.transpose(img_array, (2, 0, 1))
        img_array = np.expand_dims(img_array, axis=0)

        return img_array

    def predict(self, image: Image.Image) -> dict:
        """Run prediction on Input image, return class + confidence + top5."""
        input_tensor = self.preprocess(image)

        # Run inference
        outputs = self.session.run(None, {self.input_name: input_tensor})
        logits = outputs[0][0]  # shape: (num_classes,)

        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probabilities = exp_logits / exp_logits.sum()

        # Top 5 predictions
        top5_indices = np.argsort(probabilities)[::-1][:5]
        top5 = []
        for idx in top5_indices:
            class_name = self.class_names[idx]
            info = DISEASE_INFO.get(class_name, {})
            top5.append({
                "class_name": class_name,
                "name_vi": info.get("name_vi", class_name),
                "confidence": round(float(probabilities[idx]) * 100, 2),
            })

        # Best prediction
        best_idx = top5_indices[0]
        best_class = self.class_names[best_idx]
        best_info = DISEASE_INFO.get(best_class, {})

        return {
            "class_name": best_class,
            "name_vi": best_info.get("name_vi", best_class),
            "confidence": round(float(probabilities[best_idx]) * 100, 2),
            "description": best_info.get("description", ""),
            "recommendation": best_info.get("recommendation", ""),
            "is_healthy": "healthy" in best_class.lower(),
            "top5": top5,
        }
