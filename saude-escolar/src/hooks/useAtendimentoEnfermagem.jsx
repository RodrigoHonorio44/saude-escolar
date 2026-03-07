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

  const normalizarParaId = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, '-');
  };

  // ✅ NOVO FORMATO DE ID: baenf-2026-nomealuno-escola-random
  const gerarNovoBaenf = (nome, escola) => {
    const nomeLimpo = normalizarParaId(nome) || "novo";
    const escolaLimpa = normalizarParaId(escola) || "geral";
    const random = Math.random().toString(36).substring(2, 8).toLowerCase();
    return `baenf-2026-${nomeLimpo}-${escolaLimpa}-${random}`;
  };

  const getInitialFormState = useCallback(() => ({
    baenf: `baenf-2026-aguardando-${Math.random().toString(36).substring(2, 5)}`,
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

  const resetForm = useCallback(() => {
    setFormData(getInitialFormState());
    setSugestoes([]);
    setMostrarSugestoes(false);
  }, [getInitialFormState]);

  const buscarPorVinculoDireto = async (dados) => {
    const { nome, dataNasc, identificador } = dados; 
    if (!nome || !identificador || !dataNasc) return toast.error("PREENCHA NOME, DATA E MÃE/CPF!");

    setBuscando(true);
    try {
      const nomeBusca = nome.toLowerCase().trim();
      const idenBusca = identificador.toLowerCase().trim();
      const colecaoAlvo = configUI.perfilPaciente === 'funcionario' ? "cadastro_funcionario" : "cadastro_aluno";
      const campoIden = configUI.perfilPaciente === 'funcionario' ? "cpf" : "nomeMae";

      const q = query(
        collection(db, colecaoAlvo),
        where("nome", "==", nomeBusca),
        where("dataNascimento", "==", dataNasc),
        where(campoIden, "==", idenBusca)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        selecionarPaciente({ id: docSnap.id, ...docSnap.data() });
        toast.success(`${configUI.perfilPaciente.toUpperCase()} LOCALIZADO!`);
      } else {
        const qPasta = query(
          collection(db, "pastas_digitais"),
          where("nome", "==", nomeBusca),
          where("dataNascimento", "==", dataNasc)
        );
        const pastaSnap = await getDocs(qPasta);

        if (!pastaSnap.empty) {
          const docPasta = pastaSnap.docs[0];
          selecionarPaciente({ id: docPasta.id, ...docPasta.data() });
          toast.success("LOCALIZADO NA PASTA DIGITAL!");
        } else {
          const unidadeId = user?.unidadeid || user?.unidadeId || "geral";
          const idNovo = configUI.perfilPaciente === 'funcionario' 
            ? `${normalizarParaId(unidadeId)}-${normalizarParaId(nome)}-${identificador.replace(/\D/g, "")}`
            : `${normalizarParaId(nome)}_${dataNasc.replace(/\D/g, "")}_${normalizarParaId(identificador)}_${normalizarParaId(unidadeId)}`;

          setFormData(prev => ({ 
            ...prev, 
            pacienteId: idNovo, 
            nomePaciente: nomeBusca, 
            [configUI.perfilPaciente === 'aluno' ? 'nomeMae' : 'cpf']: idenBusca, 
            dataNascimento: dataNasc,
            baenf: gerarNovoBaenf(nomeBusca, user?.unidade || user?.escola)
          }));
          toast.error("NÃO LOCALIZADO. UM NOVO REGISTRO SERÁ CRIADO.");
        }
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
      const colecao = configUI.perfilPaciente === 'funcionario' ? "cadastro_funcionario" : "cadastro_aluno";
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
    const nomeP = (p.nome || p.nomeExibicao || "").toLowerCase();
    const escolaP = user?.unidade || user?.escola || "geral";

    setFormData(prev => ({
      ...prev,
      pacienteId: p.id || p.pacienteId,
      baenf: gerarNovoBaenf(nomeP, escolaP),
      nomePaciente: nomeP,
      nomeMae: (p.nomeMae || "").toLowerCase(),
      cpf: p.cpf || "",
      dataNascimento: p.dataNascimento || "",
      sexo: p.sexo || "",
      turma: p.turma || "",
      cargo: p.cargo || "",
      peso: p.peso || "",
      altura: p.altura || "",
      imc: p.imc || "",
      etnia: p.etnia || "", 
      gestante: p.isGestante || p.gestante || "nao",
      saude: {
        cids: p.saude?.cids || p.cids || [],
        acessibilidades: p.saude?.acessibilidades || p.acessibilidades || [],
        alergiasDesc: (p.saude?.alergiasDesc || p.alergiasDesc || "").toLowerCase(),
        temAlergia: p.saude?.temAlergia || p.temAlergia || "não",
        usaMedicamento: p.saude?.usaMedicamento || p.usaMedicamento || "não",
        restricaoAlimentar: (p.saude?.restricaoAlimentar || p.restricaoAlimentar || "").toLowerCase(),
        medicamentoDesc: (p.saude?.medicamentoDesc || p.medicamentoDesc || "").toLowerCase()
      }
    }));
  };

  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    const unidadeId = user?.unidadeid || user?.unidadeId;
    if (!unidadeId) return toast.error("UNIDADE NÃO IDENTIFICADA NO PERFIL!");

    setLoading(true);
    const toastId = toast.loading("SALVANDO...");

    try {
      const batch = writeBatch(db);
      
      // ✅ GARANTE O ID COM NOME E ESCOLA NO SALVAMENTO
      const baenfFinal = formData.baenf.includes('aguardando') 
        ? gerarNovoBaenf(formData.nomePaciente, user?.unidade || user?.escola)
        : formData.baenf;

      const finalAtendimento = {
        ...formData,
        baenf: baenfFinal,
        perfilPaciente: configUI.perfilPaciente,
        unidadeid: unidadeId.toLowerCase(),
        atendenteId: user.uid,
        atendenteNome: user.nome.toLowerCase(),
        // ✅ SALVANDO O COREN E O CARGO DO RODRIGO SILVA
        atendenteRegistro: user.registroProfissional || "",
        atendenteRole: user.role || "",
        criadoEm: serverTimestamp(),
        horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      batch.set(doc(db, "atendimento_enfermagem", baenfFinal), finalAtendimento);

      batch.set(doc(db, "pastas_digitais", formData.pacienteId), {
        nome: formData.nomePaciente.toLowerCase(),
        nomeMae: formData.nomeMae.toLowerCase(),
        cpf: formData.cpf || "",
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo,
        turma: formData.turma,
        cargo: formData.cargo,
        unidadeid: unidadeId.toLowerCase(),
        peso: formData.peso,
        altura: formData.altura,
        imc: formData.imc,
        etnia: formData.etnia || "",
        saude: formData.saude,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("SALVO COM SUCESSO!", { id: toastId });
      resetForm();
      return true;
    } catch (err) {
      console.error(err);
      toast.error("ERRO DE PERMISSÃO OU DADOS INVÁLIDOS", { id: toastId });
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