import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 border-b border-slate-800 pb-6 text-start">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-emerald-400" />
            Configurações
          </h1>
          <p className="text-slate-400 mt-2">Ajuste os parâmetros do sistema e preferências de sua conta.</p>
        </header>

        <div className="max-w-2xl mx-auto space-y-6">
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
            <h3 className="font-semibold text-lg text-white mb-4">Motor de Correção (IA)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Rigor da Correção</label>
                <select className="w-full bg-[#1E212B] border border-slate-700 rounded-lg p-2 text-white" defaultValue="normal">
                  <option value="flexivel">Flexível (Aceita mais variações)</option>
                  <option value="normal">Normal (Equilibrado)</option>
                  <option value="rigoroso">Rigoroso (Pede boas práticas estritas)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="plagio" className="w-4 h-4 rounded border-slate-700 bg-[#1E212B]" defaultChecked />
                <label htmlFor="plagio" className="text-sm text-slate-300">Sempre verificar similaridade ao corrigir</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-lg font-semibold text-white transition-colors">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
