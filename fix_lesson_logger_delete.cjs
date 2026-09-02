const fs = require('fs');

let content = fs.readFileSync('src/components/LessonLoggerView.tsx', 'utf8');

const targetMethod = `  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este registro de aula de forma definitiva?")) return;
    
    // Remove locally
    const existingLocal = localStorage.getItem("codecheck_lesson_logs");
    if (existingLocal) {
      try {
        const localArr = JSON.parse(existingLocal);
        const filtered = localArr.filter((l: any) => l.id !== id);
        localStorage.setItem("codecheck_lesson_logs", JSON.stringify(filtered));
      } catch (e) {}
    }
    setLogs(prev => prev.filter(l => l.id !== id));

    try {
      const res = await fetch(apiUrl(\`/api/lesson-logger/\${id}\`), {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Registro de aula removido com sucesso.");
      } else {
        toast.success("Registro removido localmente.");
      }
    } catch (err: any) {
      toast.success("Registro removido localmente.");
    }
  };`;

const newMethod = `  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este registro de aula de forma definitiva?")) return;
    
    // Remove locally
    const existingLocal = localStorage.getItem("codecheck_lesson_logs");
    if (existingLocal) {
      try {
        const localArr = JSON.parse(existingLocal);
        const filtered = localArr.filter((l: any) => l.id !== id);
        localStorage.setItem("codecheck_lesson_logs", JSON.stringify(filtered));
      } catch (e) {}
    }
    setLogs(prev => prev.filter(l => l.id !== id));

    try {
      const res = await fetch(apiUrl(\`/api/lesson-logger/\${id}\`), {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Registro de aula removido com sucesso.");
        fetchData(); // Recarrega os dados do backend garantindo integridade
      } else {
        toast.error("Erro ao remover registro do servidor, removido apenas localmente.");
      }
    } catch (err: any) {
      toast.error("Sem conexão, registro removido apenas localmente.");
    }
  };`;

if (content.includes('toast.success("Registro de aula removido com sucesso.");\n      } else {')) {
  content = content.replace(targetMethod, newMethod);
  fs.writeFileSync('src/components/LessonLoggerView.tsx', content);
  console.log("Patched LessonLoggerView.tsx successfully.");
} else {
  console.log("Method not found or slightly different. Let's do string replacement on the try-catch.");
}
