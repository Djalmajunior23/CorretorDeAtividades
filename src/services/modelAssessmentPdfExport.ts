import { apiUrl } from "../config/api";
import { DatabaseModelAssessmentService, type DatabaseModelAssessmentResult } from "./databaseModelAssessmentService";

export async function exportModelAssessmentPdf(
  endpoint: "/api/database-models/export-pdf" | "/api/diagrams/export-pdf",
  assessment: DatabaseModelAssessmentResult,
  studentName?: string,
  className?: string,
): Promise<Blob> {
  let response: Response | undefined;
  try {
    response = await fetch(apiUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment, studentName, className }),
    });
  } catch {
    // Local generation remains available if the server cannot be reached.
  }
  if (response?.status === 401) throw new Error("Sessão expirada. Faça login novamente para exportar o laudo.");
  if (response?.status === 403) throw new Error("Exportação não autorizada. Verifique as permissões da sua sessão.");
  if (response?.ok && response.headers.get("Content-Type")?.includes("application/pdf")) {
    return response.blob();
  }
  if (response && !response.ok && response.status < 500) {
    throw new Error(`Não foi possível exportar o laudo (HTTP ${response.status}).`);
  }
  const bytes = await DatabaseModelAssessmentService.generateModelAssessmentPdf(assessment, studentName, className);
  return new Blob([bytes], { type: "application/pdf" });
}
