
import pg from "pg";

export interface StudentProfile {
  student_id: string;
  total_submissions: number;
  average_score: number;
  strengths: string[];
  weaknesses: string[];
  evolution_score: number;
  last_analysis_date: string;
  languages_used: string[];
  concepts_mastered: string[];
  concepts_struggling: string[];
}

export interface ClassIntelligence {
  class_name: string;
  average_score: number;
  completion_rate: number;
  difficult_topics: string[];
  mastered_topics: string[];
  at_risk_students: string[];
  recommendations: string[];
}

export class LearningAnalyticsService {
  constructor(private pool: pg.Pool) {}

  /**
   * Atualiza ou gera o perfil de aprendizagem de um aluno baseado no seu histórico.
   */
  async updateStudentProfile(studentName: string): Promise<StudentProfile | null> {
    try {
      const qSubmissions = await this.pool.query(`
        SELECT s.language, r.final_score, f.strengths, f.errors, f.concepts_to_review, r.created_at
        FROM d_correction_submission s
        JOIN d_correction_result r ON s.id = r.submission_id
        LEFT JOIN d_correction_feedback f ON r.id = f.result_id
        WHERE s.student_name = $1
        ORDER BY r.created_at ASC
      `, [studentName]);

      if (qSubmissions.rows.length === 0) return null;

      const rows = qSubmissions.rows;
      const total = rows.length;
      const avg = Math.round(rows.reduce((sum, r) => sum + r.final_score, 0) / total);
      
      const languages = Array.from(new Set(rows.map(r => r.language)));
      
      // Evolution: compare last score with first score
      const firstScore = rows[0].final_score;
      const lastScore = rows[total - 1].final_score;
      const evolution = lastScore - firstScore;

      // Aggregating strengths and weaknesses
      const strengthsSet = new Set<string>();
      const errorsSet = new Set<string>();
      const conceptsSet = new Set<string>();

      rows.forEach(r => {
        if (r.strengths) r.strengths.forEach((s: string) => strengthsSet.add(s));
        if (r.errors) r.errors.forEach((e: string) => errorsSet.add(e));
        if (r.concepts_to_review) r.concepts_to_review.forEach((c: string) => conceptsSet.add(c));
      });

      const profile: StudentProfile = {
        student_id: studentName,
        total_submissions: total,
        average_score: avg,
        strengths: Array.from(strengthsSet).slice(0, 5),
        weaknesses: Array.from(errorsSet).slice(0, 5),
        evolution_score: evolution,
        last_analysis_date: new Date().toISOString(),
        languages_used: languages,
        concepts_mastered: Array.from(strengthsSet).slice(0, 3), // Simplistic heuristic
        concepts_struggling: Array.from(conceptsSet).slice(0, 5)
      };

      await this.pool.query(`
        INSERT INTO r_student_profiles (
          student_id, total_submissions, average_score, strengths, weaknesses, 
          evolution_score, last_analysis_date, languages_used, concepts_mastered, concepts_struggling
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (student_id) DO UPDATE SET
          total_submissions = EXCLUDED.total_submissions,
          average_score = EXCLUDED.average_score,
          strengths = EXCLUDED.strengths,
          weaknesses = EXCLUDED.weaknesses,
          evolution_score = EXCLUDED.evolution_score,
          last_analysis_date = EXCLUDED.last_analysis_date,
          languages_used = EXCLUDED.languages_used,
          concepts_mastered = EXCLUDED.concepts_mastered,
          concepts_struggling = EXCLUDED.concepts_struggling
      `, [
        profile.student_id, profile.total_submissions, profile.average_score, 
        profile.strengths, profile.weaknesses, profile.evolution_score, 
        profile.last_analysis_date, profile.languages_used, 
        profile.concepts_mastered, profile.concepts_struggling
      ]);

      return profile;
    } catch (e) {
      console.error("Error updating student profile:", e);
      return null;
    }
  }

  /**
   * Gera inteligência consolidada para uma turma.
   */
  async getClassIntelligence(className: string): Promise<ClassIntelligence | null> {
    try {
      const q = await this.pool.query(`
        SELECT r.final_score, f.concepts_to_review, s.student_name
        FROM d_correction_submission s
        JOIN d_correction_result r ON s.id = r.submission_id
        LEFT JOIN d_correction_feedback f ON r.id = f.result_id
        WHERE s.class_name = $1
      `, [className]);

      if (q.rows.length === 0) return null;

      const rows = q.rows;
      const total = rows.length;
      const avg = Math.round(rows.reduce((sum, r) => sum + r.final_score, 0) / total);
      
      const conceptsFreq: Record<string, number> = {};
      const studentAverages: Record<string, { total: number, count: number }> = {};

      rows.forEach(r => {
        if (r.concepts_to_review) {
          r.concepts_to_review.forEach((c: string) => {
            conceptsFreq[c] = (conceptsFreq[c] || 0) + 1;
          });
        }
        
        if (!studentAverages[r.student_name]) studentAverages[r.student_name] = { total: 0, count: 0 };
        studentAverages[r.student_name].total += r.final_score;
        studentAverages[r.student_name].count += 1;
      });

      const difficultTopics = Object.entries(conceptsFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      const atRiskStudents = Object.entries(studentAverages)
        .filter(([_, stats]) => (stats.total / stats.count) < 60)
        .map(([name]) => name);

      const approvedCount = Object.entries(studentAverages).filter(([_, stats]) => (stats.total / stats.count) >= 60).length;
      const completionRate = Math.round((approvedCount / Object.keys(studentAverages).length) * 100);

      const recommendations: string[] = [];
      if (difficultTopics.length > 0) {
        recommendations.push(`Considere revisar: ${difficultTopics.join(", ")}. Grande parte da turma apresentou dificuldades nestes temas.`);
      }
      if (atRiskStudents.length > 0) {
        recommendations.push(`Atenção: ${atRiskStudents.length} alunos estão abaixo da média. Considere atividade de recuperação.`);
      }

      return {
        class_name: className,
        average_score: avg,
        completion_rate: completionRate,
        difficult_topics: difficultTopics,
        mastered_topics: [], // Could be expanded
        at_risk_students: atRiskStudents,
        recommendations
      };
    } catch (e) {
      console.error("Error calculating class intelligence:", e);
      return null;
    }
  }
}
