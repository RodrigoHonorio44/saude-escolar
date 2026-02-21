import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase'; 
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
    nomeMae: '', // Adicionado para o ID único
    dataNascimento: '',
    idade: '',
    sexo: '',
    etnia: '',
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
    // Estrutura de Saúde Conforme seu Cadastro
    saude: {
      cids: [],
      acessibilidades: [],
      medicamentoDesc: '',
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

  // ✅ BUSCA DE SUGESTÕES (ISOLADA POR TIPO)
  const buscarSugestoes = useCallback(async (busca) => {
    if (busca.length < 3) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    try {
      // Ajustado para suas coleções reais: "cadastro_aluno" ou "funcionarios"
      const colecao = configUI.perfilPaciente === 'funcionario' ? "funcionarios" : "cadastro_aluno";
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
      console.error("Erro na busca:", error);
    } finally {
      setBuscando(false);
    }
  }, [configUI.perfilPaciente]);

  // ✅ LÓGICA DE IDADE AUTOMÁTICA
  useEffect(() => {
    if (formData.dataNascimento) {
      const hoje = new Date();
      const nasc = new Date(formData.dataNascimento);
      if (!isNaN(nasc.getTime())) {
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        setFormData(prev => ({ ...prev, idade: idade >= 0 ? `${idade} anos` : "" }));
      }
    }
  }, [formData.dataNascimento]);

  // ✅ ATUALIZAÇÃO DE CAMPOS (LOWERCASE)
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

  // ✅ SELECIONAR PACIENTE (POPULA FORMULÁRIO + SAÚDE COMPLETA)
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
      cargo: p.cargo || "",
      peso: p.peso || "",
      altura: p.altura || "",
      // Mapeia o objeto saude do seu cadastro
      saude: {
        cids: p.saude?.cids || [],
        acessibilidades: p.saude?.acessibilidades || [],
        medicamentoDesc: p.saude?.medicamentoDesc || "",
        alergiasDesc: p.saude?.alergiasDesc || "",
        temAlergia: p.saude?.temAlergia || "não",
        usaMedicamento: p.saude?.usaMedicamento || "não"
      },
      contatos: {
        nome: p.contato1_nome || "",
        telefone: p.contato1_telefone || "",
        parentesco: p.contato1_parentesco || ""
      }
    }));
    toast.success("prontuário sincronizado!");
  };

  const validarNomeCompleto = (nome) => {
    const partes = nome.trim().split(/\s+/);
    return partes.length >= 2 && partes[1].length >= 2;
  };

  // ✅ SALVAMENTO COM VÍNCULO RS (NOME-NASC-MAE)
  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    if (!user?.unidadeId) return toast.error("unidade não identificada!");
    if (!validarNomeCompleto(formData.nomePaciente)) return toast.error("nome completo obrigatório!");

    setLoading(true);
    const toastId = toast.loading("salvando atendimento...");

    try {
      const batch = writeBatch(batch_db || db);
      const colecaoAlunos = "cadastro_aluno";
      
      // Normalização para Lowercase
      const payload = JSON.parse(JSON.stringify(formData), (k, v) => 
        typeof v === 'string' ? v.toLowerCase().trim() : v
      );

      // Gerar ID Único (Vínculo)
      const nomeLimpo = payload.nomePaciente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
      const maeLimpa = payload.nomeMae.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
      const idPasta = `${nomeLimpo}-${payload.dataNascimento}-${maeLimpa}`;

      const finalAtendimento = {
        ...payload,
        alunoId: idPasta, // Chave de vínculo
        unidadeId: user.unidadeId.toLowerCase(),
        escola: user.escola.toLowerCase(),
        atendenteId: user.uid,
        atendenteNome: user.nome.toLowerCase(),
        atendenteRegistro: (user.registroProfissional || "n/i").toLowerCase(),
        criadoEm: serverTimestamp(),
        status: configUI.tipoAtendimento === 'remocao' ? 'removido' : 'concluido'
      };

      // 1. Grava na coleção de Atendimentos
      batch.set(doc(db, "atendimento_enfermagem", finalAtendimento.baenf), finalAtendimento);

      // 2. Grava/Atualiza na Pasta Digital (Vínculo)
      batch.set(doc(db, "pasta_digitais", `doc-${finalAtendimento.baenf}`), {
        alunoId: idPasta,
        tipo: "atendimento_enfermagem",
        data: finalAtendimento.data,
        titulo: "atendimento de enfermagem",
        profissional: finalAtendimento.atendenteNome,
        escolaId: finalAtendimento.unidadeId,
        createdAt: serverTimestamp()
      });

      // 3. Atualiza dados básicos no perfil do aluno (Peso/Altura/IMC atualizados)
      if (configUI.perfilPaciente === 'aluno') {
        batch.set(doc(db, colecaoAlunos, idPasta), {
          peso: finalAtendimento.peso,
          altura: finalAtendimento.altura,
          imc: finalAtendimento.imc,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      await batch.commit();
      toast.success("atendimento finalizado com sucesso!", { id: toastId });
      setFormData(getInitialFormState());
      return true;
    } catch (err) {
      console.error(err);
      toast.error("erro ao salvar atendimento!");
      return false;
    } finally { setLoading(false); }
  };

  return {
    formData, updateField, loading, configUI, setConfigUI,
    sugestoes, mostrarSugestoes, setMostrarSugestoes, buscando,
    buscarSugestoes, selecionarPaciente, salvarAtendimento, validarNomeCompleto
  };
};