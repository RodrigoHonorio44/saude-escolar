import React, { useState } from 'react';
import { 
  Brain, Printer, Phone, ChevronDown, 
  Loader2, AlertTriangle, GraduationCap, Search,
  Ear, Eye, Accessibility, MessageSquare, Zap, Activity,
  Stethoscope, Smile, Heart, BookOpen, Clock, Users
} from 'lucide-react';
import useDashboardSaudeInclusiva from '../../hooks/useDashboardSaudeInclusiva';

const DashboardSaudeInclusiva = ({ user, setDadosParaEdicao, setActiveTab }) => {
  const [cardAberto, setCardAberto] = useState(null);

  const { 
    dadosFiltrados, 
    loading, 
    filtro, 
    setFiltro, 
    abaAtiva, 
    setAbaAtiva 
  } = useDashboardSaudeInclusiva(user);

  // Mapeamento de ícones para TODAS as categorias do Hook
  const iconesAbas = {
    todos: <Activity size={14} />,
    tea: <Brain size={14} />,
    tdah: <Zap size={14} />,
    locomocao: <Accessibility size={14} />,
    auditiva: <Ear size={14} />,
    visual: <Eye size={14} />,
    aprendizagem: <BookOpen size={14} />,
    linguagem: <MessageSquare size={14} />,
    intelectual: <Stethoscope size={14} />,
    comportamento: <Smile size={14} />,
    emocional: <Heart size={14} />,
    outros: <MessageSquare size={14} />
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="animate-spin mb-4 text-purple-600" size={40} />
        <p className="font-black uppercase italic text-[10px] tracking-widest text-purple-600">
          Sincronizando Saúde Inclusiva...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2">
            <Brain size={28} className="text-purple-600" /> Saúde Inclusiva
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest">
            Unidade: {user?.unidade || "Geral (Root)"}
          </p>
        </div>
        
        <div className="flex items-center gap-3 no-print">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="buscar pcd ou cid..."
              className="bg-white border-none rounded-2xl pl-11 pr-4 py-3 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-purple-500/20 w-full md:w-64"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-purple-700 transition-all active:scale-95">
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      {/* --- ABAS DE FILTRO --- */}
      <div className="no-print flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {Object.keys(iconesAbas).map(tab => (
            <button 
              key={tab}
              onClick={() => setAbaAtiva(tab)}
              className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase italic transition-all whitespace-nowrap flex items-center gap-2 ${
                abaAtiva === tab 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 -translate-y-0.5' 
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {iconesAbas[tab]} {tab}
            </button>
          ))}
      </div>

      {/* --- LISTAGEM --- */}
      <div className="grid grid-cols-1 gap-3">
        {dadosFiltrados.length > 0 ? (
          dadosFiltrados.map(aluno => (
            <div 
              key={aluno.id} 
              className={`bg-white rounded-[30px] border transition-all ${
                aluno.saude?.temAlergia === 'sim' ? 'border-red-200 shadow-red-50' : 'border-slate-100 shadow-sm'
              }`}
            >
              <div 
                onClick={() => setCardAberto(cardAberto === aluno.id ? null : aluno.id)} 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-[30px]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border uppercase ${
                    aluno.saude?.temAlergia === 'sim' 
                      ? 'bg-red-100 text-red-600 border-red-200' 
                      : 'bg-purple-50 text-purple-600 border-purple-100'
                  }`}>
                    {aluno.nome?.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-2">
                      {aluno.nome}
                      <span className="text-slate-300 font-medium normal-case text-[10px] ml-1">
                        ({aluno.idade || '--'} anos)
                      </span>
                    </h3>
                    
                    {/* INFO DE TURMA E PERÍODO (RAIZ DO FIREBASE) */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        CID: <span className="text-purple-500 font-black italic">{aluno.cidDescricao}</span>
                      </p>
                      <span className="text-slate-200">|</span>
                      <p className="text-[9px] font-black text-slate-600 uppercase italic flex items-center gap-1">
                        <Users size={10} className="text-slate-400" /> Turma {aluno.turma || '---'}
                      </p>
                      <span className="text-slate-200">•</span>
                      <p className="text-[9px] font-black text-slate-600 uppercase italic flex items-center gap-1">
                        <Clock size={10} className="text-slate-400" /> {aluno.turno || '---'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Badges de categoria */}
                    <div className="hidden lg:flex gap-1">
                      {aluno.categoriasSaude?.map(cat => (
                         cat !== 'outros' && (
                           <span key={cat} className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[7px] font-black uppercase italic">
                             {cat}
                           </span>
                         )
                      ))}
                    </div>

                    {aluno.saude?.acessibilidades?.includes("cadeirante") && <Accessibility size={16} className="text-slate-400" />}
                    {aluno.saude?.acessibilidades?.includes("surdo") && <Ear size={16} className="text-slate-400" />}
                    {aluno.saude?.acessibilidades?.includes("cego") && <Eye size={16} className="text-slate-400" />}
                    
                    {aluno.saude?.temAlergia === 'sim' && (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[8px] font-black uppercase italic flex items-center gap-1">
                        <AlertTriangle size={10} /> Alérgico
                      </span>
                    )}
                    <ChevronDown size={20} className={`text-slate-300 transition-transform ${cardAberto === aluno.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {cardAberto === aluno.id && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Diagnóstico Principal</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase italic">
                           {aluno.saude?.cids?.[0] || '---'} - {aluno.cidDescricao}
                        </p>
                      </div>

                      {/* Boxes Detalhados de Turma e Turno */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Turma</p>
                          <p className="text-[11px] font-black text-slate-800 uppercase italic">{aluno.turma || '---'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Período</p>
                          <p className="text-[11px] font-black text-slate-800 uppercase italic">{aluno.turno || '---'}</p>
                        </div>
                      </div>

                      {aluno.saude?.temAlergia === 'sim' && (
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="text-[8px] font-black text-red-500 uppercase mb-1 tracking-tighter">Atenção Médica / Alergia</p>
                          <p className="text-[11px] font-black text-red-600 uppercase italic">
                             {aluno.saude?.alergiasDesc || "Registrado no Prontuário"}
                          </p>
                        </div>
                      )}

                      {aluno.saude?.usaMedicamento === 'sim' && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <p className="text-[8px] font-black text-blue-500 uppercase mb-1 tracking-tighter">Medicação em Uso</p>
                          <p className="text-[11px] font-black text-blue-600 uppercase italic">
                             {aluno.saude?.medicamentoDesc || "Registrado no Prontuário"}
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Responsável ({aluno.contato1_parentesco})</p>
                          <p className="text-[11px] font-black text-slate-800 uppercase italic">
                            {aluno.contato1_nome || 'não informado'}
                          </p>
                        </div>
                        {aluno.contato1_telefone && (
                          <a href={`tel:${aluno.contato1_telefone}`} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors">
                            <Phone size={16} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button 
                        onClick={() => { 
                          if (setDadosParaEdicao) setDadosParaEdicao(aluno); 
                          if (setActiveTab) setActiveTab("pasta_digital"); 
                        }} 
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] italic hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <GraduationCap size={16} /> Prontuário Digital
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
            <Brain size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-300 font-black uppercase italic text-xs">Nenhum PCD encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSaudeInclusiva;