
export const getApiUrl = (path: string) => {
  const baseUrl = window.API_BASE_URL || "http://31.97.41.64:8080";
  return `${baseUrl}${path}`;
};
