import React, { useState, useMemo } from "react";
import { 
  Search, Plus, Trash2, HeartPulse, AlertTriangle, 
  Accessibility, EyeOff, Ear, MessageSquareOff, Thermometer 
} from "lucide-react";

// ✅ DICIONÁRIO LOCAL RS (Econômico: Zero custo de leitura no Firebase)
const DICIONARIO_CID = {
  // 🧠 TEA — Transtornos do Espectro Autista
  "f84.0": "autismo infantil",
  "f84.1": "autismo atípico",
  "f84.5": "síndrome de asperger",
  "f84.8": "outros transtornos invasivos do desenvolvimento",
  "f84.9": "transtorno invasivo do desenvolvimento não especificado",
  "6a02": "transtorno do espectro do autismo (cid-11)",

  // ⚡ TDAH e Transtornos Hipercinéticos
  "f90.0": "tdah tipo desatento",
  "f90.1": "tdah tipo hiperativo/impulsivo",
  "f90.8": "outros transtornos hipercinéticos",
  "f90.9": "transtorno hipercinético não especificado",
  "6a05": "tdah (cid-11)",

  // 📚 Transtornos de Aprendizagem
  "f81.0": "transtorno específico de leitura (dislexia)",
  "f81.1": "transtorno da ortografia",
  "f81.2": "transtorno da matemática (discalculia)",
  "f81.3": "transtorno misto das habilidades escolares",
  "f81.9": "transtorno de aprendizagem não especificado",

  // 🗣️ Linguagem e Comunicação
  "f80.0": "transtorno da articulação da fala",
  "f80.1": "transtorno da linguagem expressiva",
  "f80.2": "transtorno da linguagem receptiva",
  "f80.8": "outros transtornos do desenvolvimento da fala",
  "f80.9": "transtorno de fala não especificado",

  // 🎯 Desenvolvimento Motor e Global
  "f82": "transtorno do desenvolvimento da coordenação",
  "f83": "transtornos mistos do desenvolvimento",
  "f88": "outros transtornos do desenvolvimento psicológico",
  "f89": "transtorno do desenvolvimento não especificado",

  // 😠 Comportamento e Conduta
  "f91.0": "transtorno de conduta familiar",
  "f91.1": "transtorno de conduta socializado",
  "f91.2": "transtorno de conduta não socializado",
  "f91.3": "transtorno opositor desafiante (tod)",
  "f92.0": "transtorno misto de conduta e emoções",

  // 😰 Emoções e Ansiedade Infantil
  "f93.0": "ansiedade de separação",
  "f93.1": "fobia social infantil",
  "f93.2": "ansiedade generalizada infantil",
  "f93.8": "outros transtornos emocionais da infância",
  "f93.9": "transtorno emocional infantil não especificado",

  // 🧠 Intelectual
  "f70": "deficiência intelectual leve",
  "f71": "deficiência intelectual moderada",
  "f72": "deficiência intelectual grave",
  "f73": "deficiência intelectual profunda",
  "f79": "deficiência intelectual não especificada",

  // ♿ Outros Frequentes em Escolas
  "g80": "paralisia cerebral",
  "q90": "síndrome de down",
  "h54": "cegueira ou baixa visão",
  "h90": "deficiência auditiva"
};

