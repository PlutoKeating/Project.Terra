import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { designSystem } from "../designSystem";
import RainbowStrip from "../components/RainbowStrip";
import { apiFetch } from "../apiFetch";
import { useAuth } from "../App";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert("Please enter a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? "/api/v1/auth/register" : "/api/v1/auth/login";
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "认证请求失败");
      }

      if (isSignUp) {
        alert("注册成功！现在您可以直接登录。");
        setIsSignUp(false);
        setPassword("");
      } else {
        const data = await res.json();
        login(data.email);
        navigate("/");
      }
    } catch (err: any) {
      alert("操作失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: designSystem.colors.surface }}
      id="auth-page-container"
    >
      <div
        className="w-full max-w-md bg-white border shadow-xl flex flex-col relative"
        style={{
          borderColor: designSystem.colors.borderDark,
          borderRadius: "0px",
        }}
        id="auth-card"
      >
        <RainbowStrip height="10px" id="auth-top-rainbow" />

        <div className="p-10 flex flex-col justify-between" id="auth-card-body">
          <div className="text-center md:text-left" id="auth-branding">
            <h1
              className="text-[44px] font-bold font-courier tracking-wide mt-2"
              style={{ color: designSystem.colors.onSurface }}
              id="auth-title"
            >
              Terra
            </h1>
            <p
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400 mt-2 block font-bold"
              id="auth-subtitle"
            >
              {isSignUp ? "Registration Terminal" : "Authentication Terminal"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6" id="auth-form">
            <div id="auth-form-email">
              <label
                className="block font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pb-2 pt-1 font-mono text-sm border-b focus:border-b-purple-900 outline-none transition-colors"
                style={{
                  borderColor: designSystem.colors.outlineVariant,
                  color: designSystem.colors.onSurface,
                  backgroundColor: "transparent",
                }}
                id="input-auth-email"
              />
            </div>

            <div id="auth-form-password">
              <label
                className="block font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pb-2 pt-1 font-mono text-sm border-b focus:border-b-purple-900 outline-none transition-colors"
                style={{
                  borderColor: designSystem.colors.outlineVariant,
                  color: designSystem.colors.onSurface,
                  backgroundColor: "transparent",
                }}
                id="input-auth-password"
              />
            </div>

            <div className="pt-4" id="auth-submit-wrapper">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 border font-mono text-[11px] font-bold uppercase tracking-[0.2em] relative transition-all active:translate-y-[1px] hover:bg-gray-50/50 cursor-pointer disabled:opacity-50"
                style={{
                  borderColor: designSystem.colors.borderDark,
                  color: designSystem.colors.onSurface,
                  backgroundColor: "#ffffff",
                }}
                id="btn-auth-submit"
              >
                {loading ? "PROCESSING..." : isSignUp ? "Sign Up" : "Sign In"}
                <div className="absolute left-1 right-1 bottom-1 h-[4px] overflow-hidden">
                  <RainbowStrip height="4px" />
                </div>
              </button>
            </div>
          </form>

          <div
            className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between font-mono text-[10px] text-gray-400"
            id="auth-bottom-links"
          >
            <button
              onClick={() => alert("Password reset is managed in local session. Please register a new account.")}
              className="uppercase tracking-wider hover:text-gray-900 transition-colors"
              id="auth-link-forgot"
            >
              Forgot Password
            </button>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="uppercase tracking-wider text-purple-800 font-bold hover:text-purple-900 transition-colors"
              id="auth-link-toggle"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
