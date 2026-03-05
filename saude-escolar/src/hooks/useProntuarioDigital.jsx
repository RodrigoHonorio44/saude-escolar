 import { useState, useCallback } from 'react';
import { db } from '../config/firebase';
import { 
 doc, 
 getDoc, 
  collection, 
 query, 
  where, 
 getDocs, 
 limit 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useProntuarioDigital = () => {
const [loading, setLoading] = useState(false);
const [prontuario, setProntuario] = useState(null);
const { user } = useAuth();

 // ✅ Normalização da Unidade: Garante que o ID da unidade esteja no mesmo padrão do Dashboard (ex: cept-anísio-teixeira)
 const unidadeIdLogada = (user?.unidadeid || user?.unidadeId || user?.escolaId)?.toLowerCase().trim();

 /**
   * Busca um prontuário pelo nome exato (convertido para lowercase)
   * filtrando pela unidade do profissional logado
   */
 const buscarPorNome = useCallback(async (nome) => {
if (!nome) return toast.error("Informe um nome para busca.");
if (!unidadeIdLogada) return toast.error("Unidade do profissional não identificada.");

setLoading(true);
setProntuario(null);

try {
// ✅ Regra R S: O nome no banco está em lowercase (ex: "caio girombá")
const nomeBusca = nome.toLowerCase().trim();

 // 🔥 CORREÇÃO: Busca na coleção 'cadastro_aluno' onde os dados residem
// Onde o campo de busca é 'nome' e não 'alunoNome'
const q = query(
 collection(db, "cadastro_aluno"),
where("unidadeid", "==", unidadeIdLogada),
 where("nome", "==", nomeBusca),
limit(1)
);

const querySnapshot = await getDocs(q);

if (querySnapshot.empty) {
 // Log para ajudar a identificar se o problema é o nome ou a unidadeid
console.log("Busca vazia para:", { unidadeIdLogada, nomeBusca });
 toast.error("Registro não localizado nesta unidade.");
 return;
 }

 const dadosAluno = querySnapshot.docs[0].data();
 const pacienteId = querySnapshot.docs[0].id;

 // ✅ Mapeamento dos dados para o componente (Sincronizado com seu Firestore)
const dadosConsolidados = {
 id: pacienteId,
...dadosAluno,
 // Adaptando campos do 'cadastro_aluno' para o layout do prontuário
 alunoNome: dadosAluno.nomeExibicao || dadosAluno.nome,
pacienteId: dadosAluno.matriculaInteligente || pacienteId,
// Extraindo do mapa 'saude' do seu banco
alergias: { detalhes: dadosAluno.saude?.alergiasDesc || "Nenhuma" },
restricaoAlimentar: { detalhes: dadosAluno.saude?.restricaoAlimentar || "Não possui" },
 medicacaoContinua: { detalhes: dadosAluno.saude?.medicamentoDesc || "Não utiliza" },
contatos: [
{ 
 nome: dadosAluno.contato1_nome, 
 telefone: dadosAluno.contato1_telefone, 
 parentesco: dadosAluno.contato1_parentesco 
}
 ]
 };

      setProntuario(dadosConsolidados);
      toast.success("Prontuário carregado!");
    } catch (error) {
      console.error("Erro ao buscar prontuário:", error);
      toast.error("Erro na comunicação com o banco de dados.");
    } finally {
      setLoading(false);
    }
  }, [unidadeIdLogada]);

  /**
   * Busca diretamente pelo ID do paciente na coleção cadastro_aluno
   */
  const buscarPorId = useCallback(async (id) => {
    if (!id || !unidadeIdLogada) return;
    setLoading(true);

    try {
      const docRef = doc(db, "cadastro_aluno", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const dados = snap.data();
        
        // ✅ Verificação de segurança: impede ver prontuários de outras unidades
        if (dados.unidadeid?.toLowerCase().trim() !== unidadeIdLogada) {
          toast.error("Acesso negado: Este registro pertence a outra unidade.");
          return;
        }

        setProntuario({ 
          id: snap.id, 
          ...dados,
          alunoNome: dados.nomeExibicao || dados.nome 
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar dados por ID.");
    } finally {
      setLoading(false);
    }
  }, [unidadeIdLogada]);

  const limparProntuario = () => setProntuario(null);

  return {
    prontuario,
    loading,
    buscarPorNome,
    buscarPorId,
    limparProntuario,
    unidadeIdLogada
  };
};