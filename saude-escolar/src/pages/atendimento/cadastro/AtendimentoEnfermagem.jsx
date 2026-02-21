import React, { useState } from 'react';
import { 
  ClipboardPlus, Clock, Hash, GraduationCap, Briefcase, 
  Home, Hospital, Search, Baby, UserCheck, Save, 
  Loader2, AlertTriangle, Activity, ArrowLeft 
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAtendimentoLogica } from '../../../hooks/useAtendimentoEnfermagem';

const AtendimentoEnfermagem = ({ user, onVoltar, onVerHistorico }) => {
  const {
    formData, updateField, loading, configUI, setConfigUI,
    sugestoes, mostrarSugestoes, setMostrarSugestoes, buscando,
    selecionarPaciente, salvarAtendimento, temCadastro, validarNomeCompleto
  } = useAtendimentoLogica(user);

  const [erroNome, setErroNome] = useState(false);

  // FORMATAÇÃO PADRÃO R S PARA EXIBIÇÃO
  const formatarExibicao = (valor) => {
    if (!valor) return '';
    return valor.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const lidarSubmit = async (e) => {
    e.preventDefault();
    const nomeValido = validarNomeCompleto(formData.nomePaciente);
    if (!nomeValido) {
      setErroNome(true);
      return;
    }
    await salvarAtendimento(e);
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden font-sans antialiased text-left">
      <Toaster position="top-right" />
      
      {/* HEADER DO SISTEMA */}
      <div className="bg-[#0A1629] p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><ClipboardPlus size={24} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              ficha de <span className="text-blue-500">atendimento</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">sistema de enfermagem escolar</p>
          </div>
        </div>
        <button onClick={onVoltar} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black transition-all border border-white/10 flex items-center gap-2 tracking-widest text-white">
          <ArrowLeft size={14} /> voltar
        </button>
      </div>

      <form onSubmit={lidarSubmit} className="p-8 md:p-12 space-y-10">
        
        {/* IDENTIFICADORES */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl border-2 border-blue-500/30 flex items-center gap-3">
            <Hash size={18} className="text-blue-400" />
            <span className="text-blue-400 font-black tracking-widest text-base italic tabular-nums">{formData.baenf}</span>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Clock size={18} className="text-slate-600" />
            <span className="text-slate-700 font-bold text-sm italic tabular-nums">início: {formData.horario}</span>
          </div>
        </div>

        {/* SELETORES DE PERFIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setConfigUI({...configUI, perfilPaciente: 'aluno'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.perfilPaciente === 'aluno' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
              <GraduationCap size={18} /> aluno
            </button>
            <button type="button" onClick={() => setConfigUI({...configUI, perfilPaciente: 'funcionario'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.perfilPaciente === 'funcionario' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
              <Briefcase size={18} /> funcionário
            </button>
          </div>
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setConfigUI({...configUI, tipoAtendimento: 'local'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.tipoAtendimento === 'local' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
              <Home size={18} /> local
            </button>
            <button type="button" onClick={() => setConfigUI({...configUI, tipoAtendimento: 'remocao'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.tipoAtendimento === 'remocao' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>
              <Hospital size={18} /> remoção
            </button>
          </div>
        </div>

        {/* DADOS DO PACIENTE */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="md:col-span-3 space-y-2 relative">
            <label className={`text-[10px] font-black uppercase ml-2 tracking-widest flex items-center gap-2 ${erroNome ? 'text-red-500' : 'text-slate-500'}`}>
              <Search size={12} className="text-blue-500"/> nome completo *
            </label>
            <input 
              type="text" required placeholder="ex: rodrigo honorio silva" 
              className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all ${erroNome ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-transparent focus:ring-blue-500'}`} 
              value={formatarExibicao(formData.nomePaciente)} 
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                updateField('nomePaciente', val);
                setErroNome(false);
                setMostrarSugestoes(true);
              }} 
            />
            {/* LISTA DE SUGESTÕES */}
            {mostrarSugestoes && sugestoes.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {sugestoes.map((p) => (
                  <div key={p.id} onClick={() => selecionarPaciente(p)} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex flex-col gap-1">
                    <p className="text-xs font-black text-slate-800 italic">{formatarExibicao(p.nome || p.nomePaciente)}</p>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 lowercase">
                      <span>{p.turma || p.cargo}</span> <span>{p.dataNascimento}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">nascimento</label>
            <input type="date" required className="w-full bg-blue-50 text-blue-900 rounded-2xl px-5 py-4 text-sm font-bold outline-none tabular-nums" value={formData.dataNascimento} onChange={(e) => updateField('dataNascimento', e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">idade</label>
            <input type="number" readOnly className="w-full bg-slate-100 text-blue-600 rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.idade} />
          </div>
        </div>

        {/* BIOMETRIA (ALISON 1.4) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-500 uppercase ml-2 tracking-widest block">temperatura *</label>
            <input type="number" step="0.1" required placeholder="00.0" className="w-full bg-red-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.temperatura} onChange={(e) => updateField('temperatura', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">peso (kg)</label>
            <input type="text" placeholder="00.0" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.peso} onChange={(e) => updateField('peso', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">altura (m)</label>
            <input type="text" placeholder="0.00" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.altura} onChange={(e) => updateField('altura', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest block">imc</label>
            <input type="text" readOnly className="w-full bg-blue-50 text-blue-600 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.imc} />
          </div>
        </div>

        {/* ATENDIMENTO UNITÁRIO */}
        <div className="pt-10 border-t border-slate-100">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest block">motivo principal *</label>
                <input type="text" required className="w-full bg-blue-50 border-none rounded-2xl px-5 py-4 text-sm font-bold lowercase" value={formData.motivoAtendimento} onChange={(e) => updateField('motivoAtendimento', e.target.value.toLowerCase())} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest block">procedimentos *</label>
                <input type="text" required className="w-full bg-blue-50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic" value={formData.procedimentos} onChange={(e) => updateField('procedimentos', e.target.value.toLowerCase())} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">observações detalhadas</label>
                <textarea rows="3" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic resize-none outline-none" placeholder="descreva o quadro clínico..." value={formData.observacoes} onChange={(e) => updateField('observacoes', e.target.value.toLowerCase())} />
              </div>
           </div>
        </div>

        {/* ASSINATURA E BOTÃO SALVAR */}
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-900 px-8 py-5 rounded-[25px] border-2 border-blue-500/20 w-full md:w-auto">
            <div className="bg-blue-600 p-2.5 rounded-xl"><UserCheck size={22} className="text-white" /></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">profissional responsável</span>
              <p className="text-white font-black text-lg italic leading-none">{formatarExibicao(user?.nome) || 'enfermeiro(a)'}</p>
              <span className="text-emerald-400 text-[10px] font-bold lowercase mt-1 italic">
                reg: {user?.registroProfissional || 'não informado'}
              </span>
            </div>
          </div>
          
          <button 
            type="submit" disabled={loading} 
            className={`w-full md:w-auto px-12 py-6 rounded-[25px] font-black uppercase italic tracking-widest transition-all flex items-center justify-center gap-4 shadow-2xl ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} /> <span>finalizar atendimento</span></>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AtendimentoEnfermagem;