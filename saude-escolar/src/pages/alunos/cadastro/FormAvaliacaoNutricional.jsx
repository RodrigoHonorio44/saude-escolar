import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { prepararParaBanco } from '../../utils/formatters'; // SUA REGRA R S
import { Save, Scale, Ruler, User, Activity, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FormAvaliacaoNutricional = ({ unidadeId, unidadeNome }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeAluno: '',
    etnia: '',
    peso: '',
    altura: '',
    turma: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // CÁLCULO DE IMC PARA ORIENTAÇÃO RÁPIDA NA TELA
  const calcularIMC = () => {
    if (!formData.peso || !formData.altura) return null;
    const p = parseFloat(formData.peso);
    const a = parseFloat(formData.altura);
    if (a <= 0) return null;
    return (p / (a * a)).toFixed(2);
  };

  const getStatusIMC = (imc) => {
    if (!imc) return null;
    if (imc < 18.5) return { label: 'BAIXO DO PESO', color: 'text-amber-500' };
    if (imc < 25) return { label: 'PESO NORMAL', color: 'text-emerald-500' };
    if (imc < 30) return { label: 'SOBREPESO', color: 'text-orange-500' };
    return { label: 'OBESIDADE', color: 'text-rose-500' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const imcAtual = calcularIMC();

    try {
      // REGRA RODHON SYSTEM: TUDO EM MINÚSCULO PARA O BANCO
      const dadosTratados = prepararParaBanco({
        ...formData,
        imc: imcAtual,
        unidadeId,
        unidadeNome,
        tipo: 'avaliacao_nutricional',
        dataAvaliacao: new Date().toISOString()
      });

      await addDoc(collection(db, "avaliacoes_nutricionais"), dadosTratados);
      
      toast.success("AVALIAÇÃO SALVA COM SUCESSO!");
      setFormData({ nomeAluno: '', etnia: '', peso: '', altura: '', turma: '' });
    } catch (error) {
      toast.error("ERRO AO SALVAR DADOS");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:border-blue-500 transition-all text-slate-700 shadow-sm";

  const imc = calcularIMC();
  const status = getStatusIMC(imc);

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-[45px] shadow-2xl border border-slate-100">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">AVALIAÇÃO ANTROPOMÉTRICA</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">RODHON SYSTEM • MONITORAMENTO NUTRICIONAL</p>
        </div>
        <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
          <Activity size={32} />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* DADOS DO ALUNO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">NOME COMPLETO DO ALUNO</label>
            <input name="nomeAluno" value={formData.nomeAluno} onChange={handleChange} required className={inputStyle} placeholder="NOME DO ALUNO" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">TURMA</label>
            <input name="turma" value={formData.turma} onChange={handleChange} required className={inputStyle} placeholder="EX: 8º ANO C" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">ETNIA</label>
            <select name="etnia" value={formData.etnia} onChange={handleChange} required className={inputStyle}>
              <option value="">SELECIONE</option>
              <option value="branca">BRANCA</option>
              <option value="preta">PRETA</option>
              <option value="parda">PARDA</option>
              <option value="amarela">AMARELA</option>
              <option value="indigena">INDÍGENA</option>
            </select>
          </div>
        </div>

        {/* MEDIDAS FÍSICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[35px] border border-slate-100 relative overflow-hidden">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
              <Scale size={16} /> PESO ATUAL (KG)
            </label>
            <input name="peso" type="number" step="0.1" value={formData.peso} onChange={handleChange} required className={inputStyle} placeholder="EX: 65.5" />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
              <Ruler size={16} /> ALTURA (METROS)
            </label>
            <input name="altura" type="number" step="0.01" value={formData.altura} onChange={handleChange} required className={inputStyle} placeholder="EX: 1.75" />
          </div>

          {/* PAINEL DE RESULTADO EM TEMPO REAL */}
          {imc && (
            <div className="col-span-full mt-4 p-6 bg-white rounded-3xl border border-blue-100 flex items-center justify-between animate-in zoom-in-95 duration-300">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RESULTADO DO IMC</p>
                <p className="text-3xl font-black text-slate-900">{imc}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black uppercase tracking-tighter ${status.color}`}>
                  {status.label}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Sugerido p/ Nutricionista</p>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-[25px] font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/10"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          REGISTRAR E RECOMENDAR
        </button>
      </form>
    </div>
  );
};

export default FormAvaliacaoNutricional;