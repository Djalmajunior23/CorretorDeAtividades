export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.teacherjuniors.com.br";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  if (!url.startsWith("https://api.teacherjuniors.com.br") && import.meta.env.PROD) {
    console.warn("URL de API inválida em produção:", url);
  }

  if (import.meta.env.DEV) {
    console.log("[CodeCheck API Request]", url);
  }

  try {
    const response = await fetch(url, {
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
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    if (!contentType.includes("application/json")) {
      const text = await response.text().catch(() => "");
      throw new Error(`Resposta não JSON recebida: ${text.slice(0, 200)}`);
    }

    return response.json();
  } catch (error: any) {
    const message = String(error?.message || error);

    if (
      message.includes("chrome-extension://") ||
      message.includes("aistudio.google.com") ||
      message.includes("invalid extension")
    ) {
      if (import.meta.env.DEV) {
        console.warn("Erro externo ignorado:", message);
      }
      throw new Error("Erro externo do navegador ou ambiente de preview.");
    }

    throw new Error("Não foi possível conectar ao servidor do CodeCheck.");
  }
}

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

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
