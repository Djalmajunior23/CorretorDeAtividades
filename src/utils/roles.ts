export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const value = String(role).toUpperCase();

  if (["TEACHER", "PROFESSOR"].includes(value)) return "PROFESSOR";
  if (["STUDENT", "ALUNO"].includes(value)) return "ALUNO";
  if (["ADMIN", "SUPER_ADMIN"].includes(value)) return "ADMIN";

  return value;
}
