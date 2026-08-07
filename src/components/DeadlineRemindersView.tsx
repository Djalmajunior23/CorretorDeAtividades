import React from "react";
import { AlertCircle, Calendar, Clock } from "lucide-react";

export default function DeadlineRemindersView({ activities, questions }: { activities: any[], questions?: any[] }) {
  const now = new Date();
  
  const allItems = [
    ...activities.filter(a => a.deadline).map(a => ({ ...a, deadlineDate: new Date(a.deadline) })),
    ...(questions || []).filter(q => q.deadline).map(q => ({ ...q, deadlineDate: new Date(q.deadline), title: q.title }))
  ];

  const upcomingDeadlines = allItems
    .filter(a => a.deadlineDate > now)
    .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());

  return (
    <div className="bg-[#0f172a] border border-[#1e295b]/30 rounded-2xl p-6 mt-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-400" />
        Lembretes de Prazos
      </h3>
      
      {upcomingDeadlines.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum prazo pendente.</p>
      ) : (
        <div className="space-y-3">
          {upcomingDeadlines.map(act => {
            const isUrgent = (act.deadlineDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
            return (
              <div key={act.id} className={`flex items-center justify-between p-3 rounded-xl border ${isUrgent ? 'bg-red-900/10 border-red-500/30' : 'bg-[#030712] border-[#1e295b]/30'}`}>
                <div className="flex items-center gap-3">
                  {isUrgent && <AlertCircle className="w-4 h-4 text-red-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-200">{act.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {act.deadlineDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {isUrgent && <span className="text-[10px] font-bold text-red-500 uppercase">Urgente</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
