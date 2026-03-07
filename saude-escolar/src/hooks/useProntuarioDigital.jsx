import { useState, useCallback } from 'react';
import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  orderBy // ✅ Adicionado para ordenar o histórico
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useProntuarioDigital = () => {
  const [loading, setLoading] = useState(false);
  const [prontuario, setProntuario] = useState(null);
  const [questionario, setQuestionario] = useState(null); 
  const [historico, setHistorico] = useState([]); // ✅ Novo estado para o array de atendimentos
  const { user } = useAuth();

  const unidadeIdLogada = (user?.unidadeid || user?.unidadeId || user?.escolaId)?.toLowerCase().trim();

  /**
   * Busca o histórico de atendimentos na coleção 'atendimento_enfermagem'
   */
  const buscarHistoricoEnfermagem = useCallback(async (pacienteId) => {
    if (!pacienteId || !unidadeIdLogada) return;

    try {
      const q = query(
        collection(db, "atendimento_enfermagem"),
        where("pacienteId", "==", pacienteId),
        where("unidadeid", "==", unidadeIdLogada),
        orderBy("data", "desc") // 🔥 Traz os atendimentos mais recentes primeiro
      );

      const querySnapshot = await getDocs(q);
      const listaAtendimentos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHistorico(listaAtendimentos);
    } catch (error) {
      console.error("Erro ao buscar histórico de enfermagem:", error);
      // Nota: Se der erro de índice, o link aparecerá no console do navegador.
    }
  }, [unidadeIdLogada]);

  /**
   * Busca o questionário detalhado na coleção 'questionarios_saude'
   */
  const buscarQuestionarioDetalhado = useCallback(async (pacienteId) => {
    if (!pacienteId || !unidadeIdLogada) return;
    
    try {
      const q = query(
        collection(db, "questionarios_saude"),
        where("pacienteId", "==", pacienteId),
        where("unidadeid", "==", unidadeIdLogada), 
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setQuestionario(querySnapshot.docs[0].data());
      } else {
        setQuestionario(null);
      }
    } catch (error) {
      console.error("Erro ao buscar questionário:", error);
    }
  }, [unidadeIdLogada]);

  /**
   * Busca um prontuário pelo nome e dispara as buscas secundárias
   */
  const buscarPorNome = useCallback(async (nome) => {
    if (!nome) return toast.error("Informe um nome para busca.");
    if (!unidadeIdLogada) return toast.error("Unidade do profissional não identificada.");

    setLoading(true);
    setProntuario(null);
    setQuestionario(null);
    setHistorico([]); // Limpa histórico anterior

    try {
      const nomeBusca = nome.toLowerCase().trim();

      const q = query(
        collection(db, "cadastro_aluno"),
        where("unidadeid", "==", unidadeIdLogada),
        where("nome", "==", nomeBusca),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("Registro não localizado nesta unidade.");
        return;
      }

      const dadosAluno = querySnapshot.docs[0].data();
      const idDocumento = querySnapshot.docs[0].id;
      const pId = dadosAluno.pacienteId || idDocumento;

      const dadosConsolidados = {
        id: idDocumento,
        ...dadosAluno,
        alunoNome: dadosAluno.nomeExibicao || dadosAluno.nome,
        pacienteId: pId, 
        alergias: { detalhes: dadosAluno.saude?.alergiasDesc || "Nenhuma" },
        restricaoAlimentar: { detalhes: dadosAluno.saude?.restricaoAlimentar || "Não possui" },
        medicacaoContinua: { detalhes: dadosAluno.saude?.medicamentoDesc || "Não utiliza" },
        contatos: dadosAluno.contatos || []
      };

      setProntuario(dadosConsolidados);
      
      // 🔥 Dispara as buscas paralelas para as abas detalhadas
      await Promise.all([
        buscarQuestionarioDetalhado(pId),
        buscarHistoricoEnfermagem(pId)
      ]);

      toast.success("Prontuário carregado!");
    } catch (error) {
      console.error("Erro ao buscar prontuário:", error);
      toast.error("Erro na comunicação com o banco.");
    } finally {
      setLoading(false);
    }
  }, [unidadeIdLogada, buscarQuestionarioDetalhado, buscarHistoricoEnfermagem]);

  const limparProntuario = () => {
    setProntuario(null);
    setQuestionario(null);
    setHistorico([]);
  };

  return {
    prontuario,
    questionario,
    historico, // ✅ Agora retorna o array de atendimentos
    loading,
    buscarPorNome,
    limparProntuario,
    unidadeIdLogada
  };
};