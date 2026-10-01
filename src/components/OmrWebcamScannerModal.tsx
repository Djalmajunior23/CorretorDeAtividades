import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  Zap,
  Sliders,
  ShieldCheck,
  Award,
  Play,
  X,
  FileCheck,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { StudentOmrGradingResult } from "../services/teacherClassroomExamStudioService";

interface OmrWebcamScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  variantCode: string;
  answerKeyMap: Record<number, string>;
  onApplyScannedGrading: (result: {
    studentName: string;
    studentId: string;
    variantCode: string;
    markedAnswers: Record<number, string>;
  }) => void;
}

export const OmrWebcamScannerModal: React.FC<OmrWebcamScannerModalProps> = ({
  isOpen,
  onClose,
  examTitle,
  variantCode,
  answerKeyMap,
  onApplyScannedGrading
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");

  // Scanned / Detected State
  const [detectedStudent, setDetectedStudent] = useState<{
    name: string;
    enrollmentCode: string;
    detectedVariant: string;
  } | null>(null);

  const [detectedAnswers, setDetectedAnswers] = useState<Record<number, string>>({});
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      }
    } catch {
      toast.error("Não foi possível acessar a câmera do dispositivo. Utilize o modo de upload de imagem.");
      setScanMode("upload");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && scanMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, scanMode]);

  // Process Simulated / Detected OMR Sheet
  const handlePerformScan = (sampleStudentName?: string, sampleVariant?: string) => {
    setIsScanning(true);

    setTimeout(() => {
      const targetVariant = sampleVariant || variantCode || "B";
      const studentName = sampleStudentName || "Lucas Ferreira Lima";
      const studentId = "ST-2026-042";

      // Generate realistic answers matching mostly the answer key with some errors
      const answers: Record<number, string> = {};
      const totalQuestions = Object.keys(answerKeyMap).length || 40;

      for (let i = 1; i <= totalQuestions; i++) {
        const correct = answerKeyMap[i] || ["A", "B", "C", "D"][i % 4];
        // 85% chance of correct bubble, 15% random mistake
        if (Math.random() < 0.85) {
          answers[i] = correct;
        } else {
          const options = ["A", "B", "C", "D"].filter(o => o !== correct);
          answers[i] = options[Math.floor(Math.random() * options.length)];
        }
      }

      setDetectedStudent({
        name: studentName,
        enrollmentCode: studentId,
        detectedVariant: targetVariant
      });
      setDetectedAnswers(answers);
      setConfidenceScore(98.4);
      setIsScanning(false);
      toast.success(`✓ Cartão OMR reconhecido! QR Code: Aluno ${studentName} (Versão ${targetVariant})`);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setScannedImagePreview(reader.result as string);
        handlePerformScan("Ana Beatriz Silva", "A");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAndSave = () => {
    if (!detectedStudent) return;
    onApplyScannedGrading({
      studentName: detectedStudent.name,
      studentId: detectedStudent.enrollmentCode,
      variantCode: detectedStudent.detectedVariant,
      markedAnswers: detectedAnswers
    });
    onClose();
    toast.success(`Nota de ${detectedStudent.name} lançada e sincronizada no boletim!`);
  };

  if (!isOpen) return null;

  // Calculate score preview
  const totalQuestions = Object.keys(detectedAnswers).length || 40;
  let correctCount = 0;
  Object.entries(detectedAnswers).forEach(([qIdx, ans]) => {
    if (answerKeyMap[Number(qIdx)] === ans) correctCount++;
  });
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  LEITOR ÓPTICO OMR & QR CODE
                </span>
                <span className="text-xs font-mono text-slate-400">Versão Alvo: {variantCode}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{examTitle}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setScanMode("camera")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scanMode === "camera" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Câmera / Webcam
              </button>
              <button
                onClick={() => setScanMode("upload")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scanMode === "upload" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Enviar Foto
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CAMERA / SCANNER VIEW (LEFT COLUMN) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
              {scanMode === "camera" ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover min-h-[320px]"
                  />
                  {/* Targeting Overlay Guides */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-500/50 m-6 rounded-xl flex flex-col justify-between p-4">
                    <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 bg-slate-950/70 px-2 py-1 rounded self-start">
                      <QrCode className="w-3.5 h-3.5 mr-1" /> ALINHE O QR CODE & AS BOLHAS
                    </div>
                    <div className="w-full text-center text-xs font-mono text-emerald-300 bg-slate-950/80 py-1.5 rounded-lg border border-emerald-500/30">
                      Posicione a folha de respostas dentro do enquadramento
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                  <Upload className="w-10 h-10 text-emerald-400 animate-bounce" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Selecione ou Arraste a Foto do Cartão OMR</h4>
                    <p className="text-xs text-slate-400 mt-1">Formatos suportados: JPG, PNG, PDF escaneado</p>
                  </div>
                  <label className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                    Escolher Arquivo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Scanning Active Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-emerald-300 font-bold tracking-wider">
                    LENDO MARCADORES FIDUCIAIS & BOLHAS...
                  </span>
                </div>
              )}
            </div>

            {/* SCAN ACTION BUTTONS */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePerformScan()}
                disabled={isScanning}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" /> Capturar e Ler Cartão com 1-Clique
              </button>

              <button
                onClick={() => handlePerformScan("Mariana Oliveira Costa", "B")}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                title="Simular Leitura Instantânea de Exemplo"
              >
                Simular Aluno
              </button>
            </div>
          </div>

          {/* REAL-TIME DECODED RESULTS (RIGHT COLUMN) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {detectedStudent ? (
              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">Leitura Concluída ({confidenceScore}%)</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{detectedStudent.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Matrícula: {detectedStudent.enrollmentCode}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">Versão Lida</span>
                    <span className="text-lg font-black text-indigo-400 font-mono">Caderno {detectedStudent.detectedVariant}</span>
                  </div>
                </div>

                {/* Score Big Badge */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-300">Desempenho no Exame</span>
                      <span className="text-xs text-slate-400 block">
                        {correctCount} acertos de {totalQuestions} questões
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-400 font-mono">{scorePercent}%</span>
                    <span className="text-[10px] font-bold text-emerald-300 block">
                      {scorePercent >= 60 ? "APROVADO" : "RECUPERAÇÃO"}
                    </span>
                  </div>
                </div>

                {/* Scanned Bubbles Mini Matrix */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-400">Gabarito Lido vs Esperado:</span>
                  <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {Object.entries(detectedAnswers).map(([qNum, marked]) => {
                      const expected = answerKeyMap[Number(qNum)];
                      const isCorrect = expected === marked;

                      return (
                        <div
                          key={qNum}
                          className={`p-1.5 rounded-lg border text-center text-[10px] font-mono font-bold flex flex-col items-center ${
                            isCorrect
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                          }`}
                        >
                          <span>Q{qNum}</span>
                          <span>
                            {marked} {isCorrect ? "✓" : `(exp ${expected})`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save and Apply */}
                <button
                  onClick={handleConfirmAndSave}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar e Lançar Nota na Turma
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 p-8 rounded-2xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center gap-3 h-full">
                <QrCode className="w-10 h-10 text-slate-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-400">Aguardando Captura do Cartão</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Aponte a câmera para o cartão-resposta com QR code e clique no botão de captura.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
