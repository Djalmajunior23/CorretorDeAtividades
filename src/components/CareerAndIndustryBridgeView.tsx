import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  Briefcase,
  ShieldCheck,
  CheckCircle,
  FileText,
  ExternalLink,
  QrCode,
  Sparkles,
  TrendingUp,
  Building2,
  Lock,
  Search,
  DollarSign,
  ChevronRight,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import {
  CareerAndIndustryBridgeService,
  StudentTechPassport,
  VerifiableSkillBadge,
  JobPositionMatch
} from "../services/careerAndIndustryBridgeService";

export default function CareerAndIndustryBridgeView() {
  const [passport, setPassport] = useState<StudentTechPassport>(() =>
    CareerAndIndustryBridgeService.getStudentPassport("Lucas Gabriel")
  );
  const [selectedBadge, setSelectedBadge] = useState<VerifiableSkillBadge | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPositionMatch | null>(null);

  const handleExportPdf = () => {
    CareerAndIndustryBridgeService.exportPassportPdf(passport);
    toast.success("Passaporte de Empregabilidade e Credenciais W3C exportado!");
  };

  const handleVerifyCredential = (badge: VerifiableSkillBadge) => {
    setSelectedBadge(badge);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#030712] text-slate-100 p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/50 border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>W3C Verifiable Credentials • Open Badges 3.0 • SENAI Career</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            Passaporte de Empregabilidade & Conexão com a Indústria
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Distintivos digitais verificáveis com assinatura criptográfica SHA-256 e radar de aderência a vagas reais do mercado tech.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            <FileText className="w-4 h-4" />
            <span>Passaporte PDF</span>
          </button>
        </div>
      </div>

      {/* Top Employability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>ÍNDICE DE EMPREGABILIDADE</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-display">
              {passport.overallEmployabilityScore}%
            </span>
            <span className="text-xs text-emerald-400 font-mono">Top 5% da Turma</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
              style={{ width: `${passport.overallEmployabilityScore}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>DISTINTIVOS AUDITADOS</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-display">
            {passport.badges.length}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-2">
            100% com assinatura criptográfica
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>VAGAS EM ALTA ADERÊNCIA</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white font-display">
            {passport.jobMatches.filter((j) => j.matchPercentage >= 85).length}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-2">
            Match médio: 92% com o mercado
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>CHAVE PÚBLICA / SHA-256</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 truncate mt-1">
            {passport.verificationSha256}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Certificado W3C Válido
          </div>
        </div>
      </div>

      {/* Main Grid: Badges & Job Match Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Verifiable Badges */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Credenciais & Distintivos Verificáveis
            </h2>
            <span className="text-xs text-slate-400 font-mono">Padrão Open Badges 3.0</span>
          </div>

          <div className="space-y-3">
            {passport.badges.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {b.category}
                    </span>
                    <h3 className="text-sm font-bold text-white font-display mt-1 group-hover:text-emerald-300 transition-colors">
                      {b.badgeName}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleVerifyCredential(b)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verificar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                  <span>Nota Média: <strong className="text-white">{b.codeQualityScore}/100</strong></span>
                  <span>Testes: <strong className="text-emerald-400">{b.testsPassedRatio}</strong></span>
                  <span>Emitido: {b.issuedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Job Match Radar */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Radar de Match com Vagas do Mercado
            </h2>
            <span className="text-xs text-slate-400 font-mono">Empresas Parceiras</span>
          </div>

          <div className="space-y-3">
            {passport.jobMatches.map((j) => (
              <div
                key={j.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-400">{j.companyName}</div>
                    <h3 className="text-sm font-bold text-white font-display group-hover:text-purple-300 transition-colors">
                      {j.roleTitle}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-base font-mono font-black text-emerald-400">
                      {j.matchPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Aderência</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {j.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    {j.averageSalaryBrl}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 text-[10px]">
                    Nível: {j.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white font-display">
                    Auditoria Criptográfica de Distintivo W3C
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="text-slate-500 uppercase">Distintivo:</span>
                  <div className="text-white font-bold">{selectedBadge.badgeName}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase">Emissor Homologado:</span>
                  <div>{selectedBadge.issuer}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase">Hash SHA-256 da Evidência:</span>
                  <div className="p-2 rounded bg-slate-950 text-cyan-300 text-[11px] break-all border border-slate-800">
                    {selectedBadge.evidenceSha256}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase">Assinatura Digital Ed25519:</span>
                  <div className="p-2 rounded bg-slate-950 text-emerald-300 text-[11px] break-all border border-slate-800">
                    {selectedBadge.cryptoSignature}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
