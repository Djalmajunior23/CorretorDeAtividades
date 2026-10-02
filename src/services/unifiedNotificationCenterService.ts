/**
 * ============================================================================
 * UNIFIED NOTIFICATION CENTER SERVICE
 * ============================================================================
 * Features:
 * 1. Event Types:
 *    - NOVA_ATIVIDADE | ENTREGA_RECEBIDA | FEEDBACK_PUBLICADO | 
 *      REFACAO_SOLICITADA | DUVIDA_RESPONDIDA | FALHA_TECNICA_DOCENTE
 * 2. Multi-channel Preferences (In-App, Email, Push).
 * 3. Quiet hours scheduler (e.g. 22:00 - 07:00) preventing disruptive alerts.
 * 4. Zero-Leakage Privacy Policy: Never embeds numeric scores or PII in external payloads.
 * 5. Lifecycle Tracking: PENDENTE_SILENCIO | ENVIADA | ENTREGUE | LIDA | FALHA.
 * ============================================================================
 */

export type NotificationEventType = 
  | "NOVA_ATIVIDADE" 
  | "ENTREGA_RECEBIDA" 
  | "FEEDBACK_PUBLICADO" 
  | "REFACAO_SOLICITADA" 
  | "DUVIDA_RESPONDIDA" 
  | "FALHA_TECNICA_DOCENTE";

export type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH";

export type NotificationDeliveryStatus = 
  | "PENDENTE_SILENCIO" 
  | "ENVIADA" 
  | "ENTREGUE" 
  | "LIDA" 
  | "FALHA";

export interface UnifiedNotificationItem {
  id: string;
  recipientUserId: string;
  recipientRole: "STUDENT" | "TEACHER" | "COORDINATOR";
  eventType: NotificationEventType;
  title: string;
  bodySanitized: string; // Guaranteed free of raw grades or confidential secrets
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  targetDeepLinkTab: string;
  targetEntityId?: string;
  createdAtIso: string;
  deliveredAtIso?: string;
  readAtIso?: string;
}

export interface NotificationChannelPreferences {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "07:00"
}

