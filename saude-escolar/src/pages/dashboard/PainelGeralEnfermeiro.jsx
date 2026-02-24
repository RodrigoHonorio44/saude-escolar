import React from 'react';
import { 
  Users, CheckCircle2, Activity, Clock 
} from 'lucide-react';

const PainelGeralEnfermeiro = ({ metricas, visaoMensal, setVisaoMensal, darkMode }) => {
  
  // ✅ BLINDAGEM CONTRA UNDEFINED
  const m = metricas || {
    totalAlunos: 0,
    totalFuncionarios: 0,
    atendimentosDia: 0,
    atendimentosMes: 0,
    pendentes: 0,
    tempoMedio: 0,
    tempoMedioMes: 0
  };

  // ✅ FUNÇÃO PARA PEGAR OS VALORES DAS MÉTRICAS (DIA E MÊS)
  const getCardValue = (cardId) => {
    switch (cardId) {
      case 'media':
        // Se visão mensal ativa, mostra média do mês, senão a de hoje
        return visaoMensal ? (m.tempoMedioMes || 0) : (m.tempoMedio || 0);
      case 'pendentes':
        return m.pendentes || 0;
      case 'total':
        // Pega atendimentos reais da unidade logada
        return visaoMensal ? (m.atendimentosMes || 0) : (m.atendimentosDia || 0);
      case 'base':
        // Exibe "Total de Alunos / Total de Funcionários" da unidade
        return `${m.totalAlunos || 0}/${m.totalFuncionarios || 0}`;
      default:
        return "0";
    }
  };

  const cardsKpi = [
    { 
      id: "media",
      icon: <Clock className="text-orange-500" />, 
      label: "Média", 
      val: getCardValue('media'), 
      unit: "MIN", 
      sub: visaoMensal ? "Mês" : "Hoje",
      clicavel: true 
    },
    { 
      id: "pendentes",
      icon: <Activity className={(m.pendentes > 0) ? "text-orange-500 animate-pulse" : "text-slate-400"} />, 
      label: "Pendentes", 
      val: getCardValue('pendentes'), 
      sub: "Aguardando",
      clicavel: false 
    },
    { 
      id: "total",
      icon: <CheckCircle2 className="text-emerald-500" />, 
      label: "Total Atend.", 
      val: getCardValue('total'), 
      sub: visaoMensal ? "Mês" : "Hoje",
      clicavel: true 
    },
    { 
      id: "base",
      icon: <Users className="text-blue-500" />, 
      label: "Base", 
      val: getCardValue('base'), 
      sub: "Alunos/Func",
      clicavel: false 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
      {cardsKpi.map((card) => (
        <div 
          key={card.id} 
          onClick={card.clicavel ? () => setVisaoMensal(!visaoMensal) : undefined} 
          className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] ${
            card.clicavel ? "cursor-pointer" : "cursor-default"
          } ${
            darkMode 
            ? "bg-white/5 border-white/10 shadow-2xl" 
            : "bg-white border-slate-100 shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-2xl bg-slate-50/50 dark:bg-white/5">
              {card.icon}
            </div>
            {card.clicavel && (
               <span className="text-[8px] font-black bg-blue-500 text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-blue-500/20">
                 {visaoMensal ? "Ver Hoje" : "Ver Mês"}
               </span>
            )}
          </div>
          
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-[1000] italic leading-none tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}>
                {card.val}
              </span>
              {card.unit && (
                <span className="text-xs font-black text-slate-400 italic uppercase">
                  {card.unit}
                </span>
              )}
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">
              {card.label} <span className={card.clicavel ? "text-blue-600 font-bold" : ""}>{card.sub}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PainelGeralEnfermeiro;