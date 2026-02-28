"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PredictionResult {
  class_name: string;
  name_vi: string;
  confidence: number;
  description: string;
  recommendation: string;
  is_healthy: boolean;
  top5: { class_name: string; name_vi: string; confidence: number }[];
  id: string;
  filename: string;
  image_url: string;
  timestamp: string;
}

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Upload handler ──────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (jpg, png, ...)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Lỗi server");
      }

      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi phân tích ảnh");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Camera functions ────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      // Wait for next render then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      }, 100);
    } catch {
      setError("Không thể truy cập camera. Vui lòng cho phép quyền camera trong trình duyệt.");
      setCameraOpen(false);
    }
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (cameraOpen) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Convert to blob and send
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
        stopCamera();
        handleFile(file);
      },
      "image/jpeg",
      0.92
    );
  }, [handleFile, stopCamera]);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">🌿</div>
            <span>PlantAI</span>
          </Link>
          <nav className="nav-links">
            <Link href="/" className="nav-link active">
              Phân tích
            </Link>
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Hero */}
        <section className="hero fade-in">
          <div className="hero-badge">🤖 AI-Powered • Accuracy ~99%</div>
          <h1>Phân Loại Bệnh Cây Trồng</h1>
          <p>
            Upload ảnh hoặc mở camera để chụp trực tiếp lá cây. Hệ thống AI tự động
            phát hiện và phân loại bệnh — hỗ trợ 15 loại bệnh trên cà chua, ớt chuông và khoai tây.
          </p>
        </section>

        {/* ── Camera Modal ─────────────────────── */}
        {cameraOpen && (
          <section className="camera-section fade-in" style={{ maxWidth: 700, margin: "0 auto 2rem" }}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Camera header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  📹 Camera — {facingMode === "environment" ? "Camera sau" : "Camera trước"}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={switchCamera}
                    className="camera-control-btn"
                    title="Đổi camera"
                  >
                    🔄
                  </button>
                  <button
                    onClick={stopCamera}
                    className="camera-control-btn"
                    style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}
                    title="Đóng camera"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Video feed */}
              <div style={{ position: "relative", background: "#000", aspectRatio: "16/9" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />
                {!cameraReady && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div className="spinner"></div>
                  </div>
                )}

                {/* Viewfinder corners */}
                <div className="viewfinder">
                  <div className="vf-corner vf-tl"></div>
                  <div className="vf-corner vf-tr"></div>
                  <div className="vf-corner vf-bl"></div>
                  <div className="vf-corner vf-br"></div>
                </div>
              </div>

              {/* Capture button */}
              <div style={{ padding: "16px", textAlign: "center" }}>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="capture-btn"
                >
                  <span className="capture-btn-inner"></span>
                </button>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }}>
                  Nhấn nút để chụp ảnh lá cây
                </p>
              </div>
            </div>
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </section>
        )}

        {/* ── Upload Zone ──────────────────────── */}
        {!cameraOpen && (
          <section className="upload-section fade-in fade-in-delay-1">
            <div
              className={`upload-zone ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📷</div>
              <div className="upload-text">
                <h3>Kéo thả ảnh lá cây vào đây</h3>
                <p>hoặc click để chọn file • Hỗ trợ JPG, PNG, WEBP</p>
              </div>
              <button className="upload-btn" type="button">
                🔍 Chọn ảnh & Phân tích
              </button>
            </div>

            {/* Camera button — below upload zone */}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="camera-btn"
              >
                📹 Mở Camera chụp trực tiếp
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleSelect}
              style={{ display: "none" }}
            />
          </section>
        )}

        {/* Error */}
        {error && (
          <div
            className="card fade-in"
            style={{
              maxWidth: 700,
              margin: "0 auto 2rem",
              borderColor: "rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.05)",
            }}
          >
            <p style={{ color: "var(--accent-red)", textAlign: "center" }}>⚠️ {error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card fade-in" style={{ maxWidth: 700, margin: "0 auto 2rem" }}>
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p className="loading-text">Đang phân tích ảnh lá cây...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && selectedImage && !loading && (
          <div className="preview-container fade-in">
            {/* Image Preview */}
            <div className="preview-image-card">
              <div className="card">
                <div className="preview-image-wrapper">
                  <img src={selectedImage} alt="Uploaded leaf" />
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginTop: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  {result.filename}
                </p>
              </div>
            </div>

            {/* Result Details */}
            <div className="preview-result">
              {/* Status badge */}
              <div className="result-main card">
                <div className={`result-status ${result.is_healthy ? "healthy" : "disease"}`}>
                  {result.is_healthy ? "✅ Khỏe mạnh" : "🔴 Phát hiện bệnh"}
                </div>
                <h2 className="result-disease-name">{result.name_vi}</h2>

                {/* Confidence bar */}
                <div className="confidence-bar-container">
                  <div className="confidence-label">
                    <span>Độ tin cậy</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-bar-fill"
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Description */}
                {result.description && (
                  <div className="result-info">
                    <h4>📋 Mô tả</h4>
                    <p>{result.description}</p>
                  </div>
                )}

                {/* Recommendation */}
                {result.recommendation && (
                  <div className="result-info" style={{ marginTop: "0.75rem" }}>
                    <h4>💡 Khuyến nghị xử lý</h4>
                    <p>{result.recommendation}</p>
                  </div>
                )}
              </div>

              {/* Top 5 */}
              <div className="card fade-in fade-in-delay-2" style={{ marginTop: "1rem" }}>
                <div className="card-header">
                  <span className="card-title">Top 5 Dự đoán</span>
                </div>
                <ul className="top5-list">
                  {result.top5.map((item, idx) => (
                    <li key={item.class_name} className="top5-item">
                      <span className="top5-rank">{idx + 1}</span>
                      <span className="top5-name">{item.name_vi}</span>
                      <span className="top5-conf">{item.confidence}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
