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

export const DEFAULT_SENAI_CLASSES: ClassItem[] = [];

export const DEFAULT_SENAI_STUDENTS: StudentItem[] = [];

