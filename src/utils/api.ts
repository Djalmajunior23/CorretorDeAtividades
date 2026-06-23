
export const getApiUrl = (path: string) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.teacherjuniors.com.br";
  // Remove leading slash if it exists twice or add if missing
  const sanitizedPath = path.startsWith('/') ? path : '/' + path;
  return `${API_BASE_URL}${sanitizedPath}`;
};
