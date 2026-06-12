import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Code, LogIn, Sparkles, Terminal, ShieldAlert, BadgeCheck } from "lucide-react";
import { normalizeRole } from "../utils/roles";
import { getApiBaseUrl } from "../services/apiService";
import { motion, AnimatePresence } from "motion/react";

const INSTITUTIONAL_SLIDES = [
  {
    title: "Correção Multilíngue Segura",
    desc: "Sandbox isolada executa e verifica códigos de alunos em tempo real com tempos limite rigorosos.",
    icon: Terminal,
    color: "text-emerald-400"
  },
  {
    title: "Sugestões de Feedback com IA",
    desc: "O modelo ajuda você a apontar melhorias de estilo, complexidade ciclomática e lógica pedagógica.",
    icon: Sparkles,
    color: "text-purple-400"
  },
  {
    title: "Prevenção Avançada de Plágio",
    desc: "Monitore similaridades estruturais em submissões e receba alertas automáticos de inconformidades.",
    icon: ShieldAlert,
    color: "text-rose-450"
  }
];

export default function LoginPage() {
  const { login, user, diagnoseResponse } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % INSTITUTIONAL_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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

  const SlideIcon = INSTITUTIONAL_SLIDES[currentSlide].icon;

  return (
    <div className="flex min-h-screen bg-[#020512] text-slate-100 overflow-hidden font-sans">
      
      {/* LEFT COLUMN: BRANDING & MARKETING PANEL (Glows, slideshow, high-end look) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#050819] relative flex-col justify-between p-16 overflow-hidden border-r border-slate-800/80">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Code className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white leading-none">CodeCheck</h2>
            <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-widest uppercase mt-1 block">Apoio de Avaliação Crítica</span>
          </div>
        </div>

        {/* Dynamic slides content details */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-5"
            >
              <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner`}>
                <SlideIcon className={`w-6 h-6 ${INSTITUTIONAL_SLIDES[currentSlide].color}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                  {INSTITUTIONAL_SLIDES[currentSlide].title}
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm mt-3 font-medium">
                  {INSTITUTIONAL_SLIDES[currentSlide].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators dot list */}
          <div className="flex gap-2.5 mt-8">
            {INSTITUTIONAL_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === i ? "w-8 bg-emerald-400" : "w-1.5 bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer label details */}
        <div className="relative z-10 border-t border-slate-900 pt-6">
          <p className="text-xs text-slate-500 font-mono leading-relaxed">
            Plataforma corporativa de auxílio pedagógico e avaliações práticas estaticamente isoladas.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN ACCOUNT SECURE INTERFACE */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute top-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-[90px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-[#050819]/40 border border-slate-800/80 rounded-3xl p-10 backdrop-blur-xl shadow-2xl relative"
        >
          {/* Logo brand for mobile layout only */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Code className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">CodeCheck</h2>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Acessar Plataforma</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Entre com as credenciais acadêmicas de administrador ou professor</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">E-mail Corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@email.com"
                className="px-4 py-3 text-xs bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Senha de Acesso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha secreta"
                className="px-4 py-3 text-xs bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-rose-400 text-xs text-center border border-rose-500/10 bg-rose-500/5 px-4 py-2.5 rounded-xl font-mono"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              {loading ? (
                <span className="text-xs font-bold uppercase tracking-wider">Verificando credenciais...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-slate-950" />
                  <span className="text-xs font-bold uppercase tracking-wider">Acessar e Validar</span>
                </>
              )}
            </button>
          </form>

          {/* Institutional Note */}
          <div className="mt-8 text-center border-t border-slate-900 pt-5">
            <span className="text-[10px] font-mono text-slate-600 tracking-wide font-medium">CONEXÃO SEGURA SANDBOX ATIVA</span>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

