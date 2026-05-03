"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken, getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNext = () => {
    if (typeof window === "undefined") return "/dashboard";
    return new URLSearchParams(window.location.search).get("next") || "/dashboard";
  };

  // Already logged in → bounce to next
  useEffect(() => {
    if (getToken()) router.replace(getNext());
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Đăng nhập thất bại");
      }

      const data = await res.json();
      setToken(data.access_token);
      router.replace(getNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="login-wrapper fade-in">
          <div className="card login-card">
            <div className="login-header">
              <div className="login-icon">🔐</div>
              <h1>Đăng nhập quản trị</h1>
              <p>Truy cập Dashboard thống kê & lịch sử phân tích</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Tài khoản</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error">⚠️ {error}</div>
              )}

              <button type="submit" className="upload-btn login-submit" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "🔓 Đăng nhập"}
              </button>
            </form>

            <p className="login-hint">
              Demo: <code>admin</code> / <code>admin</code>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
