import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Play, Code } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { ocrApi } from '../../services/ocrApi';

export default function TeacherImageCorrectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrId, setOcrId] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'EXTRACTED' | 'CORRECTING' | 'DONE' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setStatus('IDLE');
      setExtractedText('');
      setResult(null);
      setErrorMsg('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('IDLE');
    setExtractedText('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExtract = async () => {
    if (!file) return;
    setStatus('UPLOADING');
    setErrorMsg('');
    try {
      const data = await ocrApi.extractImage(file);
      setOcrId(data.ocr_id);
      setExtractedText(data.extracted_text || data.text || '');
      setStatus('EXTRACTED');
      
      if (data.ai_analysis_available === false) {
         setErrorMsg('Texto extraído com sucesso. A análise com IA está temporariamente indisponível.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('ERROR');
      setErrorMsg(err.response?.data?.detail || 'Falha ao conectar no serviço de OCR.');
    }
  };

  const handleCorrect = async () => {
    if (!ocrId) return;
    setStatus('CORRECTING');
    setErrorMsg('');
    try {
      // Default to Python and using one basic sum test case to validate the pipeline
      const payload = {
        ocr_id: ocrId,
        edited_text: extractedText,
        language: 'python',
        test_cases: [
          { input: '2 3', expected_output: '5' }
        ]
      };
      const data = await ocrApi.confirmOCR(payload);
      setResult(data);
      setStatus('DONE');
    } catch (err: any) {
      console.error(err);
      setStatus('ERROR');
      setErrorMsg(err.response?.data?.detail || 'Falha ao executar correção.');
    }
  };

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
            Correção por Imagem (OCR)
          </h1>
          <p className="text-slate-400 mt-2">Faça upload de uma foto do código na lousa ou caderno.</p>
        </header>

        {errorMsg && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            errorMsg.includes('sucesso') 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{errorMsg.includes('sucesso') ? 'Aviso' : 'Erro'}</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload and Preview Column */}
          <div className="space-y-6">
            <div className="bg-[#1A1D27] rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                Imagem do Código
              </h2>

              {!previewUrl ? (
                <div 
                  className="border-2 border-dashed border-slate-700/50 rounded-xl p-12 text-center hover:border-emerald-500/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Clique para selecionar ou arraste uma imagem</p>
                  <p className="text-slate-500 text-sm">JPG, PNG ou WEBP (Max 10MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black/40 border border-slate-700/50 aspect-video flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={clearFile}
                      className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                      disabled={status === 'UPLOADING' || status === 'CORRECTING'}
                    >
                      Remover Imagem
                    </button>
                    {status === 'IDLE' && (
                      <button 
                        onClick={handleExtract}
                        className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Extrair Código
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
              />
            </div>
            
            {status === 'UPLOADING' && (
              <div className="flex items-center justify-center p-8 text-emerald-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
                Extraindo texto da imagem...
              </div>
            )}
          </div>

          {/* Code Editor and Results Column */}
          <div className="space-y-6">
            {(status === 'EXTRACTED' || status === 'CORRECTING' || status === 'DONE') && (
              <div className="bg-[#1A1D27] rounded-xl border border-slate-800 flex flex-col h-full min-h-[400px]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1E212B] rounded-t-xl">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                    <Code className="w-4 h-4 text-emerald-400" />
                    Revisar Código Extraído
                  </h2>
                </div>
                <div className="p-4 flex-1">
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-full min-h-[300px] p-4 bg-[#0F111A] border border-slate-800 rounded-lg text-emerald-400 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    spellCheck={false}
                    disabled={status === 'CORRECTING'}
                  />
                </div>
                <div className="p-4 border-t border-slate-800">
                  <button 
                    onClick={handleCorrect}
                    disabled={status === 'CORRECTING' || !extractedText.trim()}
                    className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {status === 'CORRECTING' ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Executando Correção...</>
                    ) : (
                      <><Play className="w-4 h-4" /> Corrigir Código</>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {status === 'DONE' && result && (
              <div className="bg-[#1A1D27] rounded-xl border border-slate-800 overflow-hidden">
                 <div className="p-4 border-b border-slate-800 bg-[#1E212B]">
                   <h2 className="font-semibold flex items-center gap-2">
                     <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                     Resultado da Correção
                   </h2>
                 </div>
                 
                 <div className="p-6">
                   <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-800">
                     <div className="text-center">
                       <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Nota Final</p>
                       <p className={`text-4xl font-bold ${result.final_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                         {result.final_score}
                       </p>
                     </div>
                     <div className="flex-1">
                       <p className="text-slate-300 text-sm leading-relaxed">
                         {result.feedback}
                       </p>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div>
                       <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Standard Output</p>
                       <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-emerald-400 whitespace-pre-wrap min-h-[60px] border border-slate-800">
                         {result.stdout || 'Nenhuma saída'}
                       </div>
                     </div>

                     {result.stderr && (
                       <div>
                         <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Standard Error</p>
                         <div className="bg-red-950/20 p-4 rounded-lg font-mono text-sm text-red-400 whitespace-pre-wrap border border-red-900/30">
                           {result.stderr}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
