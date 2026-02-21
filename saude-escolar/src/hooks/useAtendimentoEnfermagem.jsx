import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase'; // Ajuste o caminho se necessário
import { 
  serverTimestamp, doc, writeBatch, collection, 
  query, where, getDocs, limit 
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
    houveMedicacao: 'não'
  });

  const getInitialFormState = useCallback(() => ({
    baenf: `baenf-2026-${Math.random().toString(36).substring(2, 8).toLowerCase()}`,
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    nomePaciente: '',
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
    pacienteId: ''
  }), []);

  const [formData, setFormData] = useState(getInitialFormState());

  // ✅ BUSCA DE SUGESTÕES DIRETA (SEM DEPENDÊNCIA EXTERNA)
  const buscarSugestoes = useCallback(async (busca) => {
    if (busca.length < 3) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    try {
      const colecao = configUI.perfilPaciente === 'funcionario' ? "funcionarios" : "alunos";
      const q = query(
        collection(db, colecao),
        where("nomeBusca", ">=", busca.toLowerCase()),
        where("nomeBusca", "<=", busca.toLowerCase() + "\uf8ff"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const res = [];
      querySnapshot.forEach((doc) => res.push({ id: doc.id, ...doc.data() }));
      setSugestoes(res);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setBuscando(false);
    }
  }, [configUI.perfilPaciente]);

  // ✅ LOGICA DE IDADE
  useEffect(() => {
    if (formData.dataNascimento) {
      const hoje = new Date();
      const nasc = new Date(formData.dataNascimento);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
      setFormData(prev => ({ ...prev, idade: idade >= 0 ? String(idade) : "" }));
    }
  }, [formData.dataNascimento]);

  const updateField = useCallback((campo, valor) => {
    setFormData(prev => {
      const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
      let novoEstado = { ...prev, [campo]: valorFormatado };
      
      if (campo === 'peso' || campo === 'altura') {
        const p = parseFloat(String(novoEstado.peso).replace(',', '.'));
        const a = parseFloat(String(novoEstado.altura).replace(',', '.'));
        novoEstado.imc = (p > 0 && a > 0.5) ? (p / (a * a)).toFixed(2) : 0;
      }
      return novoEstado;
    });
  }, []);

  const selecionarPaciente = (p) => {
    setMostrarSugestoes(false);
    setFormData(prev => ({
      ...prev,
      pacienteId: p.id,
      nomePaciente: p.nome || p.nomeBusca || "",
      dataNascimento: p.dataNascimento || "",
      sexo: p.sexo || "",
      turma: p.turma || "",
      cargo: p.cargo || "",
      peso: p.peso || "",
      altura: p.altura || ""
    }));
    toast.success("paciente selecionado!");
  };

  const validarNomeCompleto = (nome) => {
    const partes = nome.trim().split(/\s+/);
    return partes.length >= 2 && partes[1].length >= 2;
  };

  // ✅ SALVAMENTO PADRÃO ALISON 1.4 + R S
  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    if (!user?.escolaId) return toast.error("unidade não identificada!");
    if (!validarNomeCompleto(formData.nomePaciente)) return toast.error("nome completo obrigatório!");

    setLoading(true);
    const toastId = toast.loading("salvando...");

    try {
      const batch = writeBatch(db);
      const colecaoBase = configUI.perfilPaciente === 'funcionario' ? "funcionarios" : "alunos";
      
      const payload = JSON.parse(JSON.stringify(formData), (k, v) => 
        typeof v === 'string' ? v.toLowerCase().trim() : v
      );

      // Gerar ID padrão RS
      const nomeLimpo = payload.nomePaciente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
      const dataLimpa = formData.dataNascimento.replace(/-/g, '');
      const idPasta = `${user.escolaId.toLowerCase()}-${nomeLimpo}-${dataLimpa}`;

      const finalAtendimento = {
        ...payload,
        unidadeId: user.escolaId.toLowerCase(),
        unidade: user.escola.toLowerCase(),
        atendenteId: user.uid,
        atendenteNome: user.nome.toLowerCase(),
        atendenteRegistro: (user.registroProfissional || "n/i").toLowerCase(),
        peso: Number(String(payload.peso).replace(',', '.')) || 0,
        altura: Number(String(payload.altura).replace(',', '.')) || 0,
        status: configUI.tipoAtendimento === 'remocao' ? 'removido' : 'concluido',
        criadoEm: serverTimestamp()
      };

      const dadosPasta = {
        nome: finalAtendimento.nomePaciente,
        nomeBusca: finalAtendimento.nomePaciente,
        dataNascimento: finalAtendimento.dataNascimento,
        peso: finalAtendimento.peso,
        altura: finalAtendimento.altura,
        ultimaConsulta: serverTimestamp(),
        ...(configUI.perfilPaciente === 'funcionario' ? { cargo: finalAtendimento.cargo } : { turma: finalAtendimento.turma })
      };

      batch.set(doc(db, "atendimentos_enfermagem", finalAtendimento.baenf), finalAtendimento);
      batch.set(doc(db, "pastas_digitais", idPasta), dadosPasta, { merge: true });
      batch.set(doc(db, colecaoBase, idPasta), dadosPasta, { merge: true });

      await batch.commit();
      toast.success("atendimento finalizado!", { id: toastId });
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
    buscarSugestoes, selecionarPaciente, salvarAtendimento, validarNomeCompleto
  };
};