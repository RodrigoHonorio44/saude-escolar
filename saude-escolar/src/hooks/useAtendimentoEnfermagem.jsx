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
    modoPesquisa: 'simples' // simples ou inteligente
  });

  const getInitialFormState = useCallback(() => ({
    baenf: `baenf-2026-${Math.random().toString(36).substring(2, 8).toLowerCase()}`,
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
    saude: {
      cids: [],
      alergiasDesc: '',
      temAlergia: 'não',
      usaMedicamento: 'não'
    },
    contatos: {
      nome: '',
      telefone: '',
      parentesco: ''
    }
  }), []);

  const [formData, setFormData] = useState(getInitialFormState());

  // ✅ 1. BUSCA POR VÍNCULO DIRETO (NOME + DATA + MÃE + UNIDADE)
  const buscarPorVinculoDireto = async (dados) => {
    const { nome, dataNasc, mae } = dados;
    if (!nome || !dataNasc || !mae) return toast.error("preencha os 3 campos para buscar!");

    setBuscando(true);
    try {
      const nomeLimpo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").toLowerCase();
      const maeLimpa = mae.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").toLowerCase();
      const dataLimpa = dataNasc.replace(/-/g, "");
      const unidadeId = user.unidadeid.toLowerCase();
      
      const idProcurado = `${nomeLimpo}_${dataLimpa}_${maeLimpa}_${unidadeId}`;
      const docRef = doc(db, "pastas_digitais", idProcurado);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        selecionarPaciente({ id: docSnap.id, ...docSnap.data() });
        toast.success("aluno localizado!");
      } else {
        // Aluno não cadastrado: Já prepara o ID para o novo vínculo
        setFormData(prev => ({ 
          ...prev, 
          pacienteId: idProcurado, 
          nomePaciente: nome.toLowerCase(), 
          nomeMae: mae.toLowerCase(), 
          dataNascimento: dataNasc 
        }));
        toast.error("aluno não cadastrado. o vínculo será criado ao salvar.");
      }
    } catch (error) {
      toast.error("erro na busca inteligente");
    } finally { setBuscando(false); }
  };

  // ✅ 2. BUSCA DE SUGESTÕES SIMPLES
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

  // ✅ 3. CÁLCULO DE IDADE AUTOMÁTICO
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

  // ✅ 4. ATUALIZAÇÃO DE CAMPOS E IMC
  const updateField = useCallback((campo, valor) => {
    setFormData(prev => {
      const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
      let novoEstado = { ...prev, [campo]: valorFormatado };
      if (campo === 'peso' || campo === 'altura') {
        const p = parseFloat(String(novoEstado.peso).replace(',', '.'));
        const a = parseFloat(String(novoEstado.altura).replace(',', '.'));
        if (p > 0 && a > 0) novoEstado.imc = (p / (a * a)).toFixed(2);
      }
      return novoEstado;
    });
  }, []);

  // ✅ 5. SELECIONAR PACIENTE
  const selecionarPaciente = (p) => {
    setMostrarSugestoes(false);
    setFormData(prev => ({
      ...prev,
      pacienteId: p.id,
      nomePaciente: p.nome || "",
      nomeMae: p.nomeMae || "",
      dataNascimento: p.dataNascimento || "",
      sexo: p.sexo || "",
      turma: p.turma || "",
      peso: p.peso || "",
      altura: p.altura || "",
      saude: {
        cids: p.saude?.cids || p.cids || [],
        alergiasDesc: p.saude?.alergiasDesc || p.alergiasDesc || "",
        temAlergia: p.saude?.temAlergia || p.temAlergia || "não",
        usaMedicamento: p.saude?.usaMedicamento || p.usaMedicamento || "não"
      }
    }));
  };

  // ✅ 6. SALVAMENTO DUPLO (ATENDIMENTO + PASTA DIGITAL)
  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    const unidadeId = user?.unidadeid?.toLowerCase();
    if (!unidadeId) return toast.error("unidade não identificada!");

    setLoading(true);
    const toastId = toast.loading("salvando atendimento...");

    try {
      const batch = writeBatch(db);
      
      // Geração do ID composto (mesmo que o aluno não tenha sido selecionado via busca)
      const nomeLimpo = formData.nomePaciente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").toLowerCase();
      const maeLimpa = formData.nomeMae.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").toLowerCase();
      const dataLimpa = formData.dataNascimento.replace(/-/g, "");
      const idVinculoRS = `${nomeLimpo}_${dataLimpa}_${maeLimpa}_${unidadeId}`;

      const finalAtendimento = {
        ...formData,
        pacienteId: idVinculoRS,
        unidadeid: unidadeId,
        atendenteId: user.uid,
        atendenteNome: user.nome.toLowerCase(),
        criadoEm: serverTimestamp(),
        horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      // Grava Atendimento
      batch.set(doc(db, "atendimento_enfermagem", formData.baenf), finalAtendimento);

      // Atualiza ou Cria Pasta Digital
      batch.set(doc(db, "pastas_digitais", idVinculoRS), {
        nome: formData.nomePaciente.toLowerCase(),
        nomeMae: formData.nomeMae.toLowerCase(),
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo,
        turma: formData.turma,
        unidadeid: unidadeId,
        peso: formData.peso,
        altura: formData.altura,
        imc: formData.imc,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("atendimento e vínculo salvos!", { id: toastId });
      setFormData(getInitialFormState());
      return true;
    } catch (err) {
      toast.error("erro ao salvar!");
      return false;
    } finally { setLoading(false); }
  };

  return {
    formData, updateField, loading, configUI, setConfigUI,
    sugestoes, mostrarSugestoes, setMostrarSugestoes, buscando,
    buscarSugestoes, selecionarPaciente, salvarAtendimento, buscarPorVinculoDireto
  };
};