const FormSecaoSaudeCid = ({ formData, setFormData }) => {
  const [busca, setBusca] = useState("");

  // ✅ Opções de Acessibilidade (Seleção Múltipla)
  const OPCOES_ACESSIBILIDADE = [
    { id: 'cadeirante', label: 'Cadeirante', icon: <Accessibility size={18}/> },
    { id: 'muletas', label: 'Uso de Muletas', icon: <Accessibility size={18} className="rotate-45"/> },
    { id: 'cego', label: 'Def. Visual / Cego', icon: <EyeOff size={18}/> },
    { id: 'surdo', label: 'Def. Auditiva / Surdo', icon: <Ear size={18}/> },
    { id: 'mudo', label: 'Mudo / Não Verbal', icon: <MessageSquareOff size={18}/> },
    { id: 'intelectual', label: 'Def. Intelectual', icon: <HeartPulse size={18}/> },
  ];

  // ✅ Filtro de busca local
  const sugestoes = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (termo.length < 2) return [];
    return Object.entries(DICIONARIO_CID).filter(([cod, desc]) => 
      cod.includes(termo) || desc.includes(termo)
    );
  }, [busca]);

  // ✅ Helper para atualizar o estado aninhado 'saude' (Força Lowercase conforme RS)
  const updateSaude = (campo, valor) => {
    const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
    setFormData(prev => ({
      ...prev,
      saude: { ...prev.saude, [campo]: valorFormatado }
    }));
  };

  // ✅ Alternar seleção de acessibilidade (Múltiplas opções)
  const toggleAcessibilidade = (id) => {
    const atuais = formData.saude.acessibilidades || [];
    const novos = atuais.includes(id) 
      ? atuais.filter(item => item !== id) 
      : [...atuais, id];
    
    setFormData(prev => ({
      ...prev,
      saude: { ...prev.saude, acessibilidades: novos }
    }));
  };

  const adicionarCid = (cod) => {
    if (!formData.saude.cids.includes(cod)) {
      updateSaude('cids', [...formData.saude.cids, cod]);
    }
    setBusca("");
  };

  const removerCid = (cod) => {
    updateSaude('cids', formData.saude.cids.filter(c => c !== cod));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BLOCO DE DIAGNÓSTICOS (CID) --- */}
      <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><HeartPulse size={20}/></div>
          <h3 className="text-[11px] font-black uppercase italic tracking-widest text-slate-500">Condições Clínicas & CID-11</h3>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por Código ou Nome da Patologia..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-5 pl-14 rounded-3xl border-2 border-slate-50 bg-slate-50 font-bold text-xs uppercase outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner"
          />
          <Search className="absolute left-5 top-5 text-slate-300" size={22} />

          {/* Lista de Sugestões Flutuante */}
          {sugestoes.length > 0 && (
            <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-3xl overflow-hidden max-h-60 overflow-y-auto border-t-4 border-t-blue-500">
              {sugestoes.map(([cod, desc]) => (
                <button
                  key={cod}
                  type="button"
                  onClick={() => adicionarCid(cod)}
                  className="w-full flex items-center justify-between p-5 hover:bg-blue-50 text-left border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{cod}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase italic">{desc}</span>
                  </div>
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Plus size={16} /></div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags de CIDs Selecionados */}
        <div className="flex flex-wrap gap-3">
          {formData.saude.cids.length === 0 && (
            <p className="text-[10px] font-bold text-slate-300 uppercase italic ml-2">Nenhum CID selecionado até o momento.</p>
          )}
          {formData.saude.cids.map(cod => (
            <div key={cod} className="flex items-center gap-3 bg-slate-900 text-white pl-4 pr-2 py-2 rounded-2xl animate-in zoom-in duration-300 shadow-lg">
              <span className="text-[10px] font-black uppercase italic tracking-wider">{cod}</span>
              <button 
                type="button"
                onClick={() => removerCid(cod)}
                className="p-1.5 hover:bg-rose-500 rounded-xl transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- BLOCO DE ACESSIBILIDADE MÚLTIPLA (ATUALIZADO) --- */}
      <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Accessibility size={20}/></div>
          <h3 className="text-[11px] font-black uppercase italic tracking-widest text-slate-500">
            Acessibilidade e Condições de Saúde
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {OPCOES_ACESSIBILIDADE.map((opt) => {
            const ativo = formData.saude.acessibilidades?.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleAcessibilidade(opt.id)}
                className={`flex flex-col items-center justify-center p-5 rounded-[30px] border-2 transition-all gap-3 text-center ${
                  ativo 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl scale-95" 
                    : "bg-slate-50 border-slate-50 text-slate-400 hover:border-indigo-200"
                }`}
              >
                {opt.icon}
                <span className="text-[9px] font-black uppercase leading-tight tracking-tighter">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- BLOCO DE QUESTIONÁRIO ADICIONAL --- */}
      <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          
          {/* Alergias */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
              <AlertTriangle size={14} className="text-rose-500"/> Possui Alergias?
            </label>
            <div className="flex gap-3">
              {['sim', 'não'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateSaude('temAlergia', opt)}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase italic transition-all ${formData.saude.temAlergia === opt ? 'bg-rose-500 text-white shadow-xl shadow-rose-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {formData.saude.temAlergia === 'sim' && (
              <input
                type="text"
                placeholder="especifique as alergias..."
                value={formData.saude.alergiasDesc}
                onChange={(e) => updateSaude('alergiasDesc', e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-[11px] font-bold uppercase outline-none focus:border-rose-400 focus:bg-white transition-all shadow-inner"
              />
            )}
          </div>

          {/* Medicamentos */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
              <Thermometer size={14} className="text-blue-500"/> Medicação Contínua?
            </label>
            <div className="flex gap-3">
              {['sim', 'não'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateSaude('usaMedicamento', opt)}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase italic transition-all ${formData.saude.usaMedicamento === opt ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {formData.saude.usaMedicamento === 'sim' && (
              <input
                type="text"
                placeholder="nome, dosagem e horários..."
                value={formData.saude.medicamentoDesc}
                onChange={(e) => updateSaude('medicamentoDesc', e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-[11px] font-bold uppercase outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner"
              />
            )}
          </div>

          {/* Restrição Alimentar */}
          <div className="md:col-span-2 space-y-4">
            <label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">Restrição Alimentar / Dieta</label>
            <input
              type="text"
              placeholder="ex: intolerância à lactose, glúten..."
              value={formData.saude.restricaoAlimentar}
              onChange={(e) => updateSaude('restricaoAlimentar', e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-[11px] font-bold uppercase outline-none focus:border-emerald-400 focus:bg-white transition-all shadow-inner"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default FormSecaoSaudeCid;