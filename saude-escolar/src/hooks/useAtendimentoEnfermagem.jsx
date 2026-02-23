import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase'; 
import { 
  serverTimestamp, doc, writeBatch, collection, 
  query, where, getDocs, limit, getDoc 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useAtendimentoLogica = (user) => {
  const [loading, setLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const [configUI, setConfigUI] = useState({
    tipoAtendimento: 'local', 
    perfilPaciente: 'aluno',
    houveMedicacao: 'não',
    modoPesquisa: 'simples'
  });

  // ✅ GERADOR DE ID ÚNICO PARA O ATENDIMENTO
  const gerarNovoBaenf = () => `baenf-2026-${Math.random().toString(36).substring(2, 8).toLowerCase()}`;

  const getInitialFormState = useCallback(() => ({
    baenf: gerarNovoBaenf(),
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    horaFim: '', 
    nomePaciente: '',
    nomeMae: '', 
    dataNascimento: '',
    idade: '',
    sexo: '',
    turma: '',
    cargo: '',
    temperatura: '',
    peso: '',
    altura: '',
    imc: '',
    motivoAtendimento: '',
    procedimentos: '',
    observacoes: '',
    pacienteId: '', 
    gestante: 'nao',
    dum: '',
    semanasGestacao: '',
    preNatal: 'nao',
    saude: {
      cids: [],
      acessibilidades: [],
      alergiasDesc: '',
      temAlergia: 'não',
      usaMedicamento: 'não',
      restricaoAlimentar: '',
      medicamentoDesc: ''
    },
    contatos: {
      nome: '',
      telefone: '',
      parentesco: ''
    }
  }), []);

  const [formData, setFormData] = useState(getInitialFormState());

  // ✅ FUNÇÃO PARA LIMPAR TUDO E RECOMEÇAR (EXPOSTA PARA O COMPONENTE)
  const resetForm = useCallback(() => {
    setFormData(getInitialFormState());
    setSugestoes([]);
    setMostrarSugestoes(false);
  }, [getInitialFormState]);

  const normalizarParaId = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, '-');
  };

  const buscarPorVinculoDireto = async (dados) => {
    const { nome, dataNasc, mae } = dados;
    if (!nome || !dataNasc || !mae) return toast.error("PREENCHA OS 3 CAMPOS PARA BUSCAR!");

    setBuscando(true);
    try {
      const nomeId = normalizarParaId(nome);
      const maeId = normalizarParaId(mae);
      const dataId = dataNasc.replace(/\D/g, "");
      const unidadeId = user?.unidadeid?.toLowerCase() || user?.unidadeId?.toLowerCase();
      
      const idProcurado = `${nomeId}_${dataId}_${maeId}_${unidadeId}`;
      const docRef = doc(db, "pastas_digitais", idProcurado);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        selecionarPaciente({ id: docSnap.id, ...docSnap.data() });
        toast.success("ALUNO LOCALIZADO NO SISTEMA!");
      } else {
        setFormData(prev => ({ 
          ...prev, 
          pacienteId: idProcurado, 
          nomePaciente: nome.toLowerCase(), 
          nomeMae: mae.toLowerCase(), 
          dataNascimento: dataNasc 
        }));
        toast.error("ALUNO NÃO CADASTRADO. O VÍNCULO SERÁ CRIADO AO SALVAR.");
      }
    } catch (error) {
      toast.error("ERRO NA BUSCA INTELIGENTE");
    } finally { setBuscando(false); }
  };

  const buscarSugestoes = useCallback(async (busca) => {
    if (busca.length < 3) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    try {
      const colecao = configUI.perfilPaciente === 'funcionario' ? "funcionarios" : "pastas_digitais";
      const q = query(
        collection(db, colecao),
        where("nome", ">=", busca.toLowerCase()),
        where("nome", "<=", busca.toLowerCase() + "\uf8ff"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const res = [];
      querySnapshot.forEach((doc) => res.push({ id: doc.id, ...doc.data() }));
      setSugestoes(res);
    } catch (error) {
      console.error("erro na busca:", error);
    } finally { setBuscando(false); }
  }, [configUI.perfilPaciente]);

  useEffect(() => {
    if (formData.dataNascimento) {
      const hoje = new Date();
      const nasc = new Date(formData.dataNascimento);
      if (!isNaN(nasc.getTime())) {
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        setFormData(prev => prev.idade === String(idade) ? prev : { ...prev, idade: String(idade) });
      }
    }
  }, [formData.dataNascimento]);

  const updateField = useCallback((campo, valor) => {
    const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
    
    setFormData(prev => {
      if (campo.includes('.')) {
        const [obj, key] = campo.split('.');
        return {
          ...prev,
          [obj]: { ...prev[obj], [key]: valorFormatado }
        };
      }

      let novoEstado = { ...prev, [campo]: valorFormatado };
      if (campo === 'peso' || campo === 'altura') {
        const p = parseFloat(String(novoEstado.peso).replace(',', '.'));
        const a = parseFloat(String(novoEstado.altura).replace(',', '.'));
        if (p > 0 && a > 0) novoEstado.imc = (p / (a * a)).toFixed(2);
      }
      return novoEstado;
    });
  }, []);

  const selecionarPaciente = (p) => {
    setMostrarSugestoes(false);
    setFormData(prev => ({
      ...prev,
      pacienteId: p.id,
      nomePaciente: p.nome || p.nomePaciente || "",
      nomeMae: p.nomeMae || "",
      dataNascimento: p.dataNascimento || "",
      sexo: p.sexo || "",
      turma: p.turma || "",
      cargo: p.cargo || "",
      peso: p.peso || "",
      altura: p.altura || "",
      saude: {
        cids: p.saude?.cids || [],
        acessibilidades: p.saude?.acessibilidades || [],
        alergiasDesc: p.saude?.alergiasDesc || "",
        temAlergia: p.saude?.temAlergia || "não",
        usaMedicamento: p.saude?.usaMedicamento || "não",
        restricaoAlimentar: p.saude?.restricaoAlimentar || "",
        medicamentoDesc: p.saude?.medicamentoDesc || ""
      }
    }));
  };

  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    const unidadeId = user?.unidadeid?.toLowerCase() || user?.unidadeId?.toLowerCase();
    if (!unidadeId) return toast.error("UNIDADE NÃO IDENTIFICADA!");

    setLoading(true);
    const toastId = toast.loading("SALVANDO ATENDIMENTO...");

    try {
      const batch = writeBatch(db);
      
      const nomeId = normalizarParaId(formData.nomePaciente);
      const maeId = normalizarParaId(formData.nomeMae);
      const dataId = formData.dataNascimento.replace(/\D/g, "");
      const idVinculoRS = `${nomeId}_${dataId}_${maeId}_${unidadeId}`;

      const finalAtendimento = {
        ...formData,
        pacienteId: idVinculoRS,
        unidadeid: unidadeId,
        atendenteId: user.uid,
        atendenteNome: user.nome.toLowerCase(),
        criadoEm: serverTimestamp(),
        horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      // 1. Grava o Atendimento
      batch.set(doc(db, "atendimento_enfermagem", formData.baenf), finalAtendimento);

      // 2. Atualiza/Cria Pasta Digital
      batch.set(doc(db, "pastas_digitais", idVinculoRS), {
        nome: formData.nomePaciente.toLowerCase(),
        nomeMae: formData.nomeMae.toLowerCase(),
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo,
        turma: formData.turma,
        cargo: formData.cargo,
        unidadeid: unidadeId,
        peso: formData.peso,
        altura: formData.altura,
        imc: formData.imc,
        saude: formData.saude,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("ATENDIMENTO FINALIZADO COM SUCESSO!", { id: toastId });
      
      // ✅ LIMPA O FORMULÁRIO MAS MANTÉM ABERTURA PARA PRÓXIMO ALUNO
      resetForm();
      
      return true;
    } catch (err) {
      console.error(err);
      toast.error("ERRO AO SALVAR!", { id: toastId });
      return false;
    } finally { setLoading(false); }
  };

  return {
    formData, updateField, loading, configUI, setConfigUI,
    sugestoes, mostrarSugestoes, setMostrarSugestoes, buscando,
    buscarSugestoes, selecionarPaciente, salvarAtendimento, 
    buscarPorVinculoDireto, resetForm
  };
};