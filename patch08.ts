import fs from 'fs';

let s = fs.readFileSync('server.ts', 'utf-8');

// The lines injected incorrectly
const badInjection = `
    // Módulo de Gestão de Turmas e Alunos
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS d_class_group (
        id UUID PRIMARY KEY,
        teacher_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        course VARCHAR(255),
        module VARCHAR(255),
        semester VARCHAR(50),
        shift VARCHAR(50),
        year INT,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS d_student_record (
        id UUID PRIMARY KEY,
        teacher_id VARCHAR(100) NOT NULL,
        class_id UUID REFERENCES d_class_group(id),
        name VARCHAR(255) NOT NULL,
        enrollment_code VARCHAR(100),
        email VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS d_pedagogical_evidence (
        id UUID PRIMARY KEY,
        teacher_id VARCHAR(100) NOT NULL,
        class_id UUID REFERENCES d_class_group(id),
        student_id UUID REFERENCES d_student_record(id),
        source_type VARCHAR(100),
        source_id VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        score NUMERIC,
        feedback TEXT,
        tags JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);
`;

s = s.replace(badInjection, '');

const targetInitDb = `async function initDatabase() {
  if (!pool) {
    console.log("No PostgreSQL connected, running in cache mode.");
    return;
  }
  try {`;

s = s.replace(targetInitDb, targetInitDb + `\n` + badInjection);

fs.writeFileSync('server.ts', s);
console.log('Fixed DB Init');
