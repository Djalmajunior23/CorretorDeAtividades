import { apiUrl, API_BASE_URL } from "../config/api";
import React, { useState } from "react";
import { Upload, Code, CheckCircle, AlertCircle } from "lucide-react";


export default function NewActivityForm() {
  const [inputType, setInputType] = useState<"typed" | "image">("typed");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Na prática, deve haver uma base_url configurada nas variáveis de ambiente.
    // Usando endpoint simulado que refletirá a estrutura criada no backend.
    try {
      const baseUrl = API_BASE_URL;
      const url = `${baseUrl.replace(/\/+$/, "")}/submissions/`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code_content: code,
          user_id: 1, // Mock de usuário
          activity_id: 1, // Mock de atividade
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Erro ao enviar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setInputType("typed")}
            className={`flex-1 p-2 rounded border flex flex-col items-center ${inputType === "typed" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-200"}`}
          >
            <Code className="mb-1" size={20} />
            <span className="text-xs">Código</span>
          </button>
          <button
            type="button"
            onClick={() => setInputType("image")}
            className={`flex-1 p-2 rounded border flex flex-col items-center ${inputType === "image" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-200"}`}
          >
            <Upload className="mb-1" size={20} />
            <span className="text-xs">Imagem</span>
          </button>
        </div>

        {inputType === "typed" ? (
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Cole seu código aqui..."
          />
        ) : (
          <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center">
            <Upload className="text-gray-400 mb-2" size={32} />
            <span className="text-sm text-gray-500">
              Funcionalidade de OCR em desenvolvimento...
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md font-medium hover:bg-gray-800 transition disabled:bg-gray-400"
        >
          {loading ? "Analisando..." : "Enviar para Processamento"}
        </button>
      </form>

      {result && (
        <div
          className={`p-4 rounded-md border ${result.score >= 60 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.score >= 60 ? (
              <CheckCircle className="text-green-600" />
            ) : (
              <AlertCircle className="text-red-600" />
            )}
            <h3
              className={`font-semibold ${result.score >= 60 ? "text-green-800" : "text-red-800"}`}
            >
              Nota: {result.score}
            </h3>
          </div>
          <p className="text-sm text-gray-700">{result.feedback}</p>
        </div>
      )}
    </div>
  );
}
