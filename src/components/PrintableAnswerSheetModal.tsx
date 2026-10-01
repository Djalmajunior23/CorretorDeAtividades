import React from "react";
import { Printer, Download, X, QrCode, ShieldCheck, Award } from "lucide-react";
import { toast } from "sonner";

interface PrintableAnswerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  variantCode: string;
  totalQuestions: number;
  studentsList?: Array<{ name: string; enrollmentCode: string }>;
  institutionHeader?: {
    institution: string;
    department: string;
    teacherName: string;
    academicPeriod: string;
  };
}

export const PrintableAnswerSheetModal: React.FC<PrintableAnswerSheetModalProps> = ({
  isOpen,
  onClose,
  examTitle,
  variantCode,
  totalQuestions = 40,
  studentsList = [],
  institutionHeader = {
    institution: "SENAI - Serviço Nacional de Aprendizagem Industrial",
    department: "Departamento de Tecnologia da Informação & Software",
    teacherName: "Prof. Dr. Docente Responsável",
    academicPeriod: "Semestre Letivo 2026.1"
  }
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success("Enviado para a impressora!");
  };

  const sampleStudent = studentsList[0] || {
    name: "__________________________________________________",
    enrollmentCode: "____________________"
  };

  const questionsCount = Math.min(totalQuestions, 40);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* TOP TOOLBAR */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded border border-blue-500/30 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> FOLHA DE RESPOSTA OMR OFICIAL
            </span>
            <span className="text-xs font-bold text-white">Caderno Versão {variantCode}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir Folha A4
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SHEET CONTAINER (Styled for A4 paper and high-contrast optical reading) */}
        <div className="p-8 bg-white text-slate-950 overflow-y-auto max-h-[75vh] print:max-h-none print:p-0">
          <div className="border-4 border-black p-6 rounded-none relative flex flex-col gap-5 max-w-2xl mx-auto font-sans">
            {/* CORNER FIDUCIAL CALIBRATION MARKS FOR OMR SCANNER */}
            <div className="absolute top-2 left-2 w-4 h-4 bg-black" />
            <div className="absolute top-2 right-2 w-4 h-4 bg-black" />
            <div className="absolute bottom-2 left-2 w-4 h-4 bg-black" />
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-black" />

            {/* INSTITUTIONAL HEADER */}
            <div className="border-b-2 border-black pb-3 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-sm font-black uppercase tracking-wider text-black">{institutionHeader.institution}</h1>
                <p className="text-[11px] font-semibold text-slate-700">{institutionHeader.department}</p>
                <p className="text-[11px] text-slate-700 font-bold mt-1">Exame: {examTitle}</p>
              </div>

              {/* QR CODE BOX */}
              <div className="border-2 border-black p-1.5 flex flex-col items-center justify-center text-center shrink-0">
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-300 font-mono text-[9px] text-center p-1">
                  [ QR CODE: {variantCode} ]
                </div>
                <span className="text-[8px] font-mono font-bold mt-0.5">VERSÃO {variantCode}</span>
              </div>
            </div>

            {/* STUDENT IDENTIFICATION BOX */}
            <div className="grid grid-cols-3 gap-3 text-xs border border-black p-3 bg-slate-50">
              <div className="col-span-2 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Nome do Estudante:</span>
                <span className="font-semibold text-xs text-black border-b border-dotted border-black pb-0.5">
                  {sampleStudent.name}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Matrícula / ID:</span>
                <span className="font-mono text-xs text-black border-b border-dotted border-black pb-0.5">
                  {sampleStudent.enrollmentCode}
                </span>
              </div>
            </div>

            {/* FILL INSTRUCTIONS */}
            <div className="text-[10px] text-slate-700 border border-slate-300 p-2 bg-slate-100 rounded flex items-center justify-between">
              <span>
                <strong>Instruções de Preenchimento:</strong> Preencha totalmente a bolha com caneta preta ou azul. Não rasure.
              </span>
              <div className="flex items-center gap-2 font-bold font-mono">
                <span className="flex items-center gap-1">
                  Correto: <span className="w-3.5 h-3.5 rounded-full bg-black inline-block" />
                </span>
                <span className="flex items-center gap-1">
                  Incorreto: <span className="w-3.5 h-3.5 rounded-full border border-black text-center text-[8px] leading-none">✕</span>
                </span>
              </div>
            </div>

            {/* BUBBLE ANSWER GRID (2 COLUMNS x 20 QUESTIONS) */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono font-bold border-t-2 border-b-2 border-black py-3">
              {Array.from({ length: questionsCount }, (_, i) => i + 1).map(qNum => (
                <div key={qNum} className="flex items-center justify-between py-1 px-2 border-b border-slate-200">
                  <span className="text-black font-black w-8">Q{qNum < 10 ? "0" + qNum : qNum}</span>
                  <div className="flex items-center gap-3">
                    {["A", "B", "C", "D"].map(opt => (
                      <div key={opt} className="flex items-center gap-0.5">
                        <span className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold text-black">
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER METADATA */}
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
              <span>CodeCheck OMR Engine • Sistema de Avaliações Institucionais SENAI</span>
              <span>Assinatura Digital: CODECHECK-V{variantCode}-{Date.now().toString(36).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
