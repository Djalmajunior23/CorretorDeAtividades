const fs = require('fs');

let content = fs.readFileSync('src/components/SlaRemindersSchedulerCard.tsx', 'utf8');

// Replace {overdueStudents.length} pendentes
content = content.replace(
  /{overdueStudents\.length} pendentes/g,
  '{filteredOverdueStudents.length} pendentes'
);

// Replace 3. Fila de Alunos em Atraso ({overdueStudents.length})
content = content.replace(
  /3\. Fila de Alunos em Atraso \(\{overdueStudents\.length\}\)/g,
  '3. Fila de Alunos em Atraso ({filteredOverdueStudents.length})'
);

// In TAB 3
content = content.replace(
  /disabled={overdueStudents\.length === 0}/g,
  'disabled={filteredOverdueStudents.length === 0}'
);

content = content.replace(
  /disabled={triggering \|\| overdueStudents\.length === 0}/g,
  'disabled={triggering || filteredOverdueStudents.length === 0}'
);

content = content.replace(
  /Disparar Lembretes para Todos \(\{overdueStudents\.length\}\)/g,
  'Disparar Lembretes para Todos ({filteredOverdueStudents.length})'
);

// The mapping of table rows in Tab 3
content = content.replace(
  /overdueStudents\.map\(\(st\) =>/g,
  'filteredOverdueStudents.map((st) =>'
);

content = content.replace(
  /{overdueStudents\.length === 0 && \(/g,
  '{filteredOverdueStudents.length === 0 && ('
);

fs.writeFileSync('src/components/SlaRemindersSchedulerCard.tsx', content);
