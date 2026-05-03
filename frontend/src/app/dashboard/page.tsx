"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authHeader, clearToken, getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Color palette for charts
const CHART_COLORS = [
    "#22c55e", "#ef4444", "#3b82f6", "#eab308", "#a855f7",
    "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#8b5cf6",
    "#10b981", "#f43f5e", "#6366f1", "#84cc16", "#d946ef",
];

interface HistoryItem {
    id: string;
    class_name: string;
    name_vi: string;
    confidence: number;
    is_healthy: boolean;
    filename: string;
    image_url: string;
    timestamp: string;
}

interface HistoryData {
    history: HistoryItem[];
    total: number;
    disease_counts: Record<string, number>;
    healthy_count: number;
    disease_count: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const handleLogout = useCallback(() => {
        clearToken();
        router.replace("/login");
    }, [router]);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/history`, {
                headers: { ...authHeader() },
            });
            if (res.status === 401) {
                handleLogout();
                return;
            }
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            console.error("Failed to fetch history");
        } finally {
            setLoading(false);
        }
    }, [handleLogout]);

    // Guard: redirect to /login if no token
    useEffect(() => {
        if (!getToken()) {
            router.replace("/login?next=/dashboard");
            return;
        }
        setAuthChecked(true);
    }, [router]);

    useEffect(() => {
        if (!authChecked) return;
        fetchData();
        const interval = setInterval(fetchData, 5000); // auto-refresh 5s
        return () => clearInterval(interval);
    }, [authChecked, fetchData]);

    if (!authChecked) return null;

    const diseaseCounts = data?.disease_counts || {};
    const maxCount = Math.max(...Object.values(diseaseCounts), 1);

    // Donut chart calculations
    const donutData = Object.entries(diseaseCounts).map(([name, count], i) => ({
        name,
        count,
        color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const total = donutData.reduce((s, d) => s + d.count, 0);
    let cumulativePercent = 0;

    const donutSegments = donutData.map((d) => {
        const percent = total > 0 ? (d.count / total) * 100 : 0;
        const offset = cumulativePercent;
        cumulativePercent += percent;
        return { ...d, percent, offset };
    });

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
                        <Link href="/" className="nav-link">
                            Phân tích
                        </Link>
                        <Link href="/dashboard" className="nav-link active">
                            Dashboard
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="nav-link logout-btn"
                            title="Đăng xuất"
                        >
                            🚪 Đăng xuất
                        </button>
                    </nav>
                </div>
            </header>

            <main className="container">
                {/* Page Title */}
                <section className="hero fade-in" style={{ paddingBottom: "1rem" }}>
                    <div className="hero-badge">📊 Thống kê & Lịch sử</div>
                    <h1>Dashboard</h1>
                    <p>Theo dõi kết quả phân tích, thống kê phân bố bệnh và lịch sử dự đoán.</p>
                </section>

                {loading ? (
                    <div className="card">
                        <div className="loading-overlay">
                            <div className="spinner"></div>
                            <p className="loading-text">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Stat Cards ─────────────────────── */}
                        <div className="dashboard-grid fade-in fade-in-delay-1">
                            <div className="stat-card">
                                <div className="stat-icon blue">📸</div>
                                <div className="stat-value">{data?.total || 0}</div>
                                <div className="stat-label">Tổng ảnh đã phân tích</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green">✅</div>
                                <div className="stat-value">{data?.healthy_count || 0}</div>
                                <div className="stat-label">Lá khỏe mạnh</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon red">🔴</div>
                                <div className="stat-value">{data?.disease_count || 0}</div>
                                <div className="stat-label">Lá có bệnh</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon purple">🎯</div>
                                <div className="stat-value">
                                    {Object.keys(diseaseCounts).length}
                                </div>
                                <div className="stat-label">Loại bệnh phát hiện</div>
                            </div>
                        </div>

                        {/* ── Charts ─────────────────────────── */}
                        <div className="charts-row fade-in fade-in-delay-2">
                            {/* Bar Chart — Disease Distribution */}
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">📊 Phân bố bệnh</span>
                                    <span className="card-subtitle">{data?.total || 0} mẫu</span>
                                </div>
                                {Object.keys(diseaseCounts).length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📊</div>
                                        <h3>Chưa có dữ liệu</h3>
                                        <p>Hãy phân tích ảnh lá cây để xem thống kê.</p>
                                    </div>
                                ) : (
                                    <div className="bar-chart">
                                        {Object.entries(diseaseCounts)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([name, count], idx) => (
                                                <div key={name} className="bar-item">
                                                    <span className="bar-label" title={name}>
                                                        {name}
                                                    </span>
                                                    <div className="bar-track">
                                                        <div
                                                            className="bar-fill"
                                                            style={{
                                                                width: `${(count / maxCount) * 100}%`,
                                                                background: CHART_COLORS[idx % CHART_COLORS.length],
                                                                color: "#0a0f1a",
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="bar-count">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Donut Chart — Healthy vs Disease */}
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">🍩 Tỷ lệ bệnh</span>
                                </div>
                                {total === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🍩</div>
                                        <h3>Chưa có dữ liệu</h3>
                                        <p>Hãy phân tích ảnh lá cây để xem biểu đồ.</p>
                                    </div>
                                ) : (
                                    <div className="donut-wrapper">
                                        <svg className="donut-svg" viewBox="0 0 42 42">
                                            <circle
                                                cx="21"
                                                cy="21"
                                                r="15.91549430918954"
                                                fill="transparent"
                                                stroke="rgba(255,255,255,0.04)"
                                                strokeWidth="4"
                                            />
                                            {donutSegments.map((seg) => (
                                                <circle
                                                    key={seg.name}
                                                    cx="21"
                                                    cy="21"
                                                    r="15.91549430918954"
                                                    fill="transparent"
                                                    stroke={seg.color}
                                                    strokeWidth="4"
                                                    strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
                                                    strokeDashoffset={25 - seg.offset}
                                                    strokeLinecap="round"
                                                    style={{ transition: "all 1s ease" }}
                                                />
                                            ))}
                                            <text
                                                x="21"
                                                y="19.5"
                                                textAnchor="middle"
                                                fill="var(--text-primary)"
                                                fontSize="5"
                                                fontWeight="700"
                                            >
                                                {total}
                                            </text>
                                            <text
                                                x="21"
                                                y="24"
                                                textAnchor="middle"
                                                fill="var(--text-muted)"
                                                fontSize="2.5"
                                            >
                                                mẫu
                                            </text>
                                        </svg>
                                        <div className="donut-legend">
                                            {donutSegments.map((seg) => (
                                                <div key={seg.name} className="legend-item">
                                                    <span
                                                        className="legend-dot"
                                                        style={{ background: seg.color }}
                                                    ></span>
                                                    <span>
                                                        {seg.name} ({seg.count})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── History Table ───────────────────── */}
                        <div className="card fade-in fade-in-delay-3">
                            <div className="card-header">
                                <span className="card-title">🕐 Lịch sử phân tích</span>
                                <span className="card-subtitle">
                                    {data?.total || 0} kết quả gần đây
                                </span>
                            </div>
                            {(!data?.history || data.history.length === 0) ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🕐</div>
                                    <h3>Chưa có lịch sử</h3>
                                    <p>Hãy bắt đầu phân tích ảnh lá cây tại trang Phân tích.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Ảnh</th>
                                                <th>Kết quả</th>
                                                <th>Trạng thái</th>
                                                <th>Độ tin cậy</th>
                                                <th>Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.history.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <img
                                                            className="history-thumb"
                                                            src={`${API_URL}${item.image_url}`}
                                                            alt={item.name_vi}
                                                        />
                                                    </td>
                                                    <td className="history-disease">{item.name_vi}</td>
                                                    <td>
                                                        <span
                                                            className={`tag ${item.is_healthy ? "healthy" : "disease"}`}
                                                        >
                                                            {item.is_healthy ? "Khỏe" : "Bệnh"}
                                                        </span>
                                                    </td>
                                                    <td className="history-confidence">
                                                        {item.confidence}%
                                                    </td>
                                                    <td
                                                        style={{
                                                            fontSize: "0.8rem",
                                                            color: "var(--text-muted)",
                                                        }}
                                                    >
                                                        {new Date(item.timestamp).toLocaleString("vi-VN")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </>
    );
}
