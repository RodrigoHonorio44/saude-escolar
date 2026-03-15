import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAuditoriaData } from '../../hooks/useAuditoriaData'; 
import { 
  Loader2, RefreshCw, Activity, Brain, HeartPulse, 
  ShieldAlert, FileText, Users, Utensils, Baby, UserMinus 
} from 'lucide-react';

const DashboardAuditoria = () => {
  const { user } = useAuth();
  // Puxando as coleções completas do hook RS
  const { atendimentos = [], alunos = [], questionarios = [], loading } = useAuditoriaData(user);
  const [abaAtiva, setAbaAtiva] = useState('geral');

  // 📊 MOTOR DE AUDITORIA CROSS-DATA (MULTI-COLEÇÃO)
  const grupos = useMemo(() => {
    if (loading && !alunos.length) return null;

    const listas = {
      gestantes: [],
      soMae: [],
      nutri: [],
      pcd: [],
      totalAlunos: alunos.length,
      totalAtendimentos: atendimentos.length
    };

    // Indexação rápida de questionários por alunoId para não pesar o loop
    const mapaQuest = new Map();
    questionarios.forEach(q => mapaQuest.set(q.alunoId, q));

    alunos.forEach(aluno => {
      const q = mapaQuest.get(aluno.id);
      
      // Normalização para busca (Lowercase RS Standard)
      const busca = `
        ${aluno.diagnostico || ''} 
        ${aluno.observacoes || ''} 
        ${q?.anamnese || ''} 
        ${q?.saude?.detalhes || ''} 
        ${q?.saude?.cids?.join(' ') || ''}
      `.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // 1. GESTANTES (Checa aluno e questionário)
      if (['gravida', 'gestante', 'gestacao', 'pre-natal'].some(t => busca.includes(t))) {
        listas.gestantes.push(aluno);
      }

      // 2. FILTRO SÓ MÃE (Exclusivo da coleção Alunos)
      const paiLimpo = (aluno.pai || "").toLowerCase();
      const semPai = !aluno.pai || paiLimpo.includes("nao declarado") || paiLimpo === "n/d" || paiLimpo.trim() === "";
      if (aluno.mae && semPai) {
        listas.soMae.push(aluno);
      }

      // 3. NUTRIÇÃO (IMC do questionário + termos de risco)
      const imc = parseFloat(q?.imc || aluno.imc || 0);
      const precisaNutri = imc > 30 || (imc > 0 && imc < 18.5) || 
                           ['nutri', 'obesidade', 'seletividade', 'alimentar', 'baixo peso'].some(t => busca.includes(t));
      if (precisaNutri) {
        listas.nutri.push({ ...aluno, imcRef: imc });
      }

      // 4. PCD / NEURO
      if (['pcd', 'deficiente', 'tea', 'autismo', 'cadeirante', 'down', 'neuro'].some(t => busca.includes(t))) {
        listas.pcd.push(aluno);
      }
    });

    return listas;
  }, [atendimentos, alunos, questionarios, loading]);

  if (loading && !grupos) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black uppercase italic tracking-[0.3em] text-slate-400">Cruzando Coleções...</p>
      </div>
    );
  }

  if (!grupos) return null;

  const RenderLista = ({ titulo, dados, cor, tipo }) => (
    <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${cor}`}>{titulo} ({dados.length})</h3>
      </div>
      <div className="overflow-hidden border border-slate-100 rounded-[30px] bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Aluno</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Turma</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">
                {tipo === 'nutri' ? 'Índice IMC' : 'Info Detectada'}
              </th>
            </tr>
          </thead>
          <tbody>
            {dados.length > 0 ? dados.map((aluno, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-[11px] font-bold text-slate-700 uppercase">{aluno.alunoNome}</td>
                <td className="px-6 py-4 text-[11px] font-medium text-slate-500 uppercase">{aluno.turma || '---'}</td>
                <td className="px-6 py-4 text-[10px] text-slate-400 font-bold italic uppercase">
                  {tipo === 'nutri' ? (aluno.imcRef || 'Avaliar') : (aluno.diagnostico || 'Ver Prontuário')}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-slate-300 text-[10px] font-black uppercase italic tracking-widest">Nenhum dado encontrado nas coleções</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-0 space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="border-b border-slate-500/10 pb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-[1000] italic tracking-tighter uppercase text-slate-900 leading-none">
            Auditoria<span className="text-blue-600"></span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 italic">
            {user?.unidade || 'Unidade Local'} — Inteligência Cross-Data
          </p>
        </div>
        
        <div className="flex items-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-xl">
            <FileText size={16} /> Imprimir Listagem
          </button>
          <button onClick={() => window.location.reload()} className="p-3 bg-slate-100 text-slate-400 rounded-2xl">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {[
          { id: 'geral', label: 'Dashboard', icon: <Activity size={14}/> },
          { id: 'gestante', label: 'Gestantes', icon: <Baby size={14}/> },
          { id: 'mae', label: 'Só Mãe', icon: <UserMinus size={14}/> },
          { id: 'nutri', label: 'Nutrição', icon: <Utensils size={14}/> },
          { id: 'pcd', label: 'PCD/Neuro', icon: <Brain size={14}/> },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              abaAtiva === aba.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {aba.icon} {aba.label}
          </button>
        ))}
      </div>

      {/* CARDS OU LISTAS */}
      {abaAtiva === 'geral' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Base Alunos</p>
             <p className="text-6xl font-[1000] italic text-slate-900 tracking-tighter leading-none">{grupos.totalAlunos}</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] shadow-sm">
             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2"><HeartPulse size={14}/> Gestantes</p>
             <p className="text-6xl font-[1000] italic text-rose-600 tracking-tighter leading-none">{grupos.gestantes.length}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 p-8 rounded-[40px] shadow-sm">
             <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Só Mãe</p>
             <p className="text-6xl font-[1000] italic text-purple-600 tracking-tighter leading-none">{grupos.soMae.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] shadow-sm">
             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Utensils size={14}/> Nutrição</p>
             <p className="text-6xl font-[1000] italic text-emerald-600 tracking-tighter leading-none">{grupos.nutri.length}</p>
          </div>
        </div>
      ) : (
        <>
          {abaAtiva === 'gestante' && <RenderLista titulo="Alunas em Gestação" dados={grupos.gestantes} cor="text-rose-500" />}
          {abaAtiva === 'mae' && <RenderLista titulo="Vínculo Monoparental (Só Mãe)" dados={grupos.soMae} cor="text-purple-500" />}
          {abaAtiva === 'nutri' && <RenderLista titulo="Encaminhamento Nutricional" dados={grupos.nutri} cor="text-emerald-500" tipo="nutri" />}
          {abaAtiva === 'pcd' && <RenderLista titulo="PCD e Neurodiversos" dados={grupos.pcd} cor="text-blue-500" />}
        </>
      )}

      {/* FOOTER */}
      <div className="bg-slate-900 p-8 rounded-[40px] relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
             Motor de Auditoria Ativo — Maricá {new Date().getFullYear()}
          </p>
          <p className="text-slate-400 text-sm mt-4 font-medium max-w-2xl uppercase text-[11px]">
            Dados consolidados de {grupos.totalAlunos} alunos e {questionarios.length} questionários de triagem.
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, aside, button, .print-hidden { display: none !important; }
          body { background: white !important; padding: 20px !important; }
          .rounded-[40px], .rounded-[30px] { border-radius: 10px !important; border: 1px solid #eee !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .bg-slate-900 { background-color: #000 !important; color: #fff !important; }
        }
      `}} />
    </div>
  );
};

export default DashboardAuditoria;