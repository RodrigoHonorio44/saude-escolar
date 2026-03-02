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
  
  // Captura o ID da unidade garantindo compatibilidade com diferentes nomes de campo
  const escolaUsuarioId = user?.unidadeid || user?.unidadeId || user?.escolaId;

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
    cpf: '',
    etnia: '',
    tipoSanguineo: '',
    pacienteId: '',
    cid: '',
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
      const questSnap = await getDoc(doc(db, "questionarios_saude", paciente.id));
      if (questSnap.exists()) dQuest = questSnap.data();
    } catch (error) {
      console.warn("Buscando apenas dados do cadastro base.");
    }

    const saudeMap = paciente.saude || {};

    setFormData({
      ...estadoInicial,
      ...dQuest, 
      
      // Dados de Identificação (Prioridade para o cadastro base)
      pacienteId: paciente.id,
      alunoNome: paciente.nomeExibicao || paciente.nome || '', 
      dataNascimento: paciente.dataNascimento || '',
      idade: paciente.idade?.toString() || '',
      sexo: paciente.sexo || '',
      turma: paciente.turma || '',
      cargo: paciente.cargo || '', 
      cpf: paciente.cpf || '',     
      etnia: paciente.etnia || '', 
      peso: paciente.peso || '',   
      altura: paciente.altura || '', 
      cartaoSus: paciente.cartaoSus || '',
      bairro: paciente.endereco_bairro || '',
      rua: paciente.endereco_rua || '',
      
      // Mapeamento do objeto 'saude' do cadastro de alunos
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
      
      // Unificação de contatos (Aluno vs Funcionário)
      contatos: dQuest.contatos || [
        { 
          nome: paciente.nomeContato1 || paciente.contato1_nome || paciente.nomeMae || '', 
          telefone: paciente.contato || paciente.contato1_telefone || '' 
        },
        { nome: paciente.nomePai || '', telefone: '' }
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
      const nomeBusca = normalizeParaBanco(nome); // Garante busca em lowercase
      const colecao = tipo === 'aluno' ? "cadastro_aluno" : "cadastro_funcionario";
      
      // Filtro obrigatório por unidadeid para segurança e isolamento de dados
      const q = query(
        collection(db, colecao), 
        where("unidadeid", "==", escolaUsuarioId), 
        where("nome", "==", nomeBusca),
        where("dataNascimento", "==", dataNasc),
        limit(1)
      );
      
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("REGISTRO NÃO LOCALIZADO NESTA UNIDADE. VERIFIQUE ACENTOS.", { id: tId });
        return;
      }

      await selecionarPaciente({ id: snap.docs[0].id, ...snap.docs[0].data() });
      toast.success("Dados carregados com sucesso!", { id: tId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o banco.");
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
      
      // Normalização de salvamento: tudo em minúsculo conforme diretrizes
      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        (typeof value === 'string' && !['pacienteId', 'dataNascimento'].includes(key)) 
          ? normalizeParaBanco(value) 
          : value
      );

      payload.updatedAt = serverTimestamp();
      payload.unidadeid = escolaUsuarioId; 
      payload.profissionalNome = user?.nome;

      batch.set(doc(db, "questionarios_saude", formData.pacienteId), payload, { merge: true });
      batch.set(doc(db, "pastas_digitais", formData.pacienteId), {
        temQuestionarioSaude: true,
        dataUltimaAtualizacaoSaude: serverTimestamp(),
        usuarioResponsavel: user?.nome,
        unidadeid: escolaUsuarioId 
      }, { merge: true });

      await batch.commit();
      toast.success("Prontuário salvo!", { id: tId });
      if (onSucesso) onSucesso();
    } catch (error) { 
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