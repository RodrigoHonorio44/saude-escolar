import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../config/firebase'; 
import { serverTimestamp, doc, writeBatch, query, collection, where, getDocs, limit, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useFormCadastroFuncionario = (dadosEdicao, modoPastaDigital, onSucesso, handleActionVoltar, usuarioLogado) => {
  const [buscandoDados, setBuscandoDados] = useState(false);
  const [statusCadastro, setStatusCadastro] = useState(null); // 'existente' | 'novo'

  const user = usuarioLogado;
  const unidadeIdLogada = (user?.unidadeid || localStorage.getItem('inspecao_unidade_id') || "").toLowerCase().trim();
  const unidadeNomeLogada = (user?.unidade || localStorage.getItem('inspecao_unidade_nome') || "").toLowerCase().trim();
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  const paraBanco = (val) => val ? String(val).toLowerCase().trim().replace(/\s+/g, ' ') : "";
  const paraBusca = (val) => val ? val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
  
  const paraExibicao = useCallback((val) => {
    if (!val) return "";
    return val.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange",
    defaultValues: dadosEdicao || {
      nome: '', cpf: '', sexo: '', dataNascimento: '', idade: '', cargo: '', 
      etnia: '', peso: '', altura: '', unidadeid: unidadeIdLogada, unidade: unidadeNomeLogada,
      gestante: 'nao', gestanteSemanas: '0', gestantePreNatal: ''
    }
  });

  const watchValues = watch();

  useEffect(() => {
    if (watchValues.dataNascimento) {
      const hoje = new Date();
      const nasc = new Date(watchValues.dataNascimento);
      let idadeCalculada = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadeCalculada--;
      setValue("idade", idadeCalculada > 0 ? idadeCalculada : 0);
    }
  }, [watchValues.dataNascimento, setValue]);

  // 1. BUSCA RESTRITA À UNIDADE ATUAL (PRIVACIDADE TOTAL)
  const realizarBuscaManual = async () => {
    const nomeBusca = paraBusca(watchValues.nome);
    const cpfBusca = watchValues.cpf ? watchValues.cpf.replace(/\D/g, "") : "";

    if (!nomeBusca && !cpfBusca) {
      toast.error("Insira o Nome ou CPF para buscar.");
      return;
    }

    setBuscandoDados(true);
    try {
      const ref = collection(db, "cadastro_funcionario");
      let q;

      // Filtra obrigatoriamente pela unidade logada para não ver dados de outros colégios
      if (cpfBusca) {
        q = query(ref, where("cpf", "==", cpfBusca), where("unidadeid", "==", unidadeIdLogada), limit(1));
      } else {
        q = query(ref, where("nomeBusca", "==", nomeBusca), where("unidadeid", "==", unidadeIdLogada), limit(1));
      }

      const snap = await getDocs(q);

      if (!snap.empty) {
        const d = snap.docs[0].data();
        toast.success("Staff localizado nesta unidade!");
        setStatusCadastro('existente');
        
        Object.keys(d).forEach(key => {
          if (key === 'nome') setValue('nome', paraExibicao(d[key]));
          else if (key !== 'updatedAt' && key !== 'createdAt') setValue(key, d[key]);
        });
      } else {
        toast.success("Nenhum registro encontrado nesta unidade.");
        setStatusCadastro('novo');
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao consultar base de dados.");
    } finally {
      setBuscandoDados(false);
    }
  };

  const limparTudo = () => {
    reset({
      nome: '', cpf: '', sexo: '', dataNascimento: '', idade: '', cargo: '', 
      etnia: '', peso: '', altura: '', unidadeid: unidadeIdLogada, unidade: unidadeNomeLogada,
      gestante: 'nao', gestanteSemanas: '0', gestantePreNatal: '',
      nomeContato1: '', contato: ''
    });
    setStatusCadastro(null);
  };

  // 2. SUBMISSÃO COM BLOQUEIO GLOBAL E LOG DE DUPLICIDADE
  const onSubmit = async (data) => {
    try {
      const nomeParaBusca = paraBusca(data.nome);
      const cpfLimpo = data.cpf ? data.cpf.replace(/\D/g, "") : "";

      // VERIFICAÇÃO DE DUPLICIDADE EM OUTROS COLÉGIOS
      const refGlobal = collection(db, "cadastro_funcionario");
      const qGlobal = query(refGlobal, where("cpf", "==", cpfLimpo));
      const snapGlobal = await getDocs(qGlobal);

      if (!snapGlobal.empty) {
        const registroExistente = snapGlobal.docs[0].data();
        
        // Se o CPF já existe em outra unidade, bloqueia e gera log
        if (registroExistente.unidadeid !== unidadeIdLogada) {
          
          const logId = `log-${unidadeIdLogada}-${Date.now()}`;
          await setDoc(doc(db, "logs_tentativa_duplicidade", logId), {
            dataTentativa: serverTimestamp(),
            usuarioResponsavel: user?.email || "desconhecido",
            unidadeOrigemLog: unidadeNomeLogada,
            unidadeOrigemId: unidadeIdLogada,
            funcionarioAlvo: {
              nomeInformado: paraBanco(data.nome),
              cpf: cpfLimpo
            },
            detalhesConflito: {
              colégioDono: registroExistente.unidade,
              colégioDonoId: registroExistente.unidadeid
            }
          });

          toast.error("BLOQUEADO: ESTE USUÁRIO JÁ PERTENCE A OUTRO COLÉGIO!", {
            duration: 6000,
            style: { background: '#b91c1c', color: '#fff', fontWeight: '900' }
          });
          return; // Aborta o salvamento
        }
      }

      // SALVAMENTO NORMAL (SÓ CHEGA AQUI SE FOR ÚNICO OU DA MESMA UNIDADE)
      const idPasta = `${unidadeIdLogada}-${nomeParaBusca.replace(/\s+/g, '-')}-${cpfLimpo}`;

      let imcCalculado = null;
      if (data.weight && data.height) { // Ajustado para bater com seu banco
        const p = parseFloat(data.weight);
        const a = parseFloat(data.height);
        if (a > 0) imcCalculado = parseFloat((p / (a * a)).toFixed(2));
      }

      const payload = {
        ...data,
        nome: paraBanco(data.nome),
        nomeBusca: nomeParaBusca,
        cpf: cpfLimpo,
        imc: imcCalculado,
        pacienteId: idPasta,
        unidadeid: unidadeIdLogada,
        unidade: unidadeNomeLogada,
        updatedAt: serverTimestamp(),
        createdAt: data.createdAt || serverTimestamp()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idPasta), payload, { merge: true });
      batch.set(doc(db, "cadastro_funcionario", idPasta), payload, { merge: true });
      
      await batch.commit();
      toast.success(`SALVO COM SUCESSO NO ${unidadeNomeLogada.toUpperCase()}`);
      
      if (modoPastaDigital) handleActionVoltar(); 
      else limparTudo();
      
      if (onSucesso) onSucesso();
    } catch (e) { 
      console.error(e);
      toast.error('Erro crítico ao salvar.'); 
    }
  };

  return { 
    register, 
    handleSubmit: handleSubmit(onSubmit), 
    errors, 
    isSubmitting, 
    setValue, 
    watchValues, 
    buscandoDados, 
    paraExibicao,
    realizarBuscaManual,
    limparTudo,
    statusCadastro
  };
};