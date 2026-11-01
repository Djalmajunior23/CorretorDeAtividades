import { apiUrl, safeJsonResponse } from "../config/api";
import type { PedagogicalTrack, InterventionPlan } from "../types";

interface ClassOption { id: string; name: string }

async function fetchList<T extends { id: string }>(path: string, signal?: AbortSignal): Promise<T[]> {
  const response = await fetch(apiUrl(path), { signal });
  const data: unknown = await safeJsonResponse(response);
  if (!Array.isArray(data) || data.some(item => !item || typeof item !== "object" || typeof item.id !== "string")) {
    throw new Error("A API retornou uma lista inválida.");
  }
  return data;
}

export async function loadPedagogicalDashboard(signal?: AbortSignal) {
  const results = await Promise.allSettled([
    fetchList<PedagogicalTrack>("/api/pedagogical-tracks", signal),
    fetchList<InterventionPlan>("/api/intervention-plans", signal),
    fetchList<ClassOption>("/api/classes", signal),
  ]);
  const [tracks, plans, classes] = results;
  const labels = ["trilhas pedagógicas", "planos de intervenção", "turmas"];
  return {
    tracks: tracks.status === "fulfilled" ? tracks.value : [],
    plans: plans.status === "fulfilled" ? plans.value : [],
    classes: classes.status === "fulfilled" ? classes.value : [],
    errors: results.flatMap((result, index) => result.status === "rejected"
      ? [`Não foi possível carregar ${labels[index]}.`] : []),
  };
}
