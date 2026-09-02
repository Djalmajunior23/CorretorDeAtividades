const fs = require('fs');

let content = fs.readFileSync('src/components/SmartClassDiaryView.tsx', 'utf8');

const targetMethod = `  // Delete Session
  const handleDeleteSession = async (id: string) => {
    if (
      !window.confirm(
        "Deseja realmente excluir este registro de aula de forma irreversível?",
      )
    )
      return;

    // Remove locally
    try {
      const localDiary = localStorage.getItem("codecheck_diary_sessions");
      if (localDiary) {
        const parsed = JSON.parse(localDiary);
        const filtered = parsed.filter((s: any) => s.id !== id);
        localStorage.setItem("codecheck_diary_sessions", JSON.stringify(filtered));
      }
      const localLesson = localStorage.getItem("codecheck_lesson_logs");
      if (localLesson) {
        const parsed = JSON.parse(localLesson);
        const filtered = parsed.filter((l: any) => l.id !== id);
        localStorage.setItem("codecheck_lesson_logs", JSON.stringify(filtered));
      }
    } catch (e) {}

    try {
      const res = await fetch(apiUrl(\`/api/codecheck/diary/sessions/\${id}\`), {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Aula excluída com sucesso.");
        fetchData();
      } else {
        showToast("Falha ao excluir aula.", "error");
      }
    } catch (err) {
      showToast("Erro na exclusão.", "error");
    }
  };`;

const newMethod = `  // Delete Session
  const handleDeleteSession = async (id: string) => {
    if (
      !window.confirm(
        "Deseja realmente excluir este registro de aula de forma irreversível?",
      )
    )
      return;

    // Update UI immediately (optimistic update)
    setSessions(prev => prev.filter(s => s.id !== id));

    // Remove locally
    try {
      const localDiary = localStorage.getItem("codecheck_diary_sessions");
      if (localDiary) {
        const parsed = JSON.parse(localDiary);
        const filtered = parsed.filter((s: any) => s.id !== id);
        localStorage.setItem("codecheck_diary_sessions", JSON.stringify(filtered));
      }
      const localLesson = localStorage.getItem("codecheck_lesson_logs");
      if (localLesson) {
        const parsed = JSON.parse(localLesson);
        const filtered = parsed.filter((l: any) => l.id !== id);
        localStorage.setItem("codecheck_lesson_logs", JSON.stringify(filtered));
      }
    } catch (e) {}

    try {
      const res = await fetch(apiUrl(\`/api/codecheck/diary/sessions/\${id}\`), {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Aula excluída com sucesso.");
      } else {
        showToast("Falha ao excluir aula.", "error");
      }
    } catch (err) {
      showToast("Erro na exclusão.", "error");
    }
  };`;

if (content.includes('const localDiary = localStorage.getItem("codecheck_diary_sessions");')) {
  content = content.replace(targetMethod, newMethod);
  fs.writeFileSync('src/components/SmartClassDiaryView.tsx', content);
  console.log("Patched SmartClassDiaryView.tsx successfully.");
} else {
  console.log("Method not found.");
}
