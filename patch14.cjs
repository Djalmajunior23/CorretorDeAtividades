const fs = require('fs');

let appTsx = fs.readFileSync('/app/applet/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  'alert(`Falha no processamento: ${data.error || "Erro misterioso."}`);',
  'if (data.error) { console.warn("Aviso OCR:", data.error); }'
);

appTsx = appTsx.replace(
  'alert(`Erro na transcrição: ${errObj.error || "Erro desconhecido do servidor."}`);',
  'alert(`Aviso de Transcrição Local: ${errObj.detail || errObj.error || "Verifique se o terminal exibiu algum erro de sistema."}`);'
);


fs.writeFileSync('/app/applet/src/App.tsx', appTsx);
console.log("App.tsx patched for alerts.");
