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
    perfilPaciente: 'aluno', // 'aluno' ou 'funcionario'
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
    cpf: '', 
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
    etnia: '',
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

  // ✅ LIMPAR TUDO
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

  // ✅ BUSCA POR VÍNCULO (ADAPTADA PARA CADASTRO_FUNCIONARIO E PASTAS_DIGITAIS)
  const buscarPorVinculoDireto = async (dados) => {
    const { nome, dataNasc, identificador } = dados; 
    if (!nome || !identificador) return toast.error("PREENCHA OS CAMPOS PARA BUSCAR!");

    setBuscando(true);
    try {
      const nomeId = normalizarParaId(nome);
      const unidadeId = user?.unidadeid?.toLowerCase() || user?.unidadeId?.toLowerCase();
      
      let idProcurado = "";
      let colecaoBusca = "";

      if (configUI.perfilPaciente === 'funcionario') {
        colecaoBusca = "cadastro_funcionario";
        const cpfLimpo = identificador.replace(/\D/g, "");
        // PADRÃO FORNECIDO: unidadeid-nome-cpf
        idProcurado = `${unidadeId}-${nomeId}-${cpfLimpo}`;
      } else {
        colecaoBusca = "pastas_digitais";
        const maeId = normalizarParaId(identificador);
        const dataId = dataNasc.replace(/\D/g, "");
        idProcurado = `${nomeId}_${dataId}_${maeId}_${unidadeId}`;
      }

      const docRef = doc(db, colecaoBusca, idProcurado);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dadosDB = docSnap.data();
        selecionarPaciente({ id: docSnap.id, ...dadosDB });
        toast.success(`${configUI.perfilPaciente.toUpperCase()} LOCALIZADO!`);
      } else {
        setFormData(prev => ({ 
          ...prev, 
          pacienteId: idProcurado, 
          nomePaciente: nome.toLowerCase(), 
          [configUI.perfilPaciente === 'aluno' ? 'nomeMae' : 'cpf']: identificador.toLowerCase(), 
          dataNascimento: dataNasc 
        }));
        toast.error("NÃO LOCALIZADO. O VÍNCULO SERÁ CRIADO AO SALVAR.");
      }
    } catch (error) {
      console.error(error);
      toast.error("ERRO NA BUSCA");
    } finally { setBuscando(false); }
  };

  const buscarSugestoes = useCallback(async (busca) => {
    if (busca.length < 3) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    try {
      const colecao = configUI.perfilPaciente === 'funcionario' ? "cadastro_funcionario" : "pastas_digitais";
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
        return { ...prev, [obj]: { ...prev[obj], [key]: valorFormatado } };
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
      pacienteId: p.id || p.pacienteId,
      nomePaciente: p.nome || p.nomePaciente || "",
      nomeMae: p.nomeMae || "",
      cpf: p.cpf || "",
      dataNascimento: p.dataNascimento || "",
      sexo: p.sexo || "",
      turma: p.turma || "",
      cargo: p.cargo || "",
      peso: p.peso || "",
      altura: p.altura || "",
      imc: p.imc || "",
      etnia: p.etnia || "",
      gestante: p.gestante || "nao",
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
      const colecaoDestino = configUI.perfilPaciente === 'aluno' ? "pastas_digitais" : "cadastro_funcionario";

      const finalAtendimento = {
        ...formData,
        perfilPaciente: configUI.perfilPaciente,
        unidadeid: unidadeId,
        atendenteId: user.uid,
        atendenteNome: user.nome.toLowerCase(),
        criadoEm: serverTimestamp(),
        horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      // 1. Grava Atendimento
      batch.set(doc(db, "atendimento_enfermagem", formData.baenf), finalAtendimento);

      // 2. Atualiza Pasta correspondente (Pasta Digital ou Cadastro Funcionario)
      batch.set(doc(db, colecaoDestino, formData.pacienteId), {
        nome: formData.nomePaciente.toLowerCase(),
        nomeMae: formData.nomeMae.toLowerCase(),
        cpf: formData.cpf || "",
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo,
        turma: formData.turma,
        cargo: formData.cargo,
        unidadeid: unidadeId,
        peso: formData.peso,
        altura: formData.altura,
        imc: formData.imc,
        etnia: formData.etnia || "",
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("ATENDIMENTO FINALIZADO!", { id: toastId });
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