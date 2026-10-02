import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  Mail,
  Smartphone,
  Check,
  ChevronRight,
  Send,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import {
  UnifiedNotificationCenterService,
  UnifiedNotificationItem
} from "../services/unifiedNotificationCenterService";

interface UnifiedNotificationCenterViewProps {
  onNavigate?: (tab: string) => void;
}

export default function UnifiedNotificationCenterView({ onNavigate }: UnifiedNotificationCenterViewProps) {
  const [notifications, setNotifications] = useState<UnifiedNotificationItem[]>(() =>
    UnifiedNotificationCenterService.getNotifications()
  );
  const [filterType, setFilterType] = useState<string>("ALL");

  const handleMarkAsRead = (id: string) => {
    UnifiedNotificationCenterService.markAsRead(id);
    setNotifications([...UnifiedNotificationCenterService.getNotifications()]);
    toast.success("Notificação marcada como lida.");
  };

  const handleMarkAllAsRead = () => {
    const count = UnifiedNotificationCenterService.markAllAsRead("prof-djalma");
    setNotifications([...UnifiedNotificationCenterService.getNotifications()]);
    toast.success(`${count} notificações marcadas como lidas.`);
  };

  const filtered = notifications.filter(n => {
    if (filterType === "ALL") return true;
    return n.eventType === filterType;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Centro de Notificações Unificado
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Multi-Canal & Privacidade
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rastreamento de avisos acadêmicos, confirmação de entrega e alertas sem vazamento de notas ou dados pessoais.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Marcar Todas como Lidas</span>
          </button>
        </div>
      </div>

      {/* Zero Leakage Privacy Guarantee */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Garantia de Privacidade:</strong> As notificações enviadas por e-mail ou push contêm apenas avisos procedimentais (ex: "Feedback publicado"). Nenhuma nota numérica ou dado sensível é trafegado em canais externos abertos.
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-mono uppercase text-purple-400 font-bold tracking-wider">
            Histórico de Avisos ({filtered.length})
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="ALL">Todos os Eventos</option>
              <option value="FEEDBACK_PUBLICADO">Feedback Publicado</option>
              <option value="ENTREGA_RECEBIDA">Entrega Recebida</option>
              <option value="FALHA_TECNICA_DOCENTE">Falha Técnica</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                notif.status === "LIDA"
                  ? "bg-slate-950/40 border-slate-800/60 text-slate-400"
                  : "bg-slate-900/90 border-purple-500/40 text-slate-200 shadow-md shadow-purple-500/5"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">{notif.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {notif.eventType}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(notif.createdAtIso).toLocaleTimeString("pt-BR")}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {notif.bodySanitized}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.status !== "LIDA" && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer"
                  >
                    Marcar como Lida
                  </button>
                )}

                {notif.targetDeepLinkTab && onNavigate && (
                  <button
                    onClick={() => onNavigate(notif.targetDeepLinkTab)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1"
                  >
                    <span>Abrir Módulo</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
