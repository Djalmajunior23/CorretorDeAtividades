import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, XCircle, Clock, Search, ExternalLink, Download, FileArchive } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';

function Placeholder({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-500 font-medium">
      {text}
    </div>
  );
}

// Interfaces
interface BatchJob {
  id: number;
  title: string;
  status: string;
  total_files: number;
  processed_files: number;
  successful_corrections: number;
  failed_corrections: number;
  created_at: string;
}

interface BatchItem {
  id: number;
  student_name: string;
  student_email: string;
  file_name: string;
  status: string;
  score: number;
  feedback: string;
}

export default function TeacherBatchCorrectionPage() {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [activeJob, setActiveJob] = useState<number | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
      const res = await fetch(`${baseUrl}/batch-correction/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
    }
  };

  // Fetch Job details
  const fetchJobDetails = async (jobId: number) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
      const res = await fetch(`${baseUrl}/batch-correction/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch job items:", e);
    }
  };

  useEffect(() => {
    fetchJobs();
    const cycle = setInterval(() => {
      fetchJobs();
      if (activeJob) fetchJobDetails(activeJob);
    }, 5000);
    return () => clearInterval(cycle);
  }, [activeJob]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    
    const formData = new FormData();
    for(let i = 0; i < e.target.files.length; i++) {
        formData.append('files', e.target.files[i]);
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
      const res = await fetch(`${baseUrl}/batch-correction/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJob(data.job_id);
        await fetchJobs();
      }
    } catch (error) {
      console.error("Upload error", error);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleExport = async (jobId: number) => {
    try {
       const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
       const res = await fetch(`${baseUrl}/batch-correction/export/${jobId}`, {
           method: 'POST'
       });
       if(res.ok) {
           alert("Relatório gerado! Em uma versão real, o download iniciaria aqui.");
       }
    } catch (e) {
        console.error("Error exporting", e);
    }
  }

  const actJobDetails = jobs.find(j => j.id === activeJob);

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-200 flex flex-col font-sans">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E0E14]/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            CodeCheck AI 
            <span className="text-slate-500 font-normal ml-2">Batch Engine</span>
          </h1>
          <nav className="flex space-x-4">
            <Link to="/teacher/correction-lab" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Lab</Link>
            <Link to="/teacher/batch-correction" className="text-sm text-emerald-400 font-medium transition-colors">Lotes</Link>
            <Link to="/teacher/classroom" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Classroom</Link>
            <Link to="/teacher/plagiarism" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Integridade</Link>
            <Link to="/teacher/adaptive-learning" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Analytics</Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
              <Download className="w-4 h-4" />
              <span>Modelos de ZIP</span>
            </button>
        </div>
      </header>

      <div className="flex flex-1 p-6 space-x-6 overflow-hidden max-w-[1600px] w-full mx-auto">
        
        {/* Left Panel: Jobs list & Upload */}
        <div className="w-96 shrink-0 flex flex-col space-y-6">
            
            <div className="bg-[#181824] border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center border-dashed group hover:border-emerald-500/50 transition-colors relative cursor-pointer overflow-hidden">
                <input 
                   type="file" 
                   multiple 
                   accept=".zip,.py,.java,.js,.cpp,.c,.pdf,.jpg,.png" 
                   onChange={handleUpload}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   disabled={isUploading}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-sm font-medium text-emerald-400">Processando Upload...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform">
                         <Upload className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                          <h3 className="font-semibold text-slate-200">Novo Lote (Upload)</h3>
                          <p className="text-xs text-slate-400 mt-1">Solte um ZIP, pastas ou arquivos soltos aqui.</p>
                      </div>
                  </div>
                )}
            </div>

            <div className="flex-1 bg-[#181824] border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200 flex items-center space-x-2">
                        <FileArchive className="w-4 h-4 text-emerald-400" />
                        <span>Histórico de Lotes</span>
                    </h3>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                    {jobs.length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-500">Nenhum lote enviado.</div>
                    )}
                    {jobs.map(job => (
                        <div 
                          key={job.id} 
                          onClick={() => {
                              setActiveJob(job.id);
                              fetchJobDetails(job.id);
                          }}
                          className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all",
                              activeJob === job.id ? "bg-emerald-900/20 border-emerald-500/30" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                          )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-slate-200 text-sm truncate pr-2">{job.title}</h4>
                                {job.status === "PROCESSING" ? (
                                    <span className="flex items-center space-x-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        <span>Proces.</span>
                                    </span>
                                ) : job.status === "COMPLETED" ? (
                                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Completo</span>
                                ) : (
                                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{job.status}</span>
                                )}
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-1.5 rounded-full transition-all" 
                                  style={{ width: `${job.total_files > 0 ? (job.processed_files / job.total_files) * 100 : 0}%`}}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{job.processed_files}/{job.total_files} arquiv.</span>
                                <span>{job.successful_corrections} corrigidos</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Panel: Job Dashboard */}
        <div className="flex-1 bg-[#181824] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {!actJobDetails ? (
                <Placeholder text="Selecione um lote no histórico ou faça upload para visualizar." />
            ) : (
                <>
                  <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                      <div className="flex justify-between items-start">
                          <div>
                              <h2 className="text-2xl font-bold text-slate-100">{actJobDetails.title}</h2>
                              <p className="text-sm text-slate-400 mt-1">Iniciado em {new Date(actJobDetails.created_at).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex space-x-3">
                              <button 
                                onClick={() => handleExport(actJobDetails.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                              >
                                  <Download className="w-4 h-4" />
                                  <span>Exportar Relatório</span>
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-6">
                          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Recebido</div>
                              <div className="text-2xl font-semibold text-slate-200">{actJobDetails.total_files}</div>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Processados</div>
                              <div className="text-2xl font-semibold text-slate-200">{actJobDetails.processed_files}</div>
                          </div>
                          <div className="p-4 bg-emerald-900/10 rounded-lg border border-emerald-500/20">
                              <div className="text-xs text-emerald-500/70 uppercase tracking-wider mb-1">Sucesso</div>
                              <div className="text-2xl font-semibold text-emerald-400">{actJobDetails.successful_corrections}</div>
                          </div>
                          <div className="p-4 bg-rose-900/10 rounded-lg border border-rose-500/20">
                              <div className="text-xs text-rose-500/70 uppercase tracking-wider mb-1">Falhas (Sem nome/Erro)</div>
                              <div className="text-2xl font-semibold text-rose-400">{actJobDetails.failed_corrections}</div>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6">
                      <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-200">Arquivos Processados</h3>
                          <div className="relative">
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input 
                                type="text"
                                placeholder="Buscar aluno..."
                                className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-sm text-slate-300 focus:outline-none focus:border-emerald-500 w-64"
                              />
                          </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                                  <tr>
                                      <th className="px-4 py-3 font-medium">Status</th>
                                      <th className="px-4 py-3 font-medium">Aluno Id</th>
                                      <th className="px-4 py-3 font-medium">Arquivo Original</th>
                                      <th className="px-4 py-3 font-medium">Nota F.</th>
                                      <th className="px-4 py-3 font-medium text-right">Ação</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                  {items.length === 0 && (
                                     <tr>
                                         <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Nenhum resultado processado ainda.</td>
                                     </tr>
                                  )}
                                  {items.map(item => (
                                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                          <td className="px-4 py-3">
                                              {item.status === 'COMPLETED' ? (
                                                  <span className="flex items-center space-x-1.5 text-emerald-400">
                                                      <CheckCircle2 className="w-4 h-4" />
                                                      <span className="text-xs">Validado</span>
                                                  </span>
                                              ) : item.status === 'FAILED' ? (
                                                  <span className="flex items-center space-x-1.5 text-rose-400">
                                                      <XCircle className="w-4 h-4" />
                                                      <span className="text-xs">Erro Sist.</span>
                                                  </span>
                                              ) : (
                                                  <span className="flex items-center space-x-1.5 text-amber-400">
                                                      <Clock className="w-4 h-4" />
                                                      <span className="text-xs">Aguardando</span>
                                                  </span>
                                              )}
                                          </td>
                                          <td className="px-4 py-3 text-slate-200">{item.student_name}</td>
                                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.file_name}</td>
                                          <td className="px-4 py-3">
                                              <span className={cn(
                                                  "px-2 py-0.5 rounded text-xs font-bold",
                                                  item.score >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                                                  item.score >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                                              )}>
                                                  {item.score}/100
                                              </span>
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                              <button className="text-emerald-400 hover:text-emerald-300 text-xs font-medium flex items-center justify-end w-full space-x-1">
                                                  <span>Ver Análise</span>
                                                  <ExternalLink className="w-3 h-3" />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                </>
            )}
        </div>

      </div>
    </div>
  );
}
