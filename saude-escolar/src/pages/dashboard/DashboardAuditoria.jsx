import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAuditoriaData } from '../../hooks/useAuditoriaData'; 
import { Loader2, RefreshCw, Activity, AlertTriangle, Brain, HeartPulse, ShieldAlert } from 'lucide-react';

const DashboardAuditoria = () => {
  const { user } = useAuth();
  
  // ⚡️ Hook econômico (Cache 5min)
  // Certifique-se que o hook retorne { atendimentos: [], alunos: [], questionarios: [], loading: boolean }
  const { atendimentos = [], alunos = [], questionarios = [], loading } = useAuditoriaData(user);

  // 📊 Lógica de Auditoria Populacional (Normalização RS)
  const stats = useMemo(() => {
    // Se estiver carregando e não houver dados, retorna zeros para evitar erro de undefined
    if (loading && !atendimentos.length && !alunos.length) return null;

    try {
        // Normalização Global (Caio Giromba Style: lowercase + sem acento)
        const baseSaude = [...alunos, ...questionarios].map(d => 
          JSON.stringify(d).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        );

        const check = (termos) => {
          return baseSaude.filter(d => 
            termos.some(t => {
              const termoClean = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return d.includes(termoClean);
            })
          ).length;
        };

        return {
          totalAtendimentos: atendimentos.length,
          alergias: check(['alergia', 'alergico', 'anafilatico', 'restricao']),
          pcd: check(['pcd', 'neuro', 'autismo', 'tea', 'down', 'asperger', 'deficiencia']),
          cronicos: check(['diabetes', 'hiperten', 'asma', 'pressao', 'cardiaco', 'epilep', 'bronquite']),
          totalProntuarios: alunos.length + questionarios.length
        };
    } catch (e) {
        console.error("Erro no processamento da auditoria:", e);
        return { totalAtendimentos: 0, alergias: 0, pcd: 0, cronicos: 0, totalProntuarios: 0 };
    }
  }, [atendimentos, alunos, questionarios, loading]);

  // TELA DE CARREGAMENTO (Protegida)
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 animate-pulse">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black uppercase italic tracking-[0.3em] text-slate-400 text-center">
          Sincronizando Auditoria RS...<br/>
          <span className="opacity-50 font-bold tracking-normal">(Aguardando resposta do Firebase)</span>
        </p>
      </div>
    );
  }

  // TELA DE ERRO (Caso o hook falhe e não traga dados)
  if (!stats) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <ShieldAlert size={40} className="mb-4 text-rose-500" />
            <p className="text-[10px] font-black uppercase italic tracking-widest">Nenhum dado encontrado para auditoria</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 text-[10px] font-bold uppercase underline">Tentar novamente</button>
        </div>
    );
  }

  const cards = [
    { label: 'Fluxo de Atendimentos', val: stats.totalAtendimentos, color: 'text-slate-900', icon: <Activity />, bg: 'bg-white' },
    { label: 'Riscos de Alergia', val: stats.alergias, color: 'text-rose-600', icon: <AlertTriangle />, bg: 'bg-rose-50' },
    { label: 'PCD / Neurodiversos', val: stats.pcd, color: 'text-blue-600', icon: <Brain />, bg: 'bg-blue-50' },
    { label: 'Monitoramento Crônico', val: stats.cronicos, color: 'text-emerald-600', icon: <HeartPulse />, bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-4 md:p-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="border-b border-slate-500/10 pb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-[1000] italic tracking-tighter uppercase text-slate-900 leading-none">
            Auditoria <span className="text-blue-600">Clínica</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">
            Análise Populacional — {user?.unidade || 'Unidade Local'} — MedSys 2026
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Base Ativa</p>
            <p className="text-xl font-black italic">#{stats.totalProntuarios}</p>
          </div>
          <button 
            onClick={() => { 
                localStorage.removeItem(`cache_auditoria_${user.unidadeid}`);
                localStorage.removeItem(`last_fetch_${user.unidadeid}`); 
                window.location.reload(); 
            }}
            className="p-3 bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
            title="Recarregar Dados"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* CARDS DE IMPACTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`${card.bg} border border-slate-200 p-8 rounded-[40px] flex flex-col justify-between h-52 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex justify-between items-start">
               <span className={`p-3 rounded-2xl shadow-sm border border-slate-50 ${card.color} bg-white`}>
                 {React.cloneElement(card.icon, { size: 24 })}
               </span>
            </div>
            <div>
              <p className={`${card.color} text-6xl font-[1000] italic leading-none tracking-tighter`}>{card.val}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase mt-4 tracking-widest">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER DE INTELIGÊNCIA */}
      <div className="bg-slate-900 p-8 rounded-[40px] relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Motor de Economia Ativo (Cache 5min)
            </p>
            <p className="text-slate-400 text-sm mt-4 font-medium leading-relaxed max-w-2xl">
              Análise baseada em <span className="text-white font-bold">{stats.totalAtendimentos} eventos</span> clínicos. 
              O sistema ignorou acentuação e capitalização (r s) para consolidar os grupos de risco com precisão cirúrgica.
            </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] text-white/[0.03] text-9xl font-black italic select-none lowercase">
          {user?.unidadeid?.substring(0,4) || 'root'}
        </div>
      </div>
    </div>
  );
};

export default DashboardAuditoria;