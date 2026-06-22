const fs = require('fs');

let appTsx = fs.readFileSync('/app/applet/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  'Código extraído com sucesso da imagem pelo Gemini Flash!',
  'Código extraído com sucesso da imagem pela IA!'
);

appTsx = appTsx.replace(
  'O Gemini lerá a caligrafia e organizará o código-fonte automaticamente.',
  'A IA lerá a caligrafia e organizará o código-fonte automaticamente.'
);

appTsx = appTsx.replace(
  'CONVERSANDO COM O GEMINI IA...',
  'PROCESSANDO ANÁLISE INTELIGENTE...'
);

appTsx = appTsx.replace(
  'Relatório Visual e Caligrafia (Gemini Flash OCR)',
  'Relatório Visual e Caligrafia (IA Local OCR)'
);

appTsx = appTsx.replace(
  'Acionando barramento de IA do Gemini para gerar orientações construtivas',
  'Acionando barramento de IA Local para gerar orientações construtivas'
);

fs.writeFileSync('/app/applet/src/App.tsx', appTsx);

let dashboardView = fs.readFileSync('/app/applet/src/components/DashboardView.tsx', 'utf-8');

dashboardView = dashboardView.replace(
  '<h5 className="text-xs font-bold text-slate-200 mt-0.5">Gemini 1.5 Flash</h5>',
  '<h5 className="text-xs font-bold text-slate-200 mt-0.5">IA Local</h5>'
);

fs.writeFileSync('/app/applet/src/components/DashboardView.tsx', dashboardView);
console.log("Frontend patched.");