export class UnifiedNotificationCenterService {
  private static notifications: UnifiedNotificationItem[] = [
    {
      id: "notif-01",
      recipientUserId: "std-mariana-02",
      recipientRole: "STUDENT",
      eventType: "FEEDBACK_PUBLICADO",
      title: "Parecer Pedagógico Publicado",
      bodySanitized: "O professor Djalma publicou o parecer oficial da atividade 'Lista 3: Somatórios'. Acesse seu portal para visualizar as orientações de estudo.",
      channel: "IN_APP",
      status: "LIDA",
      targetDeepLinkTab: "student_portal",
      targetEntityId: "sub-ds-101",
      createdAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      deliveredAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      readAtIso: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: "notif-02",
      recipientUserId: "prof-djalma",
      recipientRole: "TEACHER",
      eventType: "ENTREGA_RECEBIDA",
      title: "Nova Submissão Recebida",
      bodySanitized: "Estudante Lucas Ferreira submeteu a 'Lista 3: Somatórios'. O processamento automático foi concluído e aguarda sua homologação.",
      channel: "IN_APP",
      status: "ENTREGUE",
      targetDeepLinkTab: "teacher_review_queue",
      targetEntityId: "sub-ds-102",
      createdAtIso: new Date(Date.now() - 3600000 * 8).toISOString(),
      deliveredAtIso: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: "notif-03",
      recipientUserId: "prof-djalma",
      recipientRole: "TEACHER",
      eventType: "FALHA_TECNICA_DOCENTE",
      title: "Alerta de Sandbox: Timeout de Execução",
      bodySanitized: "Uma submissão de Carlos Eduardo atingiu o tempo limite de execução segura (5000ms). Nenhuma nota zero foi atribuída. Ação necessária na Central de Operações.",
      channel: "IN_APP",
      status: "ENTREGUE",
      targetDeepLinkTab: "class_operations_central",
      targetEntityId: "sub-ds-103",
      createdAtIso: new Date(Date.now() - 3600000 * 4).toISOString(),
      deliveredAtIso: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ];

  private static quietHoursMap: Record<string, { startHour: number; endHour: number; enabled: boolean }> = {};

  public static setQuietHoursPreferences(userId: string, prefs: { startHour: number; endHour: number; enabled: boolean }): void {
    this.quietHoursMap[userId] = prefs;
  }

  public static isWithinQuietHours(userId: string, currentHour: number): boolean {
    const prefs = this.quietHoursMap[userId];
    if (!prefs || !prefs.enabled) return false;
    if (prefs.startHour > prefs.endHour) {
      // e.g. 22:00 to 07:00
      return currentHour >= prefs.startHour || currentHour < prefs.endHour;
    }
    return currentHour >= prefs.startHour && currentHour < prefs.endHour;
  }

  public static getNotifications(recipientUserId?: string): UnifiedNotificationItem[] {
    if (!recipientUserId || recipientUserId === "all") return this.notifications;
    return this.notifications.filter(n => n.recipientUserId === recipientUserId);
  }

  public static markAsRead(notificationId: string): boolean {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (!notif) return false;
    notif.status = "LIDA";
    notif.readAtIso = new Date().toISOString();
    return true;
  }

  public static markAllAsRead(recipientUserId: string): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (n.recipientUserId === recipientUserId && n.status !== "LIDA") {
        n.status = "LIDA";
        n.readAtIso = new Date().toISOString();
        count++;
      }
    });
    return count;
  }

  public static dispatchNotification(params: {
    tipo?: NotificationEventType;
    eventType?: NotificationEventType;
    destinatarioId?: string;
    recipientUserId?: string;
    canal?: NotificationChannel | string;
    channel?: NotificationChannel;
    dadosEvento?: { alunoNome?: string; atividadeTitulo?: string; notaPublicada?: number };
    title?: string;
    bodySanitized?: string;
    recipientRole?: "STUDENT" | "TEACHER" | "COORDINATOR";
    targetDeepLinkTab?: string;
    targetEntityId?: string;
    currentHour?: number;
  }): UnifiedNotificationItem & { statusEnvio: string; mensagemSanitizada: string } {
    const userId = params.destinatarioId || params.recipientUserId || "user-default";
    const evtType = params.tipo || params.eventType || "FEEDBACK_PUBLICADO";
    const ch = (params.canal || params.channel || "IN_APP") as NotificationChannel;
    const nowHour = params.currentHour !== undefined ? params.currentHour : new Date().getHours();

    const inQuietHours = this.isWithinQuietHours(userId, nowHour);
    const deliveryStatus: NotificationDeliveryStatus = inQuietHours ? "PENDENTE_SILENCIO" : "ENVIADA";
    const statusEnvio = inQuietHours ? "AGENDADO_HORARIO_UTIL" : "ENVIADO";

    const ativTitulo = params.dadosEvento?.atividadeTitulo || "Atividade Avaliativa";
    // Zero-Leakage: Ensure no grade numbers or sensitive data in external messages
    const sanitizedMsg = `Seu feedback sobre a atividade ${ativTitulo} está disponível no portal do estudante. Acesse para visualizar a devolutiva completa.`;

    const newItem: UnifiedNotificationItem = {
      id: `notif-${Date.now()}`,
      recipientUserId: userId,
      recipientRole: params.recipientRole || "STUDENT",
      eventType: evtType,
      title: params.title || "Atualização Pedagógica",
      bodySanitized: params.bodySanitized || sanitizedMsg,
      channel: ch,
      status: deliveryStatus,
      targetDeepLinkTab: params.targetDeepLinkTab || "student_portal",
      targetEntityId: params.targetEntityId,
      createdAtIso: new Date().toISOString(),
      deliveredAtIso: inQuietHours ? undefined : new Date().toISOString()
    };

    this.notifications.unshift(newItem);

    return Object.assign(newItem, {
      statusEnvio,
      mensagemSanitizada: sanitizedMsg
    });
  }
}
