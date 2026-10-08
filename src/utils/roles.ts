export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const value = String(role).toUpperCase();

  if (["TEACHER", "PROFESSOR"].includes(value)) return "PROFESSOR";
  if (["STUDENT", "ALUNO"].includes(value)) return "ALUNO";
  if (["SUPER_ADMIN", "SUPERADMIN"].includes(value)) return "SUPER_ADMIN";
  if (["ADMIN", "ADMINISTRATOR", "ADMINISTRADOR"].includes(value)) return "ADMIN";

  return value;
}

