import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Code, LogIn } from "lucide-react";
import { normalizeRole } from "../utils/roles";
import { getApiBaseUrl } from "../services/apiService";

export default function LoginPage() {
  const { login, user, diagnoseResponse } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authenticated, redirect immediately
  if (user) {
    if (user.role === "ALUNO") {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/teacher/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let response: Response | null = null;
    const API_BASE_URL = getApiBaseUrl();
    const url = API_BASE_URL.endsWith("/auth/login") ? API_BASE_URL : `${API_BASE_URL.replace(/\/+$/, "")}/auth/login`;

    try {
      console.log("LOGIN REQUEST");
      console.log(email);
      console.log("API URL:", API_BASE_URL);

      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("LOGIN RESPONSE:", data);

      if (response.ok) {
        data.user.role = normalizeRole(data.user.role);
        login(data.token || data.access_token, data.user);
        if (data.user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (data.user.role === "PROFESSOR") {
          navigate("/teacher/dashboard");
        } else if (data.user.role === "ALUNO") {
          navigate("/student/dashboard");
        } else {
          navigate("/teacher/dashboard");
        }
      } else {
        setError(data.detail || "Falha no login");
        await diagnoseResponse(response, null, url, "POST");
      }
    } catch (err) {
      console.error("Login caught error:", err);
      setError("Erro na comunicação com servidor");
      await diagnoseResponse(response, err, url, "POST");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F111A] text-slate-200">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
        <Code className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-2">CodeCheck AI</h1>
      <p className="text-slate-400 mb-10">Sign in to your account</p>

      <form onSubmit={handleLogin} className="flex flex-col space-y-4 w-80">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="px-4 py-3 rounded-lg bg-[#1A1D27] border border-slate-700 text-slate-200"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="px-4 py-3 rounded-lg bg-[#1A1D27] border border-slate-700 text-slate-200"
          required
        />

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center space-x-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-900/50 disabled:opacity-50"
        >
          <LogIn className="w-5 h-5" />
          <span>{loading ? "Entrando..." : "Entrar"}</span>
        </button>
      </form>
    </div>
  );
}
