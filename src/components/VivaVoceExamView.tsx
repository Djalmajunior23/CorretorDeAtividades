import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  FileDown,
  Sparkles,
  Award,
  CheckCircle2,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  VivaVoceSession,
  OralQuestion,
  VivaVoceExamService
} from "../services/vivaVoceExamService";

const SAMPLE_PROJECT_CODE = `// Arquitetura de Pagamentos Distribuídos com Idempotência
export async function processOrderPayment(req: Request, res: Response) {
  const idempotencyKey = req.headers['x-idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency key obrigatoria' });
  }

  // 1. Checa cache distribuído Redis
  const cached = await redis.get(\`idem:\${idempotencyKey}\`);
  if (cached) return res.json(JSON.parse(cached));

  // 2. Transação atômica no PostgreSQL com Lock Otimista
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.body.orderId]);
    // Processamento do gateway externo com timeout de 3s
    const gatewayRes = await axios.post('https://gateway.com/charge', { amount: order.rows[0].total }, { timeout: 3000 });
    
    await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['PAID', req.body.orderId]);
    await client.query('COMMIT');

    await redis.setex(\`idem:\${idempotencyKey}\`, 3600, JSON.stringify(gatewayRes.data));
    return res.json(gatewayRes.data);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}`;

export const VivaVoceExamView: React.FC = () => {
  const [studentName, setStudentName] = useState("Lucas Gabriel");
  const [projectTitle, setProjectTitle] = useState("Gateway de Pagamentos & Transações Idempotentes");
  const [codeContext, setCodeContext] = useState(SAMPLE_PROJECT_CODE);

  const [session, setSession] = useState<VivaVoceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleStartExam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/viva-voce/start-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, projectTitle, codeContext })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          toast.success("Banca Examinadora de Arguição Oral iniciada!");
          speakQuestion(data.session.questions[0]?.questionText);
          return;
        }
      }

      const fallback = await VivaVoceExamService.startSession({ studentName, projectTitle, codeContext });
      setSession(fallback);
      toast.success("Banca iniciada via contingência local!");
      speakQuestion(fallback.questions[0]?.questionText);
    } catch (err: any) {
      const fallback = await VivaVoceExamService.startSession({ studentName, projectTitle, codeContext });
      setSession(fallback);
      toast.success("Banca iniciada com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const speakQuestion = (text?: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceRecording = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.info("Reconhecimento de voz do navegador indisponível. Você pode digitar sua resposta oral.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscriptInput((prev) => (prev ? prev + " " + text : text));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
      recognition.stop();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !transcriptInput.trim()) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return;

    setIsLoading(true);
    const answer = transcriptInput;
    setTranscriptInput("");

    try {
      const res = await fetch("/api/viva-voce/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          questionId: currentQuestion.id,
          answerTranscript: answer,
          speechDurationSec: 22
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          toast.success("Resposta oral avaliada pela banca!");
          const nextQ = data.session.questions[data.session.currentQuestionIndex];
          if (nextQ && !nextQ.studentAnswerTranscript) {
            speakQuestion(nextQ.questionText);
          }
          return;
        }
      }

      const updated = await VivaVoceExamService.evaluateOralAnswer({
        session,
        questionId: currentQuestion.id,
        answerTranscript: answer
      });
      setSession(updated);
      toast.success("Resposta avaliada com sucesso!");
    } catch (err: any) {
      const updated = await VivaVoceExamService.evaluateOralAnswer({
        session,
        questionId: currentQuestion.id,
        answerTranscript: answer
      });
      setSession(updated);
      toast.success("Resposta registrada!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!session) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/viva-voce/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await VivaVoceExamService.generateVivaVocePdf(session);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_viva_voce_${session.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Laudo de Arguição Oral baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-fuchsia-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-fuchsia-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 flex items-center gap-1">
              <Mic className="w-3 h-3 text-fuchsia-400" /> AI Viva-Voce Oral Defense
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Live Speech & Architectural Conviction
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Viva-Voce & Arguição Oral Técnica por Voz
          </h1>
          <p className="text-slate-400 text-sm">
            Defesa oral de código em tempo real, avaliação de oratória técnica, clareza arquitetural e convicção contra questionamentos da banca.
          </p>
        </div>

        {session && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Dossiê..." : "Exportar Laudo Oral (PDF)"}
          </button>
        )}
      </div>

      {!session ? (
        /* Setup Room */
        <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" /> Configuração da Sala de Arguição Oral
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Candidato / Estudante</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Título do Projeto / Módulo</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Código / Arquitetura sob Defesa</label>
            <textarea
              value={codeContext}
              onChange={(e) => setCodeContext(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-fuchsia-300 focus:outline-none leading-relaxed"
            />
          </div>

          <button
            onClick={handleStartExam}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-fuchsia-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Entrar na Sala de Arguição Oral com a Banca IA
          </button>
        </div>
      ) : (
        /* Active Defense Room Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Questions & Speech Box */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Scorebar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Nota da Arguição Oral</span>
                <div className="text-2xl font-extrabold text-fuchsia-400">
                  {session.overallOralScore > 0 ? `${session.overallOralScore}/100` : "Em Andamento"}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Veredito Parcial</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 block">
                  {session.verbalEloquenceRating}
                </span>
              </div>
            </div>

            {/* Questions Tabs */}
            <div className="space-y-4">
              {session.questions.map((q, idx) => {
                const isActive = session.currentQuestionIndex === idx;
                const isAnswered = !!q.studentAnswerTranscript;

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900/90 border rounded-2xl p-5 space-y-3 transition shadow-xl ${
                      isActive
                        ? "border-fuchsia-500/60 ring-1 ring-fuchsia-500/30"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-fuchsia-400">Pergunta {idx + 1} de {session.questions.length} • {q.category.replace(/_/g, " ")}</span>
                      <button
                        type="button"
                        onClick={() => speakQuestion(q.questionText)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Ouvir pergunta em voz alta"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                      "{q.questionText}"
                    </p>

                    {isAnswered && (
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="text-slate-400 font-semibold">Sua Defesa Oral:</div>
                        <p className="text-fuchsia-300 italic">"{q.studentAnswerTranscript}"</p>
                        {q.evaluation && (
                          <div className="pt-2 border-t border-slate-800/80 text-emerald-400 space-y-1">
                            <div className="font-bold">Avaliação da Banca:</div>
                            <p className="text-slate-300">{q.evaluation.examinerFeedback}</p>
                            <div className="flex gap-4 text-[10px] text-slate-400 pt-1">
                              <span>Precisão Técnica: {q.evaluation.technicalAccuracyScore}%</span>
                              <span>Eloquência Verbal: {q.evaluation.clarityAndEloquenceScore}%</span>
                              <span>Fluidez: {q.evaluation.hesitationLevel}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Answer & Mic Input */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Responda à Pergunta Atual ({session.currentQuestionIndex + 1}/{session.questions.length}):
                </span>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-600/30"
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? "Gravando Voz..." : "Falar pelo Microfone"}
                </button>
              </div>

              <textarea
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                rows={3}
                placeholder="Fale no microfone ou digite sua sustentação oral para a banca..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500/50"
              />

              <button
                onClick={handleSubmitAnswer}
                disabled={isLoading || !transcriptInput.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Resposta Oral para a Banca
              </button>
            </div>
          </div>

          {/* Right: Code Context Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-fuchsia-400" /> Código em Arguição
              </h3>
              <pre className="bg-slate-950 p-3.5 rounded-xl font-mono text-xs text-fuchsia-300 overflow-x-auto whitespace-pre-wrap border border-slate-800 max-h-[460px]">
                {session.codeContext}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VivaVoceExamView;
