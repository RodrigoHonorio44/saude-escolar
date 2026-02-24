import React from 'react';
import { 
  Briefcase, Save, Loader2, X, ArrowLeft, Search, Eraser,
  Ruler, Weight, Fingerprint, User, Activity, CheckCircle2, AlertCircle, Baby, CalendarDays, Stethoscope 
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useFormCadastroFuncionario } from '../../../hooks/useFormCadastroFuncionario';

const FormCadastroFuncionario = ({ onVoltar, dadosEdicao, onSucesso, usuarioLogado, modoPastaDigital = !!dadosEdicao }) => {
  const user = usuarioLogado;
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  const { 
    register, handleSubmit, isSubmitting, setValue, watchValues, 
    buscandoDados, paraExibicao, realizarBuscaManual, limparTudo, statusCadastro 
  } = useFormCadastroFuncionario(dadosEdicao, modoPastaDigital, onSucesso, onVoltar, user);

  // MÁSCARA DE CPF E TELEFONE
  const handleInputChange = (e, field) => {
    let v = e.target.value.replace(/\D/g, "");
    if (field === 'cpf') {
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2")
           .replace(/(\d{3})(\d)/, "$1.$2")
           .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else if (field === 'contato') {
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
      if (v.length > 10) v = `${v.substring(0, 10)}-${v.substring(10)}`;
    }
    setValue(field, v);
  };

  const getStatusIMC = (peso, altura) => {
    if (!peso || !altura || altura <= 0) return null;
    const imc = (parseFloat(peso) / (parseFloat(altura) * parseFloat(altura))).toFixed(2);
    if (imc < 18.5) return { label: 'Baixo Peso', color: 'text-amber-500' };
    if (imc < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-orange-500' };
    return { label: 'Obesidade', color: 'text-rose-500' };
  };

  const infoIMC = getStatusIMC(watchValues.peso, watchValues.altura);
  const inputStyle = "w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all bg-slate-50 focus:border-slate-900 focus:bg-white";
  
  const mostrarOpcaoGestante = watchValues.sexo === "mulher-cis" || watchValues.sexo === "mulher-trans";
  const eGestante = watchValues.gestante === "sim";

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 text-left">
      <Toaster position="top-center" />
      
      {/* HEADER PERSONALIZADO */}
      <div className="flex items-center justify-between mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              Staff: {modoPastaDigital ? 'Edição' : 'Novo Registro'}
            </h2>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              UNIDADE: {user?.unidade?.toUpperCase() || "CARREGANDO..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={limparTudo} className="flex items-center gap-2 px-4 py-2 text-rose-500 font-black text-[10px] hover:bg-rose-50 rounded-xl transition-all">
            <Eraser size={18} /> LIMPAR TUDO
          </button>
          <button type="button" onClick={onVoltar} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* BARRA DE BUSCA RESTRITA À UNIDADE */}
      {!modoPastaDigital && (
        <div className="mb-8 p-6 bg-slate-900 rounded-[30px] shadow-xl ring-4 ring-slate-100">
          <p className="text-[10px] font-black text-slate-400 mb-4 tracking-widest uppercase italic text-left">
            Consultar base de dados da unidade:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                value={watchValues.nome || ""}
                onChange={(e) => setValue("nome", paraExibicao(e.target.value))}
                placeholder="NOME COMPLETO" 
                className="w-full bg-slate-800 border-none text-white rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-4 relative">
              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                value={watchValues.cpf || ""}
                onChange={(e) => handleInputChange(e, 'cpf')}
                placeholder="CPF PARA BUSCA" 
                className="w-full bg-slate-800 border-none text-white rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                realizarBuscaManual();
              }}
              disabled={buscandoDados}
              className="md:col-span-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {buscandoDados ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
              PESQUISAR
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="md:col-span-2 space-y-2 text-left">
          <label className="text-[10px] font-black uppercase text-slate-400">Nome Completo</label>
          <input 
            {...register("nome", { required: true })} 
            onInput={(e) => e.target.value = paraExibicao(e.target.value)} 
            readOnly={modoPastaDigital && !isRoot}
            className={`${inputStyle} ${modoPastaDigital && !isRoot ? 'bg-slate-100' : ''}`} 
          />
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase">CPF</label>
          <input 
            {...register("cpf", { required: true })} 
            onChange={(e) => handleInputChange(e, 'cpf')}
            placeholder="000.000.000-00" 
            className={inputStyle} 
          />
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase">Cargo</label>
          <input {...register("cargo", { required: true })} placeholder="Ex: Professor" className={inputStyle} />
        </div>

        {/* BLOCO DE SAÚDE */}
        <div className="md:col-span-2 p-6 bg-blue-50/30 rounded-[30px] border-2 border-blue-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-blue-600 uppercase italic">Nascimento</label>
              <input type="date" {...register("dataNascimento", { required: true })} className="w-full p-3 rounded-xl border-none font-bold text-xs shadow-sm" />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-blue-600 uppercase italic">Idade</label>
              <input type="number" {...register("idade")} readOnly className="w-full p-3 rounded-xl border-none font-bold text-xs bg-white text-blue-700 shadow-sm outline-none" />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1"><Weight size={10}/> Peso (kg)</label>
              <input type="number" step="0.1" {...register("peso")} placeholder="00.0" className="w-full p-3 rounded-xl border-none font-bold text-xs shadow-sm" />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1"><Ruler size={10}/> Altura (m)</label>
              <input type="number" step="0.01" {...register("altura")} placeholder="0.00" className="w-full p-3 rounded-xl border-none font-bold text-xs shadow-sm" />
            </div>
          </div>

          {infoIMC && (
            <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Nutricional:</span>
              </div>
              <span className={`text-xs font-black uppercase italic ${infoIMC.color}`}>
                {infoIMC.label}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase">Etnia</label>
          <select {...register("etnia")} className={inputStyle}>
            <option value="">Selecione...</option>
            <option value="branca">Branca</option>
            <option value="preta">Preta</option>
            <option value="parda">Parda</option>
            <option value="amarela">Amarela</option>
            <option value="indigena">Indígena</option>
          </select>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase">Gênero</label>
          <select {...register("sexo")} className={inputStyle}>
            <option value="">Selecione...</option>
            <option value="homem-cis">Homem Cisgênero</option>
            <option value="mulher-cis">Mulher Cisgênero</option>
            <option value="homem-trans">Homem Transgênero</option>
            <option value="mulher-trans">Mulher Transgênero</option>
            <option value="ignorado">Não declarado</option>
          </select>
        </div>

        {/* SEÇÃO GESTANTE DINÂMICA */}
        {mostrarOpcaoGestante && (
          <div className="md:col-span-2 space-y-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-[25px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-xl text-white shadow-sm">
                  <Baby size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-rose-600 uppercase italic">Saúde da Mulher</p>
                  <p className="text-sm font-black text-rose-900">Está gestante?</p>
                </div>
              </div>
              <div className="flex gap-4">
                {['sim', 'nao'].map((op) => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      value={op} 
                      {...register("gestante")} 
                      className="w-5 h-5 accent-rose-500"
                    />
                    <span className={`text-xs font-black uppercase ${watchValues.gestante === op ? 'text-rose-600' : 'text-slate-400'}`}>
                      {op}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {eGestante && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-300">
                <div className="p-4 bg-white border-2 border-rose-100 rounded-2xl space-y-2 text-left">
                  <label className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-2">
                    <CalendarDays size={14}/> Semanas de Gestação
                  </label>
                  <input 
                    type="number" 
                    {...register("gestanteSemanas")} 
                    placeholder="Ex: 12" 
                    className="w-full p-3 bg-rose-50/50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                  />
                </div>
                <div className="p-4 bg-white border-2 border-rose-100 rounded-2xl space-y-2 text-left">
                  <label className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-2">
                    <Stethoscope size={14}/> Realiza Pré-natal?
                  </label>
                  <select 
                    {...register("gestantePreNatal")} 
                    className="w-full p-3 bg-rose-50/50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="sim">Sim, regularmente</option>
                    <option value="nao">Não realiza</option>
                    <option value="inicio">Iniciando agora</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <h3 className="text-[11px] font-black text-slate-500 uppercase italic flex items-center gap-2 text-left">
            <Activity size={14} className="text-blue-600"/> Contato de Emergência
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register("nomeContato1")} placeholder="Digite o Nome" className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" />
            <input 
              {...register("contato")} 
              value={watchValues.contato || ""} 
              onChange={(e) => handleInputChange(e, "contato")} 
              placeholder="Telefone (00) 00000-0000" 
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="md:col-span-2 py-5 rounded-[22px] font-black uppercase italic bg-slate-900 text-white hover:bg-blue-600 shadow-xl transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Save size={18} /> 
              {modoPastaDigital ? 'Atualizar Staff' : `Salvar no ${user?.unidade?.toUpperCase() || "Colégio"}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;