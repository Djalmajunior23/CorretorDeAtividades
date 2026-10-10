export interface ClassItem {
  id: string;
  teacher_id?: string;
  name: string;
  course: string;
  module: string;
  semester: string;
  shift: string;
  year: number;
  status: string;
  description: string;
  students_count?: number;
  average_score?: number;
  created_at?: string;
}

export interface StudentItem {
  id: string;
  class_id: string;
  teacher_id?: string;
  name: string;
  enrollment_code?: string;
  email?: string;
  notes?: string;
  status: string;
  class_name?: string;
  course_name?: string;
  average_score?: number;
  created_at?: string;
}

export const DEFAULT_SENAI_CLASSES: ClassItem[] = [
  {
    id: "930166c4-ee91-4502-8cf4-398d0d598c20",
    teacher_id: "teacher_portal",
    name: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
    course: "Desenvolvimento de Sistemas",
    module: "Módulo I (Fundamentos)",
    semester: "2026/1",
    shift: "Noturno",
    year: 2026,
    status: "active",
    description: "Turma de formação técnica em programação, lógica e estruturas de dados.",
    students_count: 5,
    average_score: 82.5,
    created_at: "2026-02-01T08:00:00.000Z"
  },
  {
    id: "e2b65a58-860f-4e08-9df5-636bc5b0fa63",
    teacher_id: "teacher_portal",
    name: "Técnico em Desenvolvimento de Sistemas - 2º Termo",
    course: "Desenvolvimento de Sistemas",
    module: "Módulo II (Avançado)",
    semester: "2026/1",
    shift: "Vespertino",
    year: 2026,
    status: "active",
    description: "Programação Web, APIs REST, Banco de Dados e Arquitetura de Software.",
    students_count: 2,
    average_score: 78.0,
    created_at: "2026-02-01T08:00:00.000Z"
  },
  {
    id: "b4c73d91-5a21-4f16-8349-1e42a9d8ef12",
    teacher_id: "teacher_portal",
    name: "Técnico em Redes e Cibersegurança - 3º Termo",
    course: "Redes e Cibersegurança",
    module: "Módulo III (Segurança e Nuvem)",
    semester: "2026/1",
    shift: "Matutino",
    year: 2026,
    status: "active",
    description: "Infraestrutura de Redes, Firewalls, DevSecOps e Defesa Cibernética.",
    students_count: 2,
    average_score: 85.0,
    created_at: "2026-02-01T08:00:00.000Z"
  }
];

export const DEFAULT_SENAI_STUDENTS: StudentItem[] = [
  {
    id: "b1000000-0000-4000-a000-000000000001",
    class_id: "930166c4-ee91-4502-8cf4-398d0d598c20",
    name: "Lucas Gabriel Santos",
    enrollment_code: "2026-DS-01",
    email: "lucas.santos@aluno.senai.br",
    notes: "Aluno destaque em lógica e algoritmos",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 88.0
  },
  {
    id: "b1000000-0000-4000-a000-000000000002",
    class_id: "930166c4-ee91-4502-8cf4-398d0d598c20",
    name: "Mariana Costa Silva",
    enrollment_code: "2026-DS-02",
    email: "mariana.costa@aluno.senai.br",
    notes: "Destaque em front-end e UX",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 91.5
  },
  {
    id: "b1000000-0000-4000-a000-000000000003",
    class_id: "930166c4-ee91-4502-8cf4-398d0d598c20",
    name: "Guilherme Oliveira",
    enrollment_code: "2026-DS-03",
    email: "guilherme.oliveira@aluno.senai.br",
    notes: "Foco em Python e arquitetura backend",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 79.0
  },
  {
    id: "b1000000-0000-4000-a000-000000000004",
    class_id: "930166c4-ee91-4502-8cf4-398d0d598c20",
    name: "Beatriz Helena Lima",
    enrollment_code: "2026-DS-04",
    email: "beatriz.lima@aluno.senai.br",
    notes: "Foco em lógica e banco de dados relacional",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 84.0
  },
  {
    id: "b1000000-0000-4000-a000-000000000005",
    class_id: "930166c4-ee91-4502-8cf4-398d0d598c20",
    name: "Felipe Rodrigues",
    enrollment_code: "2026-DS-05",
    email: "felipe.rodrigues@aluno.senai.br",
    notes: "Participação ativa e entregas regulares",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 80.5
  },
  {
    id: "b1000000-0000-4000-a000-000000000006",
    class_id: "e2b65a58-860f-4e08-9df5-636bc5b0fa63",
    name: "Ana Clara Mendes",
    enrollment_code: "2026-DS-06",
    email: "ana.mendes@aluno.senai.br",
    notes: "Turma de 2º Termo",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 2º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 86.0
  },
  {
    id: "b1000000-0000-4000-a000-000000000007",
    class_id: "e2b65a58-860f-4e08-9df5-636bc5b0fa63",
    name: "Rafael Souza Dias",
    enrollment_code: "2026-DS-07",
    email: "rafael.dias@aluno.senai.br",
    notes: "Turma de 2º Termo",
    status: "active",
    class_name: "Técnico em Desenvolvimento de Sistemas - 2º Termo",
    course_name: "Desenvolvimento de Sistemas",
    average_score: 82.0
  }
];
