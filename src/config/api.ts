const envApiUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL?.trim() : "";

export const API_BASE_URL =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl.replace(/\/$/, "")
    : "";

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalUrl = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
  
  // --- FETCH DIAGNOSTIC LOGGER --- 
  // Utility requested to map and log endpoint behavior
  console.log(`[Diagnostic] Endpoint solicitado: ${path} -> URL Resolvida: ${finalUrl}`);
  
  return finalUrl;
};

// --- GLOBAL AUTOMATIC BEARER JWT INJECTION ---
if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === "object" && "url" in input) {
        url = (input as Request).url;
      }

      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      
      // If user is authenticated and requesting an API/auth route, ensure Authorization header is present
      if (token && (url.includes("/api/") || url.includes("/auth/"))) {
        const headers = new Headers(
          init?.headers || (typeof input === "object" && "headers" in input ? (input as Request).headers : {})
        );

        if (!headers.has("Authorization") && !headers.has("authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        init = {
          ...init,
          headers
        };
      }
    } catch (e) {
      if (import.meta.env?.DEV) {
        console.warn("[Fetch Interceptor Warning]", e);
      }
    }

    return nativeFetch(input, init);
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  try {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {})
      },
      credentials: options.credentials || "same-origin"
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
    if (import.meta.env?.DEV) {
      console.warn("[apiFetch error]", error);
    }
    if (
      message.includes("chrome-extension://") ||
      message.includes("aistudio.google.com") ||
      message.includes("invalid extension")
    ) {
      throw new Error("Erro externo do navegador ou ambiente de preview.");
    }
    throw error;
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
