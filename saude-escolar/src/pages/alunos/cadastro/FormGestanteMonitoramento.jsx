import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { prepararParaBanco } from '../../utils/formatters'; // PADRÃO R S
import { Save, Baby, Calendar, ClipboardCheck, Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FormGestanteMonitoramento = ({ unidadeId, unidadeNome }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeAluna: '',
    turma: '',
    fazPreNatal: 'sim',
    semanasGestacao: '',
    localPreNatal: '',
    observacaoCoordenacao: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // REGRA OFICIAL: TUDO EM MINÚSCULO PARA O BANCO
      const dadosTratados = prepararParaBanco({
        ...formData,
        unidadeId,
        unidadeNome,
        tipo: 'monitoramento_gestante',
        dataAtualizacao: new Date().toISOString(),
        status: 'ativa'
      });

      await addDoc(collection(db, "monitoramento_alunas"), dadosTratados);
      
      toast.success("MONITORAMENTO ATUALIZADO!");
      setFormData({ nomeAluna: '', turma: '', fazPreNatal: 'sim', semanasGestacao: '', localPreNatal: '', observacaoCoordenacao: '' });
    } catch (error) {
      toast.error("ERRO AO SALVAR");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-xs font-bold uppercase outline-none focus:border-blue-500 transition-all text-slate-700";

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[40px] shadow-2xl border border-slate-100">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
            <Baby size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase italic">MONITORAMENTO DE ALUNA</h2>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acompanhamento Gestacional Escolar • 2026</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* IDENTIFICAÇÃO BÁSICA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">NOME DA ALUNA</label>
            <input name="nomeAluna" value={formData.nomeAluna} onChange={handleChange} required placeholder="NOME COMPLETO" className={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">TURMA / ANO</label>
            <input name="turma" value={formData.turma} onChange={handleChange} placeholder="EX: 9º ANO B" className={inputStyle} />
          </div>
        </div>

        {/* MONITORAMENTO SAÚDE */}
        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-5">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2">
                <ClipboardCheck size={14} /> ESTÁ FAZENDO PRÉ-NATAL?
              </label>
              <select name="fazPreNatal" value={formData.fazPreNatal} onChange={handleChange} className={inputStyle}>
                <option value="sim">SIM, ESTÁ EM DIA</option>
                <option value="nao">NÃO INICIOU / ATRASADO</option>
                <option value="nao_soube">NÃO SOUBE INFORMAR</option>
              </select>
            </div>

            <div className="w-full md:w-40 space-y-3">
              <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                <Activity size={14} /> SEMANAS
              </label>
              <input name="semanasGestacao" type="number" value={formData.semanasGestacao} onChange={handleChange} placeholder="EX: 24" className={inputStyle} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">LOCAL DO ATENDIMENTO (POSTO/CLÍNICA)</label>
            <input name="localPreNatal" value={formData.localPreNatal} onChange={handleChange} placeholder="EX: POSTO DE SAÚDE CENTRAL" className={inputStyle} />
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">OBSERVAÇÕES DE MONITORAMENTO</label>
          <textarea name="observacaoCoordenacao" value={formData.observacaoCoordenacao} onChange={handleChange} rows="3" placeholder="REGISTRE AQUI NECESSIDADES ESPECIAIS OU AVISOS..." className={`${inputStyle} normal-case`} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          ATUALIZAR DADOS DE MONITORAMENTO
        </button>
      </form>
    </div>
  );
};

export default FormGestanteMonitoramento;