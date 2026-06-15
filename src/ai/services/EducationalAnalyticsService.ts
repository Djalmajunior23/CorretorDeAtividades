import pg from "pg";

export class EducationalAnalyticsService {
  constructor(private pool: pg.Pool) {}

  /**
   * Recalcula o perfil de um aluno específico.
   */
  async updateStudentProfile(studentName: string, teacherId: string) {
    const q = await this.pool.query(`
      SELECT r.final_score, r.created_at, f.concepts_to_review, f.errors
      FROM d_correction_result r
      JOIN d_correction_submission s ON r.submission_id = s.id
      LEFT JOIN d_correction_feedback f ON f.result_id = r.id
      WHERE s.student_name = $1 AND s.teacher_id = $2
      ORDER BY r.created_at DESC
    `, [studentName, teacherId]);

    if (q.rows.length === 0) return;

    const scores = q.rows.map(r => r.final_score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Simplistic recurring errors & topics analysis
    const allErrors = q.rows.flatMap(r => r.errors || []);
    const errorFreq: Record<string, number> = {};
    allErrors.forEach(e => errorFreq[e] = (errorFreq[e] || 0) + 1);
    const recurringErrors = Object.entries(errorFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    const allReviewTopics = q.rows.flatMap(r => r.concepts_to_review || []);
    const topicFreq: Record<string, number> = {};
    allReviewTopics.forEach(t => topicFreq[t] = (topicFreq[t] || 0) + 1);
    const weakestTopics = Object.entries(topicFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    let attentionLevel = "normal";
    if (avgScore < 40) attentionLevel = "critical_support";
    else if (avgScore < 60) attentionLevel = "reinforcement_needed";
    else if (avgScore < 75) attentionLevel = "attention";

    await this.pool.query(`
      INSERT INTO d_student_learning_profile (
        student_name, teacher_id, average_score, total_activities, 
        completed_activities, recurring_errors, weakest_topics, 
        attention_level, last_activity_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (student_name, teacher_id) DO UPDATE SET
        average_score = EXCLUDED.average_score,
        total_activities = EXCLUDED.total_activities,
        completed_activities = EXCLUDED.completed_activities,
        recurring_errors = EXCLUDED.recurring_errors,
        weakest_topics = EXCLUDED.weakest_topics,
        attention_level = EXCLUDED.attention_level,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = CURRENT_TIMESTAMP
    `, [
      studentName, teacherId, avgScore, scores.length, scores.length, 
      recurringErrors, weakestTopics, attentionLevel, q.rows[0].created_at
    ]);
  }

  /**
   * Recalcula o analytics de uma turma.
   */
  async updateClassAnalytics(className: string, teacherId: string) {
    const q = await this.pool.query(`
      SELECT r.final_score, f.concepts_to_review
      FROM d_correction_result r
      JOIN d_correction_submission s ON r.submission_id = s.id
      LEFT JOIN d_correction_feedback f ON f.result_id = r.id
      WHERE s.class_name = $1 AND s.teacher_id = $2
    `, [className, teacherId]);

    if (q.rows.length === 0) return;

    const avgScore = q.rows.reduce((sum, r) => sum + r.final_score, 0) / q.rows.length;
    
    const studentsQ = await this.pool.query(`
      SELECT COUNT(*) as count 
      FROM d_student_learning_profile 
      WHERE teacher_id = $1 AND student_name IN (
        SELECT DISTINCT student_name FROM d_correction_submission WHERE class_name = $2
      ) AND attention_level != 'normal'
    `, [teacherId, className]);

    await this.pool.query(`
      INSERT INTO d_class_learning_analytics (
        class_name, teacher_id, average_score, students_attention_count, 
        activities_analyzed, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (class_name, teacher_id) DO UPDATE SET
        average_score = EXCLUDED.average_score,
        students_attention_count = EXCLUDED.students_attention_count,
        activities_analyzed = EXCLUDED.activities_analyzed,
        updated_at = CURRENT_TIMESTAMP
    `, [className, teacherId, avgScore, parseInt(studentsQ.rows[0].count), q.rows.length]);
  }
}
