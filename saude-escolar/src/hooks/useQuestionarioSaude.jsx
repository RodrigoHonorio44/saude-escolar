import { useState, useMemo, useCallback } from 'react';
import { db } from '../config/firebase';
import { 
  doc, getDoc, serverTimestamp, writeBatch, 
  collection, query, where, getDocs, limit 
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const useQuestionarioSaude = (onSucesso) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { user } = useAuth();
  
  const escolaUsuarioId = user?.unidadeId || user?.escolaId;

  const normalizeParaBanco = (val) => {
    if (typeof val !== 'string') return val;
    return val.toLowerCase().trim();
  };

  const estadoInicial = useMemo(() => ({
    alunoNome: '',
    dataNascimento: '',
    idade: '', 
    sexo: '',  
    turma: '',
    cargo: '',
    peso: '',
    altura: '',
    cartaoSus: '',
    etnia: '',
    tipoSanguineo: '',
    pacienteId: '',
    cid: '',
    // Novos campos de endereço vindos do cadastro
    bairro: '',
    rua: '',
    alergias: { possui: 'não', detalhes: '' },
    medicacaoContinua: { possui: 'não', detalhes: '' },
    restricaoAlimentar: { possui: 'não', detalhes: '' },
    problemaVisao: { possui: 'não', detalhes: '' },
    queixaVisao: { possui: 'não', detalhes: '' },
    sentarFrente: { possui: 'não', detalhes: '' },
    aparelhoAuditivo: { possui: 'não', detalhes: '' },
    queixaAudicao: { possui: 'não', detalhes: '' },
    otitesFrequentes: { possui: 'não', detalhes: '' },
    aparelhoBucal: { possui: 'não', detalhes: '' },
    seletividadeAlimentar: { possui: 'não', detalhes: '' },
    diabetes: { possui: 'não', detalhes: '' },
    asma: { possui: 'não', detalhes: '' },
    desmaioConvulsao: { possui: 'não', detalhes: '' },
    diagnosticoNeuro: { possui: 'não', detalhes: '' },
    despertaNoite: { possui: 'não', detalhes: '' },
    mudancaHumor: { possui: 'não', detalhes: '' },
    horasSono: '',
    vacinaStatus: 'atualizado',
    atestadoAtividadeFisica: 'apto',
    autonomiaHigiene: 'sozinho',
    contatos: [{ nome: '', telefone: '' }, { nome: '', telefone: '' }],
  }), []);

  const [formData, setFormData] = useState(estadoInicial);

  const handleLimparTudo = useCallback(() => {
    setFormData(estadoInicial);
  }, [estadoInicial]);

  const selecionarPaciente = async (paciente) => {
    let dQuest = {};
    try {
      // Tenta buscar o histórico, mas não deixa o erro de permissão travar o processo
      const questSnap = await getDoc(doc(db, "questionarios_saude", paciente.id));
      if (questSnap.exists()) dQuest = questSnap.data();
    } catch (error) {
      console.warn("Nota: Prontuário de saúde não localizado ou acesso restrito. Usando dados do cadastro.");
    }

    const saudeMap = paciente.saude || {};

    setFormData({
      ...estadoInicial,
      ...dQuest, 
      
      // PRIORIDADE: Dados atualizados do cadastro_aluno
      pacienteId: paciente.id,
      alunoNome: paciente.nomeExibicao || paciente.nome || '', 
      dataNascimento: paciente.dataNascimento || '',
      idade: paciente.idade || '',
      sexo: paciente.sexo || '',
      turma: paciente.turma || '',
      etnia: paciente.etnia || '', 
      peso: paciente.peso || '',   
      altura: paciente.altura || '', 
      cartaoSus: paciente.cartaoSus || '',
      bairro: paciente.endereco_bairro || '',
      rua: paciente.endereco_rua || '',
      
      // Mapeamento do mapa de saúde interno
      cid: saudeMap.cids?.[0] || dQuest.cid || '',
      alergias: { 
        possui: saudeMap.temAlergia || dQuest.alergias?.possui || 'não', 
        detalhes: saudeMap.alergiasDesc || dQuest.alergias?.detalhes || '' 
      },
      medicacaoContinua: { 
        possui: saudeMap.usaMedicamento || dQuest.medicacaoContinua?.possui || 'não', 
        detalhes: saudeMap.medicamentoDesc || dQuest.medicacaoContinua?.detalhes || '' 
      },
      restricaoAlimentar: { 
        possui: saudeMap.restricaoAlimentar ? 'sim' : 'não', 
        detalhes: typeof saudeMap.restricaoAlimentar === 'string' ? saudeMap.restricaoAlimentar : '' 
      },
      
      contatos: dQuest.contatos || [
        { 
          nome: paciente.contato1_nome || paciente.nomeMae || '', 
          telefone: paciente.contato1_telefone || '' 
        },
        { nome: '', telefone: '' }
      ]
    });
  };

  const buscarPorVinculoDireto = async ({ nome, dataNasc, tipo }) => {
    if (!nome || !dataNasc) return toast.error("PREENCHA NOME E DATA.");
    if (!escolaUsuarioId) return toast.error("ERRO: UNIDADE NÃO IDENTIFICADA.");
    
    handleLimparTudo();
    setFetching(true);
    const tId = toast.loading("Sincronizando...");
    
    try {
      const nomeBusca = normalizeParaBanco(nome);
      const colecao = tipo === 'aluno' ? "cadastro_aluno" : "funcionarios";
      
      // Busca pelo campo unidadeid (conforme seu banco)
      const q = query(
        collection(db, colecao), 
        where("unidadeid", "==", escolaUsuarioId), 
        where("nome", "==", nomeBusca),
        where("dataNascimento", "==", dataNasc),
        limit(1)
      );
      
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("PACIENTE NÃO LOCALIZADO.", { id: tId });
        return;
      }

      await selecionarPaciente({ id: snap.docs[0].id, ...snap.docs[0].data() });
      toast.success("Vínculo encontrado!", { id: tId });
    } catch (error) {
      console.error(error);
      toast.error("Erro na busca.");
    } finally { 
      setFetching(false); 
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.pacienteId) return toast.error("VINCULE UM PACIENTE.");

    setLoading(true);
    const tId = toast.loading("Salvando...");
    try {
      const batch = writeBatch(db);
      
      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        (typeof value === 'string' && key !== 'pacienteId' && key !== 'dataNascimento') 
          ? normalizeParaBanco(value) 
          : value
      );

      payload.updatedAt = serverTimestamp();
      payload.unidadeId = escolaUsuarioId; // Alinhado com a regra de segurança
      payload.profissionalNome = user?.nome;

      batch.set(doc(db, "questionarios_saude", formData.pacienteId), payload, { merge: true });
      batch.set(doc(db, "pastas_digitais", formData.pacienteId), {
        temQuestionarioSaude: true,
        dataUltimaAtualizacaoSaude: serverTimestamp(),
        usuarioResponsavel: user?.nome,
        unidadeId: escolaUsuarioId // Importante para as regras de segurança
      }, { merge: true });

      await batch.commit();
      toast.success("Prontuário salvo!", { id: tId });
      if (onSucesso) onSucesso();
    } catch (error) { 
      console.error(error);
      toast.error("Erro ao salvar."); 
    } finally { 
      setLoading(false); 
    }
  };

  return { 
    formData, loading, fetching, 
    handleChange: (path, value) => setFormData(prev => ({ ...prev, [path]: value })), 
    handleContactChange: (i, field, value) => {
      const novos = [...formData.contatos];
      novos[i][field] = value;
      setFormData(prev => ({ ...prev, contatos: novos }));
    },
    buscarPorVinculoDireto, handleSubmit, handleLimparTudo
  };
};