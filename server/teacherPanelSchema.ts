import type { Pool } from "pg";

// Initialize independent panel tables before legacy migrations can fail.
export async function ensureTeacherPanelSchema(pool: Pool): Promise<void> {
  await pool.query(`
CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        language TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        starter_code TEXT,
        test_cases JSONB DEFAULT '[]'::jsonb,
        rubric JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
  `);
  await pool.query(`
CREATE TABLE IF NOT EXISTS d_teacher_linting_settings (
        id VARCHAR(50) PRIMARY KEY,
        require_comments BOOLEAN NOT NULL DEFAULT TRUE,
        require_indentation BOOLEAN NOT NULL DEFAULT TRUE,
        max_lines_limit INTEGER NOT NULL DEFAULT 80,
        require_no_single_letter_vars BOOLEAN NOT NULL DEFAULT TRUE,
        require_functions BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `);
  await pool.query(`
CREATE TABLE IF NOT EXISTS d_pedagogical_track (
        id UUID PRIMARY KEY,
        teacher_id VARCHAR(100) NOT NULL,
        class_id VARCHAR(150),
        student_id VARCHAR(150),
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        diagnosis TEXT,
        critical_topics TEXT[],
        learning_objectives TEXT[],
        recommended_activities JSONB,
        recommended_questions UUID[],
        recommended_labs UUID[],
        estimated_duration VARCHAR(100),
        success_criteria TEXT[],
        ai_recommendations JSONB,
        teacher_notes TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `);
  await pool.query(`
CREATE TABLE IF NOT EXISTS d_intervention_plan (
        id UUID PRIMARY KEY,
        teacher_id VARCHAR(100) NOT NULL,
        class_id VARCHAR(150),
        student_id VARCHAR(150),
        title VARCHAR(255) NOT NULL,
        diagnosis TEXT,
        objectives TEXT[],
        actions JSONB,
        resources TEXT[],
        schedule TEXT,
        success_criteria TEXT[],
        monitoring_strategy TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `);
}
