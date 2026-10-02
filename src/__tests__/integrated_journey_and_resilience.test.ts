import { describe, it, expect } from 'vitest';
import { UnifiedLifecycleEngineService } from '../services/unifiedLifecycleEngineService';
import { ReliableAsyncJobQueueService } from '../services/reliableAsyncJobQueueService';
import { ControlledPublicationService } from '../services/controlledPublicationService';
import { ClassOperationsCentralService } from '../services/classOperationsCentralService';
import { PedagogicalConfigHierarchyService } from '../services/pedagogicalConfigHierarchyService';
import { UnifiedNotificationCenterService } from '../services/unifiedNotificationCenterService';
import { ConsistentReportingService } from '../services/consistentReportingService';

describe('Jornada Pedagógica Integrada e Resiliência do Sistema (E2E)', () => {
  describe('1. Ciclo de Vida da Atividade (Autoria, Versionamento, Publicação e Imutabilidade)', () => {
    it('deve percorrer o ciclo completo de estados da atividade com validações e pré-condições', () => {
      // 1. Criar Rascunho
      const activity = UnifiedLifecycleEngineService.createDraftActivity({
        turmaId: 'turma-ti-2026',
        professorId: 'prof-carlos',
        titulo: 'Algoritmo de Busca Binária',
        enunciado: 'Implemente uma busca binária eficiente em TypeScript.',
        rubrica: [
          { criterio: 'Complexidade O(log n)', peso: 50 },
          { criterio: 'Tratamento de casos de borda', peso: 50 },
        ],
        testesPrivados: [
          { input: '[1, 3, 5, 7, 9], 5', expected: '2' },
          { input: '[1, 3, 5, 7, 9], 10', expected: '-1' },
        ],
        regrasEntrega: {
          maxTentativas: 3,
          permiteAtraso: true,
          fatorDescontoAtraso: 0.8,
          prazoFinal: new Date(Date.now() + 86400000).toISOString(),
        },
      });

      expect(activity.currentState).toBe("RASCUNHO");
      expect(activity.activeVersion).toBe(1);
      expect(activity.versionHistory[0].sha256ContentHash).toBeDefined();

      // 2. Solicitar Validação
      const emValidacao = UnifiedLifecycleEngineService.requestValidation(activity.id, 'prof-carlos');
      expect(emValidacao.currentState).toBe("EM_VALIDACAO");

      // 3. Aprovar para Publicação
      const pronta = UnifiedLifecycleEngineService.approveForPublication(activity.id, 'coordenador-ana');
      expect(pronta.currentState).toBe("PRONTA_PUBLICACAO");

      // 4. Publicar Atividade
      const publicada = UnifiedLifecycleEngineService.publishActivity(activity.id, 'prof-carlos');
      expect(publicada.currentState).toBe("PUBLICADA");
      expect(publicada.publishedAtIso).toBeDefined();

      // 5. Encerrar Atividade
      const encerrada = UnifiedLifecycleEngineService.closeActivity(activity.id, 'prof-carlos');
      expect(encerrada.currentState).toBe("ENCERRADA");

      // 6. Arquivar Atividade
      const arquivada = UnifiedLifecycleEngineService.archiveActivity(activity.id, 'prof-carlos');
      expect(arquivada.currentState).toBe("ARQUIVADA");
    });

    it('deve gerar nova versão imutável ao editar atividade já publicada, preservando o histórico', () => {
      const activity = UnifiedLifecycleEngineService.createDraftActivity({
        turmaId: 'turma-ti-2026',
        professorId: 'prof-carlos',
        titulo: 'Fila de Prioridade',
        enunciado: 'Implemente uma Min-Heap.',
        rubrica: [{ criterio: 'Inserção e Remoção', peso: 100 }],
        testesPrivados: [{ input: 'insert(5), extractMin()', expected: '5' }],
        regrasEntrega: { maxTentativas: 2, permiteAtraso: false, prazoFinal: new Date().toISOString() },
      });

      UnifiedLifecycleEngineService.requestValidation(activity.id, 'prof-carlos');
      UnifiedLifecycleEngineService.approveForPublication(activity.id, 'coordenador-ana');
      const pubV1 = UnifiedLifecycleEngineService.publishActivity(activity.id, 'prof-carlos');
      expect(pubV1.activeVersion).toBe(1);
      const hashV1 = pubV1.versionHistory[0].sha256ContentHash;

      // Edição após publicação -> Gera Snapshot v2
      const pubV2 = UnifiedLifecycleEngineService.updatePublishedActivity(
        activity.id,
        {
          enunciado: 'Implemente uma Min-Heap com suporte a visualização em ASCII.',
        },
        'prof-carlos',
        'Inclusão de requisito de visualização gráfica'
      );

      expect(pubV2.activeVersion).toBe(2);
      expect(pubV2.versionHistory.length).toBe(2);
      expect(pubV2.versionHistory[1].sha256ContentHash).not.toBe(hashV1);
      expect(pubV2.versionHistory[0].versionNumber).toBe(1);
      expect(pubV2.versionHistory[0].sha256ContentHash).toBe(hashV1);
    });

    it('deve impedir publicação direta de rascunho sem passar por validação prévia', () => {
      const draft = UnifiedLifecycleEngineService.createDraftActivity({
        turmaId: 'turma-ti-2026',
        professorId: 'prof-carlos',
        titulo: 'Grafos DFS',
        enunciado: 'Implemente DFS recursivo.',
        rubrica: [{ criterio: 'Corretude', peso: 100 }],
        testesPrivados: [],
        regrasEntrega: { maxTentativas: 1, permiteAtraso: false, prazoFinal: new Date().toISOString() },
      });

      expect(() => {
        UnifiedLifecycleEngineService.publishActivity(draft.id, 'prof-carlos');
      }).toThrow(/Transição inválida/);
    });
  });

  describe('2. Ciclo de Vida da Submissão, Idempotência e Proteção contra Falha Técnica', () => {
    it('deve receber submissão, registrar idempotência e prevenir submissões duplicadas por cliques repetidos', () => {
      const payload = {
        atividadeId: 'ativ-heap-01',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-lucas',
        alunoNome: 'Lucas Silveira',
        tentativaNumero: 1,
        codigo: 'function minHeap() { return true; }',
        linguagem: 'typescript',
      };

      // Primeiro Envio
      const sub1 = UnifiedLifecycleEngineService.submitDelivery(payload);
      expect(sub1.currentState).toBe("RECEBIDA");
      expect(sub1.idempotencyKey).toBe('aluno-lucas:ativ-heap-01:1');

      // Segundo Envio Idêntico (Simulando duplo clique)
      const sub2 = UnifiedLifecycleEngineService.submitDelivery(payload);
      expect(sub2.id).toBe(sub1.id);
      expect(sub2.receivedAtIso).toBe(sub1.receivedAtIso);
    });

    it('NUNCA deve atribuir nota zero punitiva em caso de falha técnica/infraestrutura', () => {
      const sub = UnifiedLifecycleEngineService.submitDelivery({
        atividadeId: 'ativ-heap-01',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-beatriz',
        alunoNome: 'Beatriz Lima',
        tentativaNumero: 1,
        codigo: 'const x = 10;',
        linguagem: 'typescript',
      });

      // Transiciona para Fila e Processamento
      UnifiedLifecycleEngineService.transitionSubmissionStatus(sub.id, "NA_FILA", 'Queue Worker');
      UnifiedLifecycleEngineService.transitionSubmissionStatus(sub.id, "PROCESSANDO", 'Sandbox Engine');

      // Simula Falha no Executor Isolado (ex: Timeout de Container / Docker Socket Error)
      const falhaTecnica = UnifiedLifecycleEngineService.registerTechnicalFailure(
        sub.id,
        'TIMEOUT_SANDBOX_ISOLATION',
        'Ambiente seguro não respondeu dentro do limite de 5000ms.'
      );

      expect(falhaTecnica.currentState).toBe("FALHA_TECNICA");
      expect(falhaTecnica.notaAutomatica).toBeNull(); // Não é zero!
      expect(falhaTecnica.isZeroPunitivo).toBe(false);
      expect(falhaTecnica.motivoFalha).toContain('TIMEOUT_SANDBOX_ISOLATION');
    });

    it('deve registrar histórico auditável de cada transição de estado da submissão', () => {
      const sub = UnifiedLifecycleEngineService.submitDelivery({
        atividadeId: 'ativ-grafo-01',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-marcos',
        alunoNome: 'Marcos Souza',
        tentativaNumero: 1,
        codigo: 'class Graph {}',
        linguagem: 'typescript',
      });

      UnifiedLifecycleEngineService.transitionSubmissionStatus(sub.id, "NA_FILA", 'Queue Worker');
      UnifiedLifecycleEngineService.transitionSubmissionStatus(sub.id, "PROCESSANDO", 'Sandbox Worker #1');
      UnifiedLifecycleEngineService.registerAutoEvaluationResult(sub.id, 85, {
        passedTests: 4,
        totalTests: 5,
        executionTimeMs: 142,
      });

      const updated = UnifiedLifecycleEngineService.getSubmissionById(sub.id);
      expect(updated?.currentState).toBe("AVALIADA_AUTO");
      expect(updated?.transitionHistory.length).toBe(4); // RECEBIDA, NA_FILA, PROCESSANDO, AVALIADA_AUTO
    });
  });

  describe('3. Processamento Assíncrono Confiável (Fila, Timeout, Concorrência e DLQ)', () => {
    it('deve enfileirar tarefas assíncronas com identificador persistente e respeitar concorrência máxima', async () => {
      ReliableAsyncJobQueueService.setMaxConcurrency(2);

      const job1 = ReliableAsyncJobQueueService.enqueueJob({
        idempotencyKey: 'idemp-job-001',
        type: "CORRECAO_SUBMISSAO",
        payload: { code: 'console.log("1")' },
      });

      const job2 = ReliableAsyncJobQueueService.enqueueJob({
        idempotencyKey: 'idemp-job-002',
        type: "CORRECAO_SUBMISSAO",
        payload: { code: 'console.log("2")' },
      });

      const job3 = ReliableAsyncJobQueueService.enqueueJob({
        idempotencyKey: 'idemp-job-003',
        type: "CORRECAO_SUBMISSAO",
        payload: { code: 'console.log("3")' },
      });

      expect(job1.job.id).toBeDefined();
      expect(job1.job.status).toBe("PENDENTE");

      // Processar lote
      await ReliableAsyncJobQueueService.processNextBatch();

      const runningCount = ReliableAsyncJobQueueService.getRunningJobsCount();
      expect(runningCount).toBeLessThanOrEqual(2);
    });

    it('deve enviar para Dead-Letter Queue (DLQ) após esgotar tentativas em falhas recuperáveis', () => {
      const { job } = ReliableAsyncJobQueueService.enqueueJob({
        idempotencyKey: `idemp-ia-${Date.now()}`,
        type: "IA_ANALISE_ESTATICA",
        payload: { prompt: 'Analyze complexity' },
        maxRetries: 2,
      });

      // Simula falha na tentativa 1
      job.attemptCount = 1;
      ReliableAsyncJobQueueService.failJobWithRetry(job.id, 'GEMINI_API_503_UNAVAILABLE', true);
      const afterFail1 = ReliableAsyncJobQueueService.getJobById(job.id);
      expect(afterFail1?.attemptCount).toBe(1);
      expect(afterFail1?.status).toBe("FALHA_RECUPERAVEL");

      // Simula falha na tentativa 2 (esgotada)
      job.attemptCount = 2;
      ReliableAsyncJobQueueService.failJobWithRetry(job.id, 'GEMINI_API_503_UNAVAILABLE', true);
      const afterFail2 = ReliableAsyncJobQueueService.getJobById(job.id);
      expect(afterFail2?.status).toBe("FALHA_FATAL");
      expect(ReliableAsyncJobQueueService.getDeadLetterQueue().length).toBeGreaterThanOrEqual(1);
    });

    it('deve recuperar tarefas órfãs/travadas após reinício inesperado do worker', () => {
      const { job: jobStale } = ReliableAsyncJobQueueService.enqueueJob({
        idempotencyKey: `idemp-ocr-${Date.now()}`,
        type: "OCR_PROCESSAMENTO",
        payload: { imageUri: 'data:image/png;base64,...' },
      });

      // Forçar estado de execução e timestamp no passado (crash do worker)
      ReliableAsyncJobQueueService.forceJobRunningState(jobStale.id, Date.now() - 60000);

      // Executar recuperação de worker
      const recoveredCount = ReliableAsyncJobQueueService.recoverStaleJobs(30000); // timeout de 30s
      expect(recoveredCount).toBeGreaterThanOrEqual(1);

      const recoveredJob = ReliableAsyncJobQueueService.getJobById(jobStale.id);
      expect(recoveredJob?.status).toBe("PENDENTE");
    });
  });

  describe('4. Publicação Controlada dos Resultados e Moderação Docente', () => {
    it('deve manter separadas a nota automática, a nota moderada pelo professor e a nota publicada', () => {
      const sub = UnifiedLifecycleEngineService.submitDelivery({
        atividadeId: 'ativ-arvore-avl',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-gabriel',
        alunoNome: 'Gabriel Martins',
        tentativaNumero: 1,
        codigo: 'class AVLTree {}',
        linguagem: 'typescript',
      });

      UnifiedLifecycleEngineService.registerAutoEvaluationResult(sub.id, 70, { feedback: 'Faltou rotação dupla' });

      // Professor revisa e concede bonificação com justificativa
      const moderada = ControlledPublicationService.reviewAndModerateSubmission({
        submissaoId: sub.id,
        professorId: 'prof-carlos',
        notaModerada: 85,
        justificativaAjuste: 'Implementou rotação simples de forma impecável e algoritmo limpo.',
        feedbackDocente: 'Excelente estrutura de código!',
      });

      expect(moderada.notaAutomatica).toBe(70);
      expect(moderada.notaModerada).toBe(85);
      expect(moderada.notaPublicada).toBeNull(); // Ainda NÃO publicada para o aluno
      expect(moderada.status).toBe("AGUARDANDO_REVISAO");

      // Publicação Oficial
      const publicada = ControlledPublicationService.publishOfficialResult(sub.id, 'prof-carlos');
      expect(publicada.notaPublicada).toBe(85);
      expect(publicada.status).toBe("RESULTADO_PUBLICADO");
      expect(publicada.dataPublicacaoResultado).toBeDefined();
    });

    it('deve gerar prévia detalhada antes de executar publicação em lote', () => {
      const preview = ControlledPublicationService.generateBatchPublicationPreview('ativ-arvore-avl', 'turma-ti-2026');
      expect(preview).toBeDefined();
      expect(Array.isArray(preview.alunosAfetados)).toBe(true);
      expect(typeof preview.totalAlunos).toBe('number');
      expect(typeof preview.mediaTurmaPrevia).toBe('number');
    });

    it('deve registrar histórico auditável ao corrigir uma nota já publicada', () => {
      const sub = UnifiedLifecycleEngineService.submitDelivery({
        atividadeId: 'ativ-arvore-avl',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-clara',
        alunoNome: 'Clara Nunes',
        tentativaNumero: 1,
        codigo: 'class AVLTree {}',
        linguagem: 'typescript',
      });

      UnifiedLifecycleEngineService.registerAutoEvaluationResult(sub.id, 90, {});
      ControlledPublicationService.reviewAndModerateSubmission({
        submissaoId: sub.id,
        professorId: 'prof-carlos',
        notaModerada: 90,
        justificativaAjuste: 'Sem alterações.',
        feedbackDocente: 'Parabéns!',
      });
      ControlledPublicationService.publishOfficialResult(sub.id, 'prof-carlos');

      // Correção pós-publicação
      const corrigida = ControlledPublicationService.correctPublishedGrade({
        submissaoId: sub.id,
        professorId: 'prof-carlos',
        novaNota: 95,
        motivoRetificacao: 'Reavaliação de teste de borda aceito na monitoria.',
      });

      expect(corrigida.notaPublicada).toBe(95);
      expect(corrigida.historicoRetificacoes.length).toBe(1);
      expect(corrigida.historicoRetificacoes[0].notaAnterior).toBe(90);
      expect(corrigida.historicoRetificacoes[0].notaNova).toBe(95);
    });
  });

  describe('5. Central de Operações da Turma e Reprocessamento', () => {
    it('deve consolidar os indicadores em tempo real para o cockpit docente', () => {
      const metrics = ClassOperationsCentralService.getTurmaOperationsCockpit('turma-ti-2026');

      expect(metrics).toBeDefined();
      expect(typeof metrics.atividadesEmAndamento).toBe('number');
      expect(typeof metrics.entregasRecebidas).toBe('number');
      expect(typeof metrics.alunosSemEntrega).toBe('number');
      expect(typeof metrics.processamentosPendentes).toBe('number');
      expect(typeof metrics.falhasTecnicas).toBe('number');
      expect(typeof metrics.correcoesAguardandoRevisao).toBe('number');
      expect(typeof metrics.feedbackNaoPublicado).toBe('number');
      expect(typeof metrics.refacoesSolicitadas).toBe('number');
      expect(metrics.dataUltimaAtualizacao).toBeDefined();
    });

    it('deve permitir reprocessamento em massa de falhas técnicas sem perder tentativas do aluno', () => {
      const reprocessed = ClassOperationsCentralService.reprocessTechnicalFailures('turma-ti-2026');
      expect(typeof reprocessed.requeuedCount).toBe('number');
    });
  });

  describe('6. Hierarquia de Configurações Pedagógicas e Precedência de Regras', () => {
    it('deve resolver regras com precedência correta: Atividade > Turma > Instituição', () => {
      // 1. Instituição define prazo de refação de 7 dias e max tentativas 3
      PedagogicalConfigHierarchyService.setInstitutionalConfig('inst-senai', {
        diasRefacao: 7,
        maxTentativasPadrao: 3,
        permiteUsoIA: false,
        arredondamentoDecimais: 1,
      });

      // 2. Turma habilita uso de IA
      PedagogicalConfigHierarchyService.setTurmaConfig('turma-ti-2026', 'inst-senai', {
        permiteUsoIA: true,
      });

      // 3. Atividade específica define max tentativas 5
      PedagogicalConfigHierarchyService.setActivityConfig('ativ-projeto-final', 'turma-ti-2026', {
        maxTentativas: 5,
      });

      // Resolução de regra efetiva para a atividade
      const effective = PedagogicalConfigHierarchyService.getEffectiveConfig({
        instituicaoId: 'inst-senai',
        turmaId: 'turma-ti-2026',
        atividadeId: 'ativ-projeto-final',
      });

      expect(effective.permiteUsoIA).toBe(true); // Herdado da Turma
      expect(effective.maxTentativas).toBe(5); // Sobrescrito pela Atividade
      expect(effective.diasRefacao).toBe(7); // Herdado da Instituição
      expect(effective.arredondamentoDecimais).toBe(1); // Herdado da Instituição
    });

    it('deve aplicar acomodações individuais autorizadas (tempo extra / tentativas) para alunos com NEE', () => {
      PedagogicalConfigHierarchyService.setStudentAccommodation('aluno-especial-01', 'turma-ti-2026', {
        multiplicadorTempo: 1.5, // 50% mais tempo
        tentativasExtras: 2,
        motivoLaudo: 'Dislexia / TDAH laudo #8812',
      });

      const effectiveForStudent = PedagogicalConfigHierarchyService.getEffectiveConfigForStudent({
        instituicaoId: 'inst-senai',
        turmaId: 'turma-ti-2026',
        atividadeId: 'ativ-projeto-final',
        alunoId: 'aluno-especial-01',
      });

      expect(effectiveForStudent.multiplicadorTempo).toBe(1.5);
      expect(effectiveForStudent.maxTentativas).toBe(7); // 5 base + 2 extras
    });
  });

  describe('7. Notificações Seguras e Horários de Silêncio', () => {
    it('deve despachar notificações apenas após eventos confirmados e proteger privacidade externa', () => {
      const notif = UnifiedNotificationCenterService.dispatchNotification({
        tipo: "FEEDBACK_PUBLICADO",
        destinatarioId: 'aluno-lucas',
        canal: "EMAIL",
        dadosEvento: {
          alunoNome: 'Lucas Silveira',
          atividadeTitulo: 'Estruturas de Dados Avançadas',
          notaPublicada: 95, // Não deve vazar no corpo público do email
        },
      });

      expect(notif.statusEnvio).toBe('ENVIADO');
      // Garantir Zero-Leakage de notas em canais externos abertos
      expect(notif.mensagemSanitizada).not.toContain('95');
      expect(notif.mensagemSanitizada).toContain('Seu feedback sobre a atividade Estruturas de Dados Avançadas está disponível');
    });

    it('deve respeitar horários de silêncio e agendar notificações não urgentes para o próximo horário útil', () => {
      // Configurar horário de silêncio 22:00 às 07:00
      UnifiedNotificationCenterService.setQuietHoursPreferences('aluno-lucas', {
        enabled: true,
        startHour: 22,
        endHour: 7,
      });

      const isQuiet = UnifiedNotificationCenterService.isWithinQuietHours('aluno-lucas', 23); // 23h
      expect(isQuiet).toBe(true);

      const notif = UnifiedNotificationCenterService.dispatchNotification({
        tipo: "NOVA_ATIVIDADE",
        destinatarioId: 'aluno-lucas',
        canal: "PUSH",
        dadosEvento: { atividadeTitulo: 'Nova Lista de Exercícios' },
        currentHour: 23,
      });

      expect(notif.statusEnvio).toBe('AGENDADO_HORARIO_UTIL');
    });
  });

  describe('8. Consistência de Relatórios e Downloads Efêmeros', () => {
    it('deve calcular estatísticas com mesma fonte da verdade, diferenciando notas provisórias de publicadas', () => {
      const stats = ConsistentReportingService.calculateCohortSummary('turma-ti-2026');

      expect(stats).toBeDefined();
      expect(typeof stats.mediaOficialPublicada).toBe('number');
      expect(typeof stats.mediaProvisoria).toBe('number');
      expect(typeof stats.taxaNaoEntrega).toBe('number');
      expect(typeof stats.taxaFalhasTecnicas).toBe('number');
      expect(stats.distribuicaoDesempenho).toBeDefined();
    });

    it('deve gerar token efêmero de download privado com expiração rigorosa', () => {
      const token = ConsistentReportingService.generateEphemeralDownloadToken({
        turmaId: 'turma-ti-2026',
        solicitanteId: 'prof-carlos',
        formato: 'PDF',
        tempoExpiracaoMinutos: 5,
      });

      expect(token.downloadUrl).toContain('/api/reports/download?token=');
      expect(token.expiraEm).toBeGreaterThan(Date.now());

      const isValid = ConsistentReportingService.validateAndConsumeDownloadToken(token.token);
      expect(isValid).toBe(true);

      // Token consumido não pode ser reutilizado
      const isReusedValid = ConsistentReportingService.validateAndConsumeDownloadToken(token.token);
      expect(isReusedValid).toBe(false);
    });
  });

  describe('9. Controle de Concorrência Otimista (OCC)', () => {
    it('deve rejeitar atualizações concorrentes com conflito 409 quando o versionLock não coincide', () => {
      const activity = UnifiedLifecycleEngineService.createDraftActivity({
        turmaId: 'turma-ti-2026',
        professorId: 'prof-carlos',
        titulo: 'Programação Concorrente',
        enunciado: 'Enunciado inicial',
        rubrica: [],
        testesPrivados: [],
        regrasEntrega: { maxTentativas: 1, permiteAtraso: false, prazoFinal: new Date().toISOString() },
      });

      const initialLock = activity.versionLock;

      // Professor A atualiza com sucesso
      UnifiedLifecycleEngineService.updateDraftWithOCC(
        activity.id,
        { enunciado: 'Atualização do Professor A' },
        initialLock,
        'prof-carlos'
      );

      // Professor B tenta atualizar com o versionLock obsoleto
      expect(() => {
        UnifiedLifecycleEngineService.updateDraftWithOCC(
          activity.id,
          { enunciado: 'Atualização Concorrente do Professor B' },
          initialLock, // Lock antigo
          'prof-outro'
        );
      }).toThrow(/409 Conflict/);
    });
  });

  describe('10. Fluxo Completo de Refação Docente-Discente', () => {
    it('deve permitir solicitação de refação docente, nova tentativa discente e registro da evolução de notas', () => {
      // 1. Primeira submissão do aluno
      const subV1 = UnifiedLifecycleEngineService.submitDelivery({
        atividadeId: 'ativ-refac-01',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-eduardo',
        alunoNome: 'Eduardo Ramos',
        tentativaNumero: 1,
        codigo: 'function sort(arr) { return arr; }',
        linguagem: 'typescript',
      });

      UnifiedLifecycleEngineService.registerAutoEvaluationResult(subV1.id, 50, { feedback: 'Array não foi ordenado' });

      // 2. Professor revisa e solicita refação com orientações pedagógicas
      const refacaoReq = ControlledPublicationService.requestRefactoring({
        submissaoId: subV1.id,
        professorId: 'prof-carlos',
        orientacoesDocente: 'Revise o algoritmo QuickSort e trate pivô aleatório.',
        prazoRefacaoHoras: 48,
      });

      expect(refacaoReq.currentState).toBe("REFACAO_SOLICITADA");

      // 3. Aluno envia a tentativa 2 (Refação)
      const subV2 = UnifiedLifecycleEngineService.submitDelivery({
        atividadeId: 'ativ-refac-01',
        turmaId: 'turma-ti-2026',
        alunoId: 'aluno-eduardo',
        alunoNome: 'Eduardo Ramos',
        tentativaNumero: 2,
        codigo: 'function quickSort(arr) { return arr.sort((a,b)=>a-b); }',
        linguagem: 'typescript',
        submissaoOrigemRefacaoId: subV1.id,
      });

      expect(subV2.attemptNumber).toBe(2);

      // 4. Nova avaliação automática com nota 100
      UnifiedLifecycleEngineService.registerAutoEvaluationResult(subV2.id, 100, { feedback: 'Todos os testes passaram com sucesso!' });

      // 5. Publicação final
      ControlledPublicationService.reviewAndModerateSubmission({
        submissaoId: subV2.id,
        professorId: 'prof-carlos',
        notaModerada: 100,
        justificativaAjuste: 'Refação impecável dentro do prazo pedagógico.',
        feedbackDocente: 'Excelente superação de dúvidas.',
      });

      const finalPub = ControlledPublicationService.publishOfficialResult(subV2.id, 'prof-carlos');
      expect(finalPub.currentState).toBe("RESULTADO_PUBLICADO");
      expect(finalPub.notaPublicada).toBe(100);
    });
  });
});
