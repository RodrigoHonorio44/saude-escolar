import React, { useState } from 'react';
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Save, Loader2, Activity, Printer,
  Users, Eye, Search, RefreshCw, Eraser, GraduationCap, Briefcase, Moon, Ear, Utensils
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useQuestionarioSaude } from '../../../hooks/useQuestionarioSaude';

const QuestionarioSaude = ({ onSucesso }) => {
  const {
    formData,
    loading,
    fetching,
    handleChange,
    handleContactChange,
    handleSubmit,
    buscarPorVinculoDireto,
    handleLimparTudo
  } = useQuestionarioSaude(onSucesso);

  const [configUI, setConfigUI] = useState({ perfilPaciente: 'aluno' });
  const [dadosBusca, setDadosBusca] = useState({ nome: '', dataNasc: '', identificador: '' });
  const [buscando, setBuscando] = useState(false);

  const modoEdicao = !!formData.id;

  const executarBusca = async () => {
    if (!dadosBusca.nome || !dadosBusca.dataNasc) {
      toast.error("NOME E DATA DE NASCIMENTO SÃO OBRIGATÓRIOS.");
      return;
    }
    setBuscando(true);
    await buscarPorVinculoDireto({
      nome: dadosBusca.nome.toLowerCase().trim(),
      dataNasc: dadosBusca.dataNasc,
      identificador: dadosBusca.identificador.toLowerCase().trim(),
      tipo: configUI.perfilPaciente
    });
    setBuscando(false);
  };

  const validarESalvar = (e) => {
    e.preventDefault();
    if (!formData.alunoNome?.trim().includes(" ")) {
      toast.error("INSIRA O NOME COMPLETO.");
      return;
    }
    handleSubmit(e);
  };

  const imprimirDocumento = () => {
    if (!formData.alunoNome) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>PRONTUÁRIO R S - ${formData.alunoNome}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
            .section { margin-bottom: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; }
            .title { font-weight: 900; text-transform: uppercase; color: #2563eb; font-size: 10px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .label { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 9px; }
            .value { font-weight: 600; text-transform: capitalize; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>FICHA MÉDICA R S</h1><p>PRONTUÁRIO COMPLETO</p></div>
          <div class="section">
            <div class="title">1. Identificação</div>
            <div class="grid">
              <div style="grid-column: span 3;"><span class="label">nome:</span> <div class="value">${formData.alunoNome}</div></div>
              <div><span class="label">idade:</span> <div class="value">${formData.idade || '---'}</div></div>
              <div><span class="label">sexo:</span> <div class="value">${formData.sexo || '---'}</div></div>
              <div><span class="label">turma:</span> <div class="value">${formData.turma || '---'}</div></div>
              <div><span class="label">cartão sus:</span> <div class="value">${formData.cartaoSus || '---'}</div></div>
              <div><span class="label">tipo sanguíneo:</span> <div class="value">${formData.tipoSanguineo || '---'}</div></div>
              <div><span class="label">etnia:</span> <div class="value">${formData.etnia || '---'}</div></div>
            </div>
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-[#FBFDFF] min-h-screen text-left">
      <Toaster position="top-right" />
      
      {/* CABEÇALHO E BUSCADOR */}
      <div className="max-w-6xl mx-auto bg-white border border-slate-100 p-6 md:p-10 rounded-[45px] shadow-sm mb-10 space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-5 rounded-3xl shadow-lg transition-all ${modoEdicao ? 'bg-indigo-600' : 'bg-blue-600'}`}>
              {modoEdicao ? <RefreshCw className="text-white" size={32} /> : <ClipboardCheck className="text-white" size={32} />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-1">
                {modoEdicao ? 'Atualizar' : 'Novo'} Prontuário <span className="text-blue-600">Completo</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sincronização R S - Saúde Escolar</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={imprimirDocumento} className="bg-white text-slate-700 border-2 border-slate-100 px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Printer size={16} /> Imprimir
            </button>
            <div className="bg-slate-50 p-1 rounded-2xl flex border border-slate-100">
              <button type="button" onClick={() => setConfigUI({perfilPaciente: 'aluno'})} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all flex items-center gap-2 ${configUI.perfilPaciente === 'aluno' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
                <GraduationCap size={14} /> aluno
              </button>
              <button type="button" onClick={() => setConfigUI({perfilPaciente: 'funcionario'})} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all flex items-center gap-2 ${configUI.perfilPaciente === 'funcionario' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                <Briefcase size={14} /> func.
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-6 border-t border-slate-50">
          <div className="md:col-span-3">
            <input type="text" className="input-premium bg-slate-50" placeholder="nome do paciente..." value={dadosBusca.nome} onChange={(e) => setDadosBusca({...dadosBusca, nome: e.target.value})} />
          </div>
          <div className="md:col-span-3">
            <input type="date" className="input-premium bg-slate-50 text-slate-500" value={dadosBusca.dataNasc} onChange={(e) => setDadosBusca({...dadosBusca, dataNasc: e.target.value})} />
          </div>
          <div className="md:col-span-3">
            <input type="text" className="input-premium bg-slate-50" placeholder={configUI.perfilPaciente === 'aluno' ? "nome da mãe..." : "matrícula/cpf..."} value={dadosBusca.identificador} onChange={(e) => setDadosBusca({...dadosBusca, identificador: e.target.value})} />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button type="button" onClick={executarBusca} className={`flex-1 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${configUI.perfilPaciente === 'aluno' ? 'bg-blue-600' : 'bg-indigo-600'} text-white`}>
              {buscando ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Pesquisar</>}
            </button>
            <button type="button" onClick={() => { setDadosBusca({nome: '', dataNasc: '', identificador: ''}); handleLimparTudo(); }} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300 hover:text-red-500 transition-all"><Eraser size={18} /></button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-6 rounded-[30px] shadow-2xl">
           <div className="text-left px-2">
              <p className="text-white text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Status do Registro</p>
              <h3 className="text-white text-xs font-bold uppercase italic">
                {formData.alunoNome ? `Pronto: ${formData.alunoNome}` : 'Aguardando preenchimento'}
              </h3>
           </div>
           <button onClick={validarESalvar} disabled={loading} className="w-full md:w-auto bg-white text-slate-900 px-12 py-5 rounded-[22px] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50">
             {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Finalizar e Salvar
           </button>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          <SectionCard icon={<Users size={18}/>} title="Identificação e Biometria">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <InputBlock label="Nome Completo">
                  <input className="input-premium" value={formData.alunoNome} onChange={(e) => handleChange('alunoNome', e.target.value)} placeholder="nome..." />
                </InputBlock>
              </div>
              <InputBlock label="Idade">
                <input className="input-premium bg-slate-50/50" value={formData.idade} readOnly />
              </InputBlock>
              <InputBlock label="Sexo">
                <input className="input-premium bg-slate-50/50" value={formData.sexo} readOnly />
              </InputBlock>
              <InputBlock label="Cartão SUS">
                <input className="input-premium" value={formData.cartaoSus} onChange={(e) => handleChange('cartaoSus', e.target.value)} placeholder="000 0000..." />
              </InputBlock>
              <InputBlock label="Tipo Sanguíneo">
                <select className="input-premium" value={formData.tipoSanguineo} onChange={(e) => handleChange('tipoSanguineo', e.target.value)}>
                  <option value="">selecione...</option>
                  {['a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                </select>
              </InputBlock>
              <InputBlock label="Etnia / Cor">
                <select className="input-premium" value={formData.etnia} onChange={(e) => handleChange('etnia', e.target.value)}>
                  <option value="">selecione...</option>
                  {['branca', 'preta', 'parda', 'amarela', 'indígena'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </InputBlock>
              <InputBlock label="Turma/Cargo">
                <input className="input-premium" value={formData.turma || formData.cargo} onChange={(e) => handleChange(configUI.perfilPaciente === 'aluno' ? 'turma' : 'cargo', e.target.value)} />
              </InputBlock>
              <div className="md:col-span-3 grid grid-cols-2 gap-2">
                <InputBlock label="Peso (kg)"><input className="input-premium" value={formData.peso} onChange={(e) => handleChange('peso', e.target.value)} /></InputBlock>
                <InputBlock label="Altura (m)"><input className="input-premium" value={formData.altura} onChange={(e) => handleChange('altura', e.target.value)} /></InputBlock>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Eye size={18}/>} title="Visão e Audição">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <ToggleInput label="Usa Óculos ou Lentes?" value={formData.problemaVisao} onChange={(v) => handleChange('problemaVisao', v)} />
                <ToggleInput label="Queixa de visão (não enxerga lousa)?" value={formData.queixaVisao} onChange={(v) => handleChange('queixaVisao', v)} />
                <InputBlock label="Data último Oculista">
                  <input type="date" className="input-premium !py-2" value={formData.dataOculista} onChange={(e) => handleChange('dataOculista', e.target.value)} />
                </InputBlock>
                <ToggleInput label="Precisa sentar na frente?" value={formData.sentarFrente} onChange={(v) => handleChange('sentarFrente', v)} />
              </div>
              <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <ToggleInput label="Usa Aparelho Auditivo?" value={formData.aparelhoAuditivo} onChange={(v) => handleChange('aparelhoAuditivo', v)} />
                <ToggleInput label="Queixa de audição (fala muito alto)?" value={formData.queixaAudicao} onChange={(v) => handleChange('queixaAudicao', v)} />
                <ToggleInput label="Teve muitas otites (infecções)?" value={formData.otitesFrequentes} onChange={(v) => handleChange('otitesFrequentes', v)} />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Utensils size={18}/>} title="Alimentação e Higiene">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ToggleInput label="Restrição Alimentar (Dieta)?" value={formData.restricaoAlimentar} onChange={(v) => handleChange('restricaoAlimentar', v)} />
              <ToggleInput label="Usa Aparelho Ortodôntico?" value={formData.aparelhoBucal} onChange={(v) => handleChange('aparelhoBucal', v)} />
              <InputBlock label="Autonomia Higiene">
                <select className="input-premium" value={formData.autonomiaHigiene} onChange={(e) => handleChange('autonomiaHigiene', e.target.value)}>
                  <option value="sozinho">independente</option>
                  <option value="auxilio">com supervisão</option>
                  <option value="total">dependente</option>
                </select>
              </InputBlock>
              <ToggleInput label="Seletividade Alimentar?" value={formData.seletividadeAlimentar} onChange={(v) => handleChange('seletividadeAlimentar', v)} />
            </div>
          </SectionCard>

          <SectionCard icon={<HeartPulse size={18}/>} title="Histórico Clínico">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ToggleInput label="Diabetes?" value={formData.diabetes} onChange={(v) => handleChange('diabetes', v)} />
              <ToggleInput label="Alergias (Alimento/Medicamento)?" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
              <ToggleInput label="Asma / Bronquite?" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
              <ToggleInput label="Desmaio ou Convulsão?" value={formData.desmaioConvulsao} onChange={(v) => handleChange('desmaioConvulsao', v)} />
              <ToggleInput label="Medicação Contínua?" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
              <ToggleInput label="TEA / TDAH / Neuro?" value={formData.diagnosticoNeuro} onChange={(v) => handleChange('diagnosticoNeuro', v)} />
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <SectionCard icon={<Moon size={18}/>} title="Rotina e Sono">
            <div className="space-y-4">
               <InputBlock label="Horas de Sono">
                <input type="number" className="input-premium" placeholder="ex: 8" value={formData.horasSono} onChange={(e) => handleChange('horasSono', e.target.value)} />
               </InputBlock>
               <ToggleInput label="Acorda à noite?" value={formData.despertaNoite} onChange={(v) => handleChange('despertaNoite', v)} />
               <ToggleInput label="Mudança Humo Recente?" value={formData.mudancaHumor} onChange={(v) => handleChange('mudancaHumor', v)} />
            </div>
          </SectionCard>

          <SectionCard icon={<ShieldCheck size={18}/>} title="Prevenção">
            <div className="space-y-4">
              <InputBlock label="Vacinas"><select className="input-premium" value={formData.vacinaStatus} onChange={(e) => handleChange('vacinaStatus', e.target.value)}><option value="atualizado">em dia</option><option value="atrasado">pendente</option></select></InputBlock>
              <InputBlock label="Atestado Físico"><select className="input-premium" value={formData.atestadoAtividadeFisica} onChange={(e) => handleChange('atestadoAtividadeFisica', e.target.value)}><option value="apto">apto</option><option value="inapto">inapto</option></select></InputBlock>
            </div>
          </SectionCard>

          <SectionCard icon={<AlertTriangle size={18}/>} title="Contatos Urgência">
            <div className="space-y-3">
              {formData.contatos?.map((c, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <input placeholder="nome do responsável" className="input-premium !py-1.5" value={c.nome} onChange={(e) => handleContactChange(i, 'nome', e.target.value)} />
                  <input placeholder="telefone" className="input-premium !py-1.5" value={c.telefone} onChange={(e) => handleContactChange(i, 'telefone', e.target.value)} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </form>

      <style>{`
        .input-premium { width: 100%; padding: 0.8rem 1rem; background-color: #fff; border-radius: 14px; font-weight: 700; font-size: 0.7rem; border: 2px solid #f1f5f9; outline: none; transition: all 0.3s; }
        .input-premium:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
      `}</style>
    </div>
  );
};

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative">
    <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
      <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">{icon}</div>
      <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest italic">{title}</h2>
    </div>
    {children}
  </div>
);

const InputBlock = ({ label, children }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const ToggleInput = ({ label, value, onChange }) => (
  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <span className="text-[9px] font-black text-slate-600 uppercase italic tracking-tighter leading-tight">{label}</span>
      <div className="flex gap-1 shrink-0">
        {['sim', 'não'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })} className={`px-3 py-1.5 rounded-xl text-[8px] font-black transition-all ${value?.possui === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}>{opt}</button>
        ))}
      </div>
    </div>
    {value?.possui === 'sim' && (
      <input className="input-premium mt-3 !py-2 !text-[9px] bg-slate-50" placeholder="especifique aqui..." value={value.detalhes || ""} 
        onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
    )}
  </div>
);

export default QuestionarioSaude;