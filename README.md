# 🌿 PlantAI — Phân Loại Bệnh Cây Trồng Qua Ảnh Lá Cây

Hệ thống website ứng dụng **Trí tuệ nhân tạo (AI)** để phát hiện và phân loại bệnh cây trồng thông qua hình ảnh lá cây. Sử dụng mô hình **CNN (MobileNetV2)** đạt độ chính xác **~99%**, triển khai trên nền tảng Web với **NextJS** và **FastAPI**.

> 📚 Đồ án tốt nghiệp — Ngành Khoa học máy tính — Khóa 63

---

## 📸 Screenshots

### Trang Phân Tích — Upload / Camera
- Upload ảnh kéo thả hoặc mở camera chụp trực tiếp
- AI phân loại bệnh + hiển thị Top 5 dự đoán, mô tả bệnh, khuyến nghị xử lý

### Dashboard — Thống Kê & Lịch Sử
- 4 stat cards: tổng ảnh, lá khỏe, lá bệnh, số loại bệnh
- Biểu đồ phân bố bệnh (bar chart) & tỷ lệ bệnh (donut chart)
- Bảng lịch sử phân tích gần đây

---

## 🎯 Tính Năng

| Tính năng | Mô tả |
|-----------|--------|
| 📤 Upload ảnh | Kéo thả hoặc click chọn file (JPG, PNG, WEBP) |
| 📹 Camera trực tiếp | Mở webcam/camera điện thoại, chụp ảnh lá cây |
| 🔄 Đổi camera | Chuyển camera trước/sau trên điện thoại |
| 🤖 AI dự đoán | Phân loại bệnh tự động với confidence % |
| 📊 Dashboard | Thống kê phân bố bệnh, biểu đồ, lịch sử |
| 🌙 Dark mode | Giao diện hiện đại, glassmorphism |
| 📱 Responsive | Hoạt động tốt trên mobile & desktop |

---

## 🌱 15 Loại Bệnh Hỗ Trợ Nhận Diện

| # | Bệnh | Cây |
|---|-------|-----|
| 1 | Đốm vi khuẩn (Bacterial Spot) | 🫑 Ớt chuông |
| 2 | Khỏe mạnh (Healthy) | 🫑 Ớt chuông |
| 3 | Cháy lá sớm (Early Blight) | 🥔 Khoai tây |
| 4 | Cháy lá muộn (Late Blight) | 🥔 Khoai tây |
| 5 | Khỏe mạnh (Healthy) | 🥔 Khoai tây |
| 6 | Đốm vi khuẩn (Bacterial Spot) | 🍅 Cà chua |
| 7 | Cháy lá sớm (Early Blight) | 🍅 Cà chua |
| 8 | Cháy lá muộn (Late Blight) | 🍅 Cà chua |
| 9 | Mốc lá (Leaf Mold) | 🍅 Cà chua |
| 10 | Đốm lá Septoria (Septoria Leaf Spot) | 🍅 Cà chua |
| 11 | Nhện đỏ (Spider Mites) | 🍅 Cà chua |
| 12 | Đốm mục tiêu (Target Spot) | 🍅 Cà chua |
| 13 | Virus xoăn vàng lá (Yellow Leaf Curl Virus) | 🍅 Cà chua |
| 14 | Virus khảm (Mosaic Virus) | 🍅 Cà chua |
| 15 | Khỏe mạnh (Healthy) | 🍅 Cà chua |

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Python** — Ngôn ngữ chính
- **FastAPI** — Web framework xây dựng REST API
- **ONNX Runtime** — Chạy inference model AI (nhẹ, nhanh, không cần GPU)
- **Pillow** — Xử lý ảnh
- **NumPy** — Tính toán số học

### Frontend
- **NextJS 16** — React framework với App Router
- **TypeScript** — Type-safe JavaScript
- **Vanilla CSS** — Thiết kế dark mode, glassmorphism

### Mô Hình AI
- **MobileNetV2** — CNN backbone, tối ưu cho web deployment
- **Input**: 256×256 RGB image
- **Output**: 15 classes với softmax probability
- **Accuracy**: ~99% trên tập validation

---

## 📁 Cấu Trúc Dự Án

```
tomato_plant_diseases/
├── backend/                    # FastAPI backend
│   ├── main.py                 # Server chính + API endpoints
│   ├── predictor.py            # Load model + inference logic
│   └── requirements.txt        # Python dependencies
├── frontend/                   # NextJS frontend
│   ├── src/app/
│   │   ├── globals.css         # Design system (dark mode)
│   │   ├── layout.tsx          # Root layout + SEO
│   │   ├── page.tsx            # Trang chủ — Upload / Camera / Predict
│   │   └── dashboard/
│   │       └── page.tsx        # Dashboard — Thống kê & Lịch sử
│   ├── package.json
│   └── next.config.ts
├── models/                     # Model AI đã huấn luyện
│   ├── best_model.pth          # PyTorch weights
│   ├── plant_disease_model.onnx # ONNX model (dùng để inference)
│   ├── class_names.json        # 15 class names
│   ├── model_config.json       # Cấu hình model (input size, num classes)
│   ├── learning_curves.png     # Biểu đồ training
│   └── __results___files/      # Các biểu đồ kết quả training
├── YeuCau/                     # Đề cương đồ án
├── Baocao/                     # Báo cáo
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu

- **Python** >= 3.10
- **Node.js** >= 18
- **npm** >= 9

### 1. Clone repository

```bash
git clone https://github.com/TruongTanNghia/tomato_plant_diseases.git
cd tomato_plant_diseases
```

### 2. Cài đặt Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

### 4. Chạy ứng dụng

Mở **2 terminal** riêng biệt:

**Terminal 1 — Backend (port 8000):**
```bash
cd backend
python main.py
```
> ✅ Khi thấy `Model loaded: 15 classes, input (256, 256)` là backend đã sẵn sàng.

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
npm run dev
```

### 5. Truy cập

Mở trình duyệt tại: **http://localhost:3000**

- 📤 **Trang Phân tích** (`/`) — Upload ảnh hoặc mở camera
- 📊 **Dashboard** (`/dashboard`) — Xem thống kê và lịch sử

> 💡 Để test trên điện thoại: truy cập `http://<IP-máy-tính>:3000` (cùng mạng WiFi)

---

## 📡 API Endpoints

| Method | URL | Mô tả |
|--------|-----|--------|
| `GET` | `/api/health` | Health check + trạng thái model |
| `GET` | `/api/classes` | Danh sách 15 classes (tên VN + EN) |
| `POST` | `/api/predict` | Upload ảnh → phân loại bệnh |
| `GET` | `/api/history` | Lịch sử dự đoán + thống kê |

### Ví dụ gọi API

```bash
# Health check
curl http://localhost:8000/api/health

# Dự đoán bệnh
curl -X POST -F "file=@path/to/leaf_image.jpg" http://localhost:8000/api/predict
```

**Response mẫu:**
```json
{
  "class_name": "Tomato_Early_blight",
  "name_vi": "Cà chua - Cháy lá sớm",
  "confidence": 98.45,
  "description": "Bệnh do nấm Alternaria solani...",
  "recommendation": "Cắt bỏ lá bệnh, phun thuốc trừ nấm...",
  "is_healthy": false,
  "top5": [
    {"class_name": "Tomato_Early_blight", "name_vi": "Cà chua - Cháy lá sớm", "confidence": 98.45},
    {"class_name": "Tomato_Late_blight", "name_vi": "Cà chua - Cháy lá muộn", "confidence": 0.87},
    ...
  ]
}
```

---

## 👨‍🎓 Thông Tin Đồ Án

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên đề tài** | Xây dựng website phân loại và phát hiện bệnh của cây trồng thông qua lá cây sử dụng trí tuệ nhân tạo |
| **Sinh viên** | Nguyễn Hữu Khánh Tùng |
| **Mã SV** | 223630722 |
| **Ngành** | Khoa học máy tính |
| **Giảng viên HD** | PGS.TS. Trần Thị Ngân |

---

## 📜 License

This project is for educational purposes — Graduation Thesis, Computer Science, Course 63.
