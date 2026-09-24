import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Settings as SettingsIcon, Save, Key, ExternalLink, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [rigor, setRigor] = useState<string>('normal');
  const [checkPlagiarism, setCheckPlagiarism] = useState<boolean>(true);

  useEffect(() => {
    const savedKey = localStorage.getItem('codecheck_ai_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('codecheck_ai_api_key', apiKey.trim());
    toast.success('Configurações e Chave de IA salvas com sucesso!');
  };

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('codecheck_ai_api_key');
    toast.info('Chave removida. O sistema usará o motor heurístico gratuito local.');
  };

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 border-b border-slate-800 pb-6 text-start">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-emerald-400" />
            Configurações
          </h1>
          <p className="text-slate-400 mt-2">Ajuste os parâmetros do sistema, chaves de inteligência artificial e preferências.</p>
        </header>

        <div className="max-w-2xl mx-auto space-y-6 text-start">
          
          {/* Card Chave de API de IA */}
          <div className="bg-[#1A1D27] p-6 rounded-xl border border-amber-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                Chave de API de Inteligência Artificial
              </h3>
              <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                100% Gratuito
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Adicione sua chave de API para habilitar visão computacional ultrarrápida (&lt; 1s) para fotos de diagramas, correção de código e laudos técnicos.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Chave de API (Google Gemini / Groq / OpenAI)</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua chave gratuita (AIza... do Google Gemini ou gsk_... da Groq)"
                    className="flex-1 bg-[#1E212B] border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                      title="Remover chave"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Onde obter chaves 100% gratuitas:
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-mono text-[11px]"
                  >
                    Google AI Studio (Gemini 2.5 Flash) <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-mono text-[11px]"
                  >
                    Groq Cloud (LPU Ultra-Rápido) <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-lg text-white mb-4">Perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome de Exibição</label>
                <input type="text" className="w-full bg-[#1E212B] border border-slate-700 rounded-lg p-2 text-white" defaultValue="Professor Admin" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">E-mail</label>
                <input type="email" className="w-full bg-[#1E212B] border border-slate-700 rounded-lg p-2 text-white" defaultValue="professor@codecheck.ai" />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1D27] p-6 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-lg text-white mb-4">Motor de Correção & Regras</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Rigor da Correção Pedagógica</label>
                <select 
                  className="w-full bg-[#1E212B] border border-slate-700 rounded-lg p-2 text-white" 
                  value={rigor}
                  onChange={(e) => setRigor(e.target.value)}
                >
                  <option value="flexivel">Flexível (Aceita mais variações e foco no esforço)</option>
                  <option value="normal">Normal (Equilibrado e padrão SENAI)</option>
                  <option value="rigoroso">Rigoroso (Pede boas práticas e normalização estrita)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="plagio" 
                  className="w-4 h-4 rounded border-slate-700 bg-[#1E212B]" 
                  checked={checkPlagiarism}
                  onChange={(e) => setCheckPlagiarism(e.target.checked)}
                />
                <label htmlFor="plagio" className="text-sm text-slate-300">Sempre verificar similaridade de código ao corrigir</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 rounded-lg font-semibold text-white transition-colors cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

