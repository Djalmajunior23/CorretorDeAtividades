const envApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl.replace(/\/$/, "")
    : (typeof window !== "undefined" ? window.location.origin : "");

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalUrl = `${API_BASE_URL}${normalizedPath}`;

  if (import.meta.env.DEV) {
    console.log("[CodeCheck API Request]", finalUrl);
  }

  return finalUrl;
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      credentials: options.credentials || "include"
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    if (!contentType.includes("application/json")) {
      const text = await response.text().catch(() => "");
      throw new Error(`Resposta não JSON recebida: ${text.slice(0, 300)}`);
    }

    return response.json();
  } catch (error: any) {
    const message = String(error?.message || error);

    if (import.meta.env.DEV) {
      console.warn("[apiFetch error]", error);
    }

    if (
      message.includes("chrome-extension://") ||
      message.includes("aistudio.google.com") ||
      message.includes("invalid extension")
    ) {
      throw new Error("Erro externo do navegador ou ambiente de preview.");
    }

    throw new Error("Não foi possível conectar ao servidor do CodeCheck. Verifique a conexão e tente novamente.");
  }
}

export async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Resposta inválida: ${text}`);
  }

  return response.json();
}

export async function safeJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 120)}`);
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(`Resposta não JSON: ${text.slice(0, 120)}`);
  }

  return response.json();
}

