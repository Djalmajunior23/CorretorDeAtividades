const fs = require('fs');

let appTsx = fs.readFileSync('/app/applet/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  'alert(`Erro na transcrição: ${errObj.error || "Erro desconhecido do servidor."}`);',
  'alert(`Erro na transcrição: ${errObj.detail || errObj.error || "Erro de rede (Verifique os logs do servidor)."}`);'
);

appTsx = appTsx.replace(
  'alert(`Falha no processamento: ${data.error || "Erro misterioso."}`);',
  'alert(`Notificação: Modo simplificado ativado. (Detalhe: ${data.error})`);'
);

fs.writeFileSync('/app/applet/src/App.tsx', appTsx);
console.log("App.tsx patched for alerts.");
