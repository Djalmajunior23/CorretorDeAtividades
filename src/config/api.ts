export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== "undefined" && (window.location.hostname.includes("run.app") || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "" : "https://api.teacherjuniors.com.br");

if (import.meta.env.DEV) {
  console.log(
    "[API BASE URL]",
    import.meta.env.VITE_API_BASE_URL
  );
}

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalUrl = `${API_BASE_URL}${normalizedPath}`;
  if (import.meta.env.DEV && path.includes("feature-flags")) {
    console.log(
      "[REQUEST]",
      finalUrl
    );
  }
  return finalUrl;
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
