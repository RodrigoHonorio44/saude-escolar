import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../../../config/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { Save, Loader2, ArrowLeft, Eraser, User, Activity, Phone, Baby, Scale, Ruler } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { 
  prepararParaBanco, 
  mascaraTelefone, 
  mascaraCEP,
  calcularIdade, 
  buscarEnderecoPeloCEP,
  gerarCarimboServidor 
} from '../../../utils/RegrasRodhon'; 

import FormSecaoSaudeCid from './FormSecaoSaudeCid';

const FormCadastroAluno = ({ onVoltar, dadosEdicao, alunoParaEditar, onSucesso, usuarioLogado }) => {
  
  const defaultValues = {
    nome: '', sexo: '', peso: '', altura: '',
    nomeMae: '', nomePai: '', semPaiDeclarado: false,
    matriculaInteligente: '', cartaoSus: '',
    dataNascimento: '', idade: '', turma: '', turno: 'manhã',
    isGestante: 'não', semanasGestacao: '', fazPreNatal: 'não',
    saude: {
      cids: [], temAlergia: "não", alergiasDesc: "", usaMedicamento: "não",
      medicamentoDesc: "", acessibilidade: "nenhuma", restricaoAlimentar: ""
    },
    contato1_nome: '', contato1_parentesco: '', contato1_telefone: '', 
    endereco_cep: '', endereco_rua: '', endereco_numero: '', endereco_bairro: '', 
    endereco_cidade: '', endereco_uf: ''
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    mode: "onChange", 
    defaultValues: (alunoParaEditar || dadosEdicao || defaultValues)
  });

  const watchDataNasc = watch("dataNascimento");
  const watchCep = watch("endereco_cep");
  const watchSaude = watch("saude");
  const watchSexo = watch("sexo");
  const watchIsGestante = watch("isGestante");
  const watchPeso = watch("peso");
  const watchAltura = watch("altura");

  const imcResult = (watchPeso && watchAltura && parseFloat(watchAltura) > 0) 
    ? (parseFloat(watchPeso) / (parseFloat(watchAltura) * parseFloat(watchAltura))).toFixed(2) 
    : null;

  useEffect(() => {
    if (watchDataNasc && watchDataNasc.length === 10) {
      const dataFormatada = watchDataNasc.split('-').reverse().join('/');
      setValue("idade", calcularIdade(dataFormatada));
    }
  }, [watchDataNasc, setValue]);

  useEffect(() => {
    const buscar = async () => {
      const res = await buscarEnderecoPeloCEP(watchCep || "");
      if (res) {
        setValue("endereco_rua", res.rua);
        setValue("endereco_bairro", res.bairro);
        setValue("endereco_cidade", res.cidade);
        setValue("endereco_uf", res.uf);
        toast.success("ENDEREÇO LOCALIZADO!");
      }
    };
    if (watchCep?.replace(/\D/g, "").length === 8) buscar();
  }, [watchCep, setValue]);

  const onSubmit = async (data) => {
    if (!usuarioLogado?.unidadeid) return toast.error("UNIDADE NÃO IDENTIFICADA!");
    
    const acaoSalvar = async () => {
      const dadosTratados = prepararParaBanco(data);
      const idUnico = `${dadosTratados.nome.replace(/\s+/g, '-')}_${data.dataNascimento.replace(/-/g, '')}`;
      
      const payload = {
        ...dadosTratados,
        imc: imcResult,
        unidadeid: prepararParaBanco(usuarioLogado.unidadeid),
        unidade: prepararParaBanco(usuarioLogado.unidade),
        escola: prepararParaBanco(usuarioLogado.escola),
        updatedAt: gerarCarimboServidor()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idUnico), payload, { merge: true });
      batch.set(doc(db, "cadastro_aluno", idUnico), payload, { merge: true });
      await batch.commit();
      
      if (onSucesso) onSucesso();
      onVoltar();
    };

    toast.promise(acaoSalvar(), { 
      loading: 'SALVANDO...', 
      success: 'SUCESSO!', 
      error: 'ERRO AO SALVAR.' 
    });
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <Toaster position="top-center" />
      
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 border border-slate-200 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-lg text-white font-bold italic">RS</div>
             <div>
                <h1 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tighter">RODHON SYSTEM</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1"> CADASTRO DE ALUNO</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => reset(defaultValues)} className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors text-[10px] font-black uppercase tracking-widest">
            <Eraser size={16}/> LIMPAR TUDO
          </button>
          <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            SALVAR NO SISTEMA
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-12">
        
        {/* 01. IDENTIFICAÇÃO ACADÊMICA */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-100">
            <User size={20} className="text-blue-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">01. Identificação Acadêmica</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-12 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo do Aluno</label>
              <input {...register("nome", { required: true })} placeholder="Digite o nome completo" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-2xl font-bold text-lg outline-none transition-all" />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data de Nascimento</label>
              <div className="flex gap-2">
                <input type="date" {...register("dataNascimento", { required: true })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-700" />
                <input {...register("idade")} placeholder="0 ANOS" readOnly className="w-24 px-2 py-4 bg-slate-100 border-none rounded-2xl font-black text-center text-slate-500" />
              </div>
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sexo / Identidade</label>
              <select {...register("sexo", { required: true })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-700">
                <option value="">SELECIONE...</option>
                <option value="masculino">MASCULINO</option>
                <option value="feminino">FEMININO</option>
                <option value="intersexo">INTERSEXO</option>
                <option value="prefere não informar">PREFERE NÃO INFORMAR</option>
              </select>
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Turma / Grupo</label>
              <input {...register("turma")} placeholder="Ex: 1º Ano A" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Scale size={12}/> Peso (kg)</label>
              <input type="number" step="0.1" {...register("peso")} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Ruler size={12}/> Altura (m)</label>
              <input type="number" step="0.01" {...register("altura")} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
            </div>

            <div className="md:col-span-3 space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Resultado IMC</label>
               <input readOnly value={imcResult || "---"} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-700 text-center outline-none" />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Turno</label>
              <select {...register("turno")} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-700">
                <option value="manhã">MANHÃ</option>
                <option value="tarde">TARDE</option>
                <option value="noite">NOITE</option>
                <option value="integral">INTEGRAL</option>
              </select>
            </div>
          </div>
        </section>

        {/* MONITORAMENTO GESTACIONAL */}
        {watchSexo === "feminino" && (
          <section className="p-8 bg-rose-50/50 border-2 border-rose-100 border-dashed rounded-[40px] space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <Baby className="text-rose-500" size={24} />
              <h2 className="text-sm font-black text-rose-900 uppercase tracking-tighter italic">01.1 Monitoramento Gestacional</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-400 uppercase ml-1">Está Gestante?</label>
                <select {...register("isGestante")} className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold text-rose-600 outline-none">
                  <option value="não">NÃO</option>
                  <option value="sim">SIM</option>
                </select>
              </div>
              {watchIsGestante === "sim" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-rose-400 uppercase ml-1">Semanas de Gestação</label>
                    <input type="number" {...register("semanasGestacao")} className="w-full px-5 py-4 bg-white border-none rounded-2xl font-black text-rose-600 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-rose-400 uppercase ml-1">Faz Pré-Natal?</label>
                    <select {...register("fazPreNatal")} className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold text-rose-600 outline-none">
                      <option value="sim">SIM</option>
                      <option value="não">NÃO</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 02. FILIAÇÃO */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-100">
            <Activity size={20} className="text-blue-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">02. Filiação</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[30px] border border-slate-100 border-dashed">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nome da Mãe</label>
              <input {...register("nomeMae", { required: true })} placeholder="Nome da mãe" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-400 shadow-sm" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nome do Pai</label>
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 cursor-pointer">
                  <input type="checkbox" {...register("semPaiDeclarado")} className="accent-blue-600 w-4 h-4 rounded" /> NÃO DECLARADO
                </label>
              </div>
              <input {...register("nomePai")} disabled={watch("semPaiDeclarado")} placeholder="Nome do pai" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-400 disabled:bg-slate-100 shadow-sm" />
            </div>
          </div>
        </section>

        {/* 03. SAÚDE */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-100">
            <Activity size={20} className="text-rose-500" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">03. Condições Clínicas & CID-11</h2>
          </div>
          <div className="bg-white border-2 border-slate-100 rounded-[30px] overflow-hidden shadow-sm">
            <FormSecaoSaudeCid 
              formData={{ saude: watchSaude }} 
              setFormData={(newData) => {
                const updatedSaude = typeof newData === 'function' ? newData({ saude: watchSaude }).saude : newData.saude;
                setValue("saude", updatedSaude);
              }} 
            />
          </div>
        </div>

        {/* 04. EMERGÊNCIA E ENDEREÇO */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-100">
            <Phone size={20} className="text-blue-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">04. Emergência e Endereço</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-slate-50 rounded-[30px] border border-slate-200">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Responsável p/ Emergência</label>
              <input {...register("contato1_nome")} placeholder="Nome do responsável" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-400 shadow-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Parentesco</label>
              <select {...register("contato1_parentesco")} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-400 shadow-sm text-slate-700">
                <option value="">SELECIONE...</option>
                <option value="pai">PAI</option>
                <option value="mãe">MÃE</option>
                <option value="madrasta">MADRASTA</option>
                <option value="padrasto">PADRASTO</option>
                <option value="tio">TIO</option>
                <option value="tia">TIA</option>
                <option value="avô">AVÔ</option>
                <option value="avó">AVÓ</option>
                <option value="irmão">IRMÃO(Ã)</option>
                <option value="outros">OUTROS</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tel. Emergência</label>
              <input {...register("contato1_telefone")} placeholder="(00) 00000-0000" onChange={(e) => setValue("contato1_telefone", mascaraTelefone(e.target.value))} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black outline-none focus:border-blue-400 shadow-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-white border-2 border-slate-100 rounded-[30px] shadow-sm">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CEP</label>
              <input {...register("endereco_cep")} placeholder="00000-000" onChange={(e) => setValue("endereco_cep", mascaraCEP(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black outline-none text-blue-600" />
            </div>
            <div className="md:col-span-8 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Logradouro</label>
              <input {...register("endereco_rua")} placeholder="Rua / Avenida" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número</label>
              <input {...register("endereco_numero")} placeholder="S/N" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-center outline-none" />
            </div>
            <div className="md:col-span-5 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bairro</label>
              <input {...register("endereco_bairro")} placeholder="Bairro" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
            </div>
            <div className="md:col-span-5 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cidade</label>
              <input {...register("endereco_cidade")} placeholder="Cidade" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">UF</label>
              <input {...register("endereco_uf")} placeholder="UF" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-center outline-none" />
            </div>
          </div>
        </section>

        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default FormCadastroAluno;