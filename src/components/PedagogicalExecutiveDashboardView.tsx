import React, { useState } from "react";
import { LayoutDashboard, BarChart2, Briefcase, Activity } from "lucide-react";
import PedagogicalDashboard from "./dashboard/PedagogicalDashboard";
import EducationalAnalyticsView from "./EducationalAnalyticsView";
import { motion, AnimatePresence } from "motion/react";

export function PedagogicalExecutiveDashboardView() {
  const [activeTab, setActiveTab] = useState<"pedagogical" | "analytics">("pedagogical");

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Briefcase className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">Painel Executivo de Coordenação</h2>
            <p className="text-sm text-slate-400 mt-1">Visão consolidada de indicadores pedagógicos e análise educacional profunda.</p>
          </div>
        </div>
        
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab("pedagogical")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "pedagogical"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Pedagógico
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "analytics"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Analytics Educacional
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[600px] w-full">
        <AnimatePresence mode="wait">
          {activeTab === "pedagogical" && (
            <motion.div
              key="pedagogical"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <PedagogicalDashboard />
            </motion.div>
          )}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Wrapping EducationalAnalyticsView to integrate smoothly */}
              <EducationalAnalyticsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default PedagogicalExecutiveDashboardView;
