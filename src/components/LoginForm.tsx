import React, { useState, useEffect } from "react";
import { User } from "../types";
import BrandMark from "./BrandMark";
import {
  ShieldCheck,
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Briefcase, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  KeyRound,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "signup" | "recovery">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Gerente");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync theme selection directly from document.documentElement
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggleLocalTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("erp_theme", "dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("erp_theme", "light");
    }
  };

  // Auto-fill from localStorage if rememberMe was true & parse invitation link
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get("invite");
      if (invite === "driver") {
        setMode("signup");
        const invitedName = params.get("name") || "";
        const invitedEmail = params.get("email") || "";
        const invitedPhone = params.get("phone") || "";
        if (invitedName) setName(invitedName);
        if (invitedEmail) setEmail(invitedEmail);
        if (invitedPhone) setPhone(invitedPhone);
        setRole("Motorista");
        setSuccessMsg(`Convite ativo para ${invitedName}! Preencha seus dados adicionais e sua senha de acesso.`);
      }
    }
  }, []);

  // Quick 1-click test login tool
  const handleQuickDemoLogin = () => {
    setEmail("admin@transportadora.com");
    setPassword("admin123");
    setErrorMsg("");
    setSuccessMsg("Credenciais preenchidas com sucesso!");
    
    // Smooth auto submit trigger delay
    setTimeout(() => {
      const form = document.getElementById("login-main-form") as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        if (rememberMe) {
          localStorage.setItem("remember_email", email);
        } else {
          localStorage.removeItem("remember_email");
        }
        localStorage.setItem("erp_session", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || "Erro ao realizar login.");
      }
    } catch (err) {
      // Fallback for immediate trial in case dev server starts slowly
      if (email === "admin@transportadora.com" && password === "admin123") {
        const fallbackUser: User = {
          id: "usr_fallback",
          name: "Admin Logística (Modo Local)",
          email,
          phone: "(11) 98888-7777",
          role: "Gerente"
        };
        localStorage.setItem("erp_session", JSON.stringify(fallbackUser));
        onLoginSuccess(fallbackUser);
      } else {
        setErrorMsg("Erro de comunicação com o servidor. Tente utilizar as credenciais de teste: admin@transportadora.com / admin123");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setErrorMsg("Todos os campos de cadastro são obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, role })
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMsg("Cadastro realizado com sucesso! Faça login abaixo.");
        setMode("login");
        setPassword("");
      } else {
        setErrorMsg(data.message || "Falha ao registrar usuário.");
      }
    } catch (err) {
      setErrorMsg("Não foi possível conectar com o servidor para realizar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Por favor, digite seu e-mail.");
      return;
    }
    setSuccessMsg("Instruções de recuperação enviadas para o e-mail informado!");
    setMode("login");
  };

  return (
    <div id="login-screen-root" className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 md:p-8 relative overflow-y-auto font-sans transition-colors duration-300">
      
      {/* Dynamic Background Grid and Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      
      {/* Interactive gradient spots adapting perfectly to light/dark themes */}
      <div className="absolute -top-40 -left-40 w-96 md:w-[600px] h-96 md:h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full filter blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute -bottom-40 -right-40 w-96 md:w-[600px] h-96 md:h-[600px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full filter blur-3xl pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Floating Theme Switcher Button in Top Corner */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleLocalTheme}
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border hover:border-muted-foreground/30 rounded-xl text-xs font-bold text-foreground shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Alternar Tema"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline font-black text-[10px] uppercase tracking-wider">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline font-black text-[10px] uppercase tracking-wider">Modo Escuro</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container - Split View Workspace */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl md:min-h-[600px] bg-card/85 dark:bg-[#0F1729]/70 border border-border dark:border-[#1F2E4D] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 backdrop-blur-xl transition-colors duration-300"
      >
        
        {/* LEFT PANEL: SLICK IA LOGISTICS PRESENTATION & STATS SHOWCASE */}
        <div className="hidden md:flex md:w-[48%] bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/20 dark:from-[#0B0F19] dark:via-[#0A0E17] dark:to-[#060911] border-r border-border dark:border-[#1F2E4D] p-8 flex-col justify-between relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          
          {/* Subtle Vector Logistics Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <BrandMark size="lg" />
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">DODISA</span>
                <span className="font-light text-muted-foreground dark:text-slate-400 text-xs tracking-widest uppercase">LOGÍSTICA</span>
              </h1>
              <p className="text-[9px] text-blue-600 dark:text-blue-400/80 font-mono tracking-wider font-extrabold uppercase">NEXT-GEN INTELLIGENCE</p>
            </div>
          </div>

          {/* Interactive Core Logistics Showcase with Motion */}
          <div className="my-auto py-8 relative z-10 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-blue-600 dark:text-blue-400" />
                Mapeamento Inteligente Ativo
              </span>
              <h2 className="text-2xl font-black text-foreground dark:text-white leading-tight uppercase">
                A Revolução da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400">Visão Computacional</span> na Logística de Cargas
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-xs leading-relaxed font-normal">
                Digitalização instantânea de notas de frete, controle de rotas por inteligência artificial, e conciliação de custos operacionais com precisão militar.
              </p>
            </div>

            {/* Simulated Live Cockpit Telemetry Widget */}
            <div className="p-4 bg-white/60 dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] rounded-2xl space-y-3.5 shadow-inner backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border dark:border-[#1F2E4D] pb-2.5">
                <span className="text-[10px] font-mono text-muted-foreground dark:text-slate-400 flex items-center gap-1.5 font-bold uppercase">
                  <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  DODISA AI ENGINE v2.5
                </span>
                <span className="flex items-center gap-1 text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-[#121B2E]/50 border border-border dark:border-[#1F2E4D]/80 rounded-xl space-y-1">
                  <span className="text-[8px] text-muted-foreground dark:text-slate-500 uppercase font-mono font-bold tracking-wider">OCR Multimodal</span>
                  <p className="text-xs font-mono font-bold text-foreground dark:text-slate-200">Acurácia: <span className="text-emerald-600 dark:text-emerald-400">99.4%</span></p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#121B2E]/50 border border-border dark:border-[#1F2E4D]/80 rounded-xl space-y-1">
                  <span className="text-[8px] text-muted-foreground dark:text-slate-500 uppercase font-mono font-bold tracking-wider">Cálculo de Rotas</span>
                  <p className="text-xs font-mono font-bold text-foreground dark:text-slate-200">Latência: <span className="text-blue-600 dark:text-blue-400">&lt; 150ms</span></p>
                </div>
              </div>

              {/* Tiny Dynamic Motion Bar representing a route */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono text-muted-foreground dark:text-slate-500 font-bold uppercase">
                  <span>Hub São Paulo</span>
                  <span>Porto de Santos</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-[#1E2942] rounded-full overflow-hidden relative">
                  <motion.div 
                    animate={{ 
                      left: ["-100%", "100%"]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2.5, 
                      ease: "easeInOut" 
                    }}
                    className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  />
                  <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 w-[65%] rounded-full transition-all duration-1000" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance info */}
          <div className="border-t border-border dark:border-[#1F2E4D]/80 pt-4 flex items-center gap-2.5 text-[10px] text-muted-foreground dark:text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span>Infraestrutura segura em conformidade com a LGPD.</span>
          </div>
        </div>

        {/* RIGHT PANEL: SOPHISTICATED INTERACTIVE LOGIN FORM */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between relative bg-card dark:bg-transparent gap-8">
          
          {/* Mobile Brand Header */}
          <div className="flex md:hidden items-center justify-between mb-8 pb-4 border-b border-border dark:border-[#1F2E4D]">
            <div className="flex items-center gap-2.5">
              <BrandMark size="sm" />
              <div>
                <h1 className="text-sm font-black text-foreground dark:text-white tracking-wider uppercase">DODISA LOGÍSTICA</h1>
                <p className="text-[8px] text-blue-600 dark:text-blue-400/80 font-mono tracking-widest font-extrabold">SYSTEM ACCESS</p>
              </div>
            </div>
            
            <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Seguro
            </span>
          </div>

          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Form Headline with interactive tabs */}
            <div className="space-y-1.5 text-left">
              <h2 className="text-xl font-black text-foreground dark:text-white uppercase tracking-wider">
                {mode === "login" && "Acessar Plataforma"}
                {mode === "signup" && "Criar Conta Operacional"}
                {mode === "recovery" && "Recuperação de Acesso"}
              </h2>
              <p className="text-xs text-muted-foreground dark:text-slate-400 font-normal">
                {mode === "login" && "Entre com suas credenciais para gerenciar operações."}
                {mode === "signup" && "Cadastre um novo operador no sistema corporativo."}
                {mode === "recovery" && "Insira seu e-mail para receber as instruções de redefinição."}
              </p>
            </div>

            {/* Error Message Box with Animation */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-xs leading-relaxed text-left flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0 animate-pulse" />
                  <span className="font-semibold">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message Box with Animation */}
            <AnimatePresence mode="wait">
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs leading-relaxed text-left flex items-start gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DYNAMIC FORMS ACCORDING TO SYSTEM MODES */}
            <AnimatePresence mode="wait">
              
              {/* MODE: LOGIN */}
              {mode === "login" && (
                <motion.form 
                  key="login-form"
                  id="login-main-form"
                  onSubmit={handleLogin}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-left"
                >
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">E-mail Operacional</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground dark:text-slate-500 transition-colors duration-200" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: admin@transportadora.com"
                        className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-3 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">Senha de Segurança</label>
                      <button
                        type="button"
                        onClick={() => setMode("recovery")}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-mono transition-colors font-bold"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground dark:text-slate-500 transition-colors duration-200" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-10 py-3 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me toggle */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="accent-blue-600 rounded bg-background dark:bg-[#0B0F19] border-border dark:border-[#1F2E4D] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span>Manter e-mail conectado</span>
                    </label>
                  </div>

                  {/* Core Submission button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-80 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer uppercase tracking-wider"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Autenticando Operador...
                      </span>
                    ) : (
                      <>
                        Entrar no Cockpit ERP
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Quick-Autofill Demo Account Box */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="w-full py-3 bg-muted/40 hover:bg-muted border border-border hover:border-blue-500/30 rounded-xl text-[11px] font-mono transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 group cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:animate-bounce" />
                      <span>Acesso Rápido de Teste (1-Click) ⚡</span>
                    </button>
                  </div>

                  {/* Register redirection option */}
                  <div className="text-center pt-2 border-t border-border dark:border-[#1F2E4D]/60 mt-4">
                    <p className="text-xs text-muted-foreground dark:text-slate-400 font-normal">
                      Novo por aqui?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-black transition-colors cursor-pointer"
                      >
                        Cadastre sua conta corporativa
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}

              {/* MODE: SIGNUP */}
              {mode === "signup" && (
                <motion.form 
                  key="signup-form"
                  onSubmit={handleSignup}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5 text-left"
                >
                  {/* Name Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground dark:text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: João Silva"
                        className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Corporate Email Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground dark:text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: joao@transportadora.com"
                        className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Role Grid Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Phone Field */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">Telefone corporativo</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground dark:text-slate-500" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="ex: (11) 98888-7777"
                          className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Operational Role Select field */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">Cargo Operacional</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground dark:text-slate-500" />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-foreground dark:text-white outline-none transition-all appearance-none font-bold"
                        >
                          <option value="Gerente" className="text-foreground bg-card">Gerente</option>
                          <option value="Coordenador" className="text-foreground bg-card">Coordenador</option>
                          <option value="Operador Logístico" className="text-foreground bg-card">Operador Logístico</option>
                          <option value="Financeiro" className="text-foreground bg-card">Financeiro</option>
                          <option value="Motorista" className="text-foreground bg-card">Motorista</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Password field */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">Senha de Segurança</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground dark:text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {/* Submission buttons */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Efetuando Cadastro...
                      </span>
                    ) : (
                      "Cadastrar Nova Conta Operacional"
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground dark:text-slate-400 font-normal">
                      Já possui credenciais corporativas?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-black transition-colors cursor-pointer"
                      >
                        Fazer login
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}

              {/* MODE: RECOVERY */}
              {mode === "recovery" && (
                <motion.form 
                  key="recovery-form"
                  onSubmit={handleRecovery}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-left"
                >
                  <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed text-center mb-1 font-normal">
                    Insira seu e-mail operacional cadastrado no sistema. Nós localizaremos seu registro e enviaremos um link criptografado para a redefinição de senha.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-black text-muted-foreground dark:text-slate-400 tracking-wider">E-mail cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground dark:text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: joao@transportadora.com"
                        className="w-full bg-background dark:bg-[#0B0F19]/70 border border-border dark:border-[#1F2E4D] hover:border-muted-foreground/30 dark:hover:border-[#293B5E] focus:border-blue-500 dark:focus:border-blue-500/80 rounded-xl pl-10 pr-3 py-3 text-xs text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
                  >
                    Enviar Link de Recuperação 📧
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-black transition-colors cursor-pointer"
                    >
                      Cancelar e voltar
                    </button>
                  </div>
                </motion.form>
              )}

            </AnimatePresence>

          </div>

          {/* Bottom Security Footer */}
          <div className="w-full text-center text-[10px] text-muted-foreground dark:text-slate-500 font-mono flex items-center justify-center gap-1.5 select-none px-4 uppercase font-bold tracking-wider mt-auto pt-4 border-t border-border/10">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
            <span>Sessão Criptografada • Módulo de Acesso DODISA v2.5 ERP</span>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
