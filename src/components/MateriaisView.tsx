import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, Download, Folder, BookOpen, Layers, Sparkles, 
  Search, ExternalLink, HelpCircle
} from "lucide-react";

export default function MateriaisView() {
  const [filterType, setFilterType] = useState<string>("all");

  const libraryItems = [
    { title: "Plano de Curso: Programação de Computadores SENAI", type: "document", desc: "Matriz curricular e ementa oficial regulamentada do Ministério da Educação.", size: "1.4 MB" },
    { title: "Apostila de Algoritmos e Lógica", type: "handout", desc: "Material didático com 150 páginas cobrindo arrays, sub-rotinas e complexidades de código.", size: "4.8 MB" },
    { title: "Slides de Aula: Introdução a Árvores e Listas Dinâmicas", type: "slides", desc: "Apresentações em PPTX editáveis para aplicação didática em sala.", size: "2.1 MB" },
    { title: "Gabarito Oficial: Desafio Técnico de Programador Web", type: "document", desc: "Gabaritos e notas de correção sugeridos para exames institucionais.", size: "640 KB" },
    { title: "Kit de Ferramentas de Exercícios de Sandbox", type: "code", desc: "Starter kit contendo testes unitários automatizados em Java, Python e JavaScript.", size: "150 KB" }
  ];

  const filtered = filterType === "all" ? libraryItems : libraryItems.filter(item => item.type === filterType);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100 animate-fade-in">
      
      {/* Title block */}
      <div>
        <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">Fase 12 / 13: Materiais e Apoio Didático</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mt-0.5">Materiais Didáticos de Curso</h1>
        <p className="text-sm text-slate-400 mt-1">
          Acesse apostilas regulamentadas, slides de apoio didático, gabaritos modelo de avaliação e kits de código complementares.
        </p>
      </div>

      {/* Categories filters */}
      <div className="flex border-b border-slate-800 gap-6">
        <button 
          onClick={() => setFilterType("all")} 
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${filterType === "all" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Todos os Materiais
          {filterType === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
        </button>

        <button 
          onClick={() => setFilterType("document")} 
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${filterType === "document" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Plano & Ementas
          {filterType === "document" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
        </button>

        <button 
          onClick={() => setFilterType("handout")} 
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${filterType === "handout" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Apostilas
          {filterType === "handout" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
        </button>

        <button 
          onClick={() => setFilterType("slides")} 
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${filterType === "slides" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Slides PPTX
          {filterType === "slides" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-slate-900 text-slate-400 rounded-xl">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500">{item.type}</span>
                <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-900 pt-3 text-[11px] text-slate-500 font-mono">
              <span>Tamanho: {item.size}</span>
              <button 
                type="button"
                onClick={() => alert(`Iniciando download do material: ${item.title}`)}
                className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
