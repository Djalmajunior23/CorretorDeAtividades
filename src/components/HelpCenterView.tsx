import React, { useState } from "react";
import {
  HelpCircle,
  Book,
  MessageCircle,
  FileText,
  ChevronRight,
  Activity,
  Terminal,
  Shield,
  ArrowUpRight,
  Zap,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FAQ_ITEMS = [
  {
    q: "O aluno acessa o sistema?",
    a: "Não. O CodeCheck é uma plataforma professor-only. O aluno interage com os resultados (como PDFs, DOCXs e relatórios) que você exporta e distribui.",
  },
  {
    q: "Preciso de chave paga de IA?",
    a: "O CodeCheck pode funcionar com chaves de IA (OpenAI, Gemini) ou ser configurado para usar IA local gratuita via Ollama (recomendado para privacidade de dados).",
  },
  {
    q: "Posso corrigir um arquivo .ZIP inteiro de uma vez?",
    a: "Sim. O módulo 'Correção em Lote' foi desenhado exatamente para isso. Basta fazer o upload do .ZIP que o CodeCheck descompacta, varre, analisa a sintaxe e a lógica de cada arquivo.",
  },
  {
    q: "Como proteger os dados dos meus alunos?",
    a: "Recomendamos que você nunca envie dados pessoais sensíveis (como CPF, telefone) nos códigos submetidos. Se usar modelos em nuvem, a plataforma já tenta anonimizar. Para máxima privacidade, use modelos via Ollama.",
  },
];

const GLOSSARY_ITEMS = [
  {
    term: "Rubrica",
    desc: "Conjunto de critérios avaliativos (ex: Sintaxe, Lógica, Boas Práticas) que o sistema usará para julgar o código.",
  },
  {
    term: "Sandbox",
    desc: "Ambiente isolado e seguro para execução de códigos não-confiáveis, evitando que afetem a máquina host.",
  },
  {
    term: "Similaridade",
    desc: "Recurso usado para detectar plágio ou alta coincidência entre múltiplos códigos da mesma turma.",
  },
  {
    term: "IA Local (Ollama)",
    desc: "Permite rodar modelos grandes de linguagem na máquina do professor ou na LAN da escola sem depender da internet externa.",
  },
];

export default function HelpCenterView() {
  const [activeTab, setActiveTab] = useState<"manual" | "faq" | "glossary">(
    "manual",
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    if (expandedFaq === idx) setExpandedFaq(null);
    else setExpandedFaq(idx);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-200">
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-sky-500" />
          Central de Ajuda & Onboarding
        </h1>
        <p className="text-slate-400 mt-2">
          Manuais, documentação, tutoriais e glossário pedagógico.
        </p>
      </div>

      <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "manual" ? "bg-sky-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          Primeiros Passos & Manual
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "faq" ? "bg-sky-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          Perguntas Frequentes
        </button>
        <button
          onClick={() => setActiveTab("glossary")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "glossary" ? "bg-sky-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          Glossário Técnico
        </button>
      </div>

      <div>
        {activeTab === "manual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 hover:bg-slate-900/60 transition-all border-l-4 border-l-sky-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Target className="w-5 h-5 text-sky-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Como Funciona o CodeCheck?
                </h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                O CodeCheck centraliza todo o fluxo avaliativo de programação e
                computação. Os fluxos principais são:
              </p>
              <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside mb-4">
                <li>
                  <strong>Turmas:</strong> Crie turmas e cadastre/importe seus
                  alunos.
                </li>
                <li>
                  <strong>Atividades:</strong> Configure as regras e a
                  parametrização das tarefas.
                </li>
                <li>
                  <strong>Correção de Código:</strong> Cole, digite ou envie
                  arquivos.
                </li>
                <li>
                  <strong>Lote e Similaridade:</strong> Envie ZIPs para corrigir
                  a turma toda.
                </li>
                <li>
                  <strong>Relatórios:</strong> Exporte pareceres automáticos de
                  evolução.
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 hover:bg-slate-900/60 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Guia Rápido: Primeiro Uso
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p className="text-sm text-slate-400">
                    Acesse <strong>Turmas e Alunos</strong> e crie uma turma de
                    teste. Adicione alguns estudantes.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p className="text-sm text-slate-400">
                    Vá para a <strong>Laboratório de Correções</strong>,
                    introduza fragmentos de código, configure um prompt
                    pedagógico e veja o resultado.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <p className="text-sm text-slate-400">
                    Para revisar código via imagens de tela fornecidas pelos
                    alunos em relatórios, use a correção visual baseada em Visão
                    Computacional (OCR + IA).
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </div>
                  <p className="text-sm text-slate-400">
                    Explore o criador de <strong>Materiais Didáticos</strong>{" "}
                    para converter a dificuldade central da sua turma em trilhas
                    de recuperação sob medida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="space-y-4 max-w-3xl">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-6 font-bold text-white flex justify-between items-center hover:bg-white/5 transition-all"
                >
                  {item.q}
                  <ChevronRight
                    className={`w-5 h-5 transition-transform ${expandedFaq === idx ? "rotate-90 text-sky-400" : "text-slate-500"}`}
                  />
                </button>
                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-sm text-slate-400 leading-relaxed border-t border-white/5">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {activeTab === "glossary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GLOSSARY_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 hover:bg-slate-900/60 transition-all"
              >
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  {item.term}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
