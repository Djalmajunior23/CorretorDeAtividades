// Local processes share the backend's filesystem. They are suitable only for
// trusted development fixtures, never for student submissions in production.
export function allowTrustedLocalExecution(): boolean {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return false;
  return process.env.NODE_ENV === "test" || process.env.ALLOW_TRUSTED_LOCAL_EXECUTION === "true";
}
