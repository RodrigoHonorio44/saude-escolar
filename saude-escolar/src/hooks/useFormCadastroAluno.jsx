import { useForm } from 'react-hook-form';
import { db } from '../config/firebase';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
  prepararParaBanco, 
  gerarCarimboServidor,
  calcularIdade 
} from '../utils/RegrasRodhon';

export const useFormCadastroAluno = (alunoParaEditar, dadosEdicao, defaultValues, onSucesso, usuarioLogado) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    // Mantive a capitalização original na inicialização conforme sua preferência
    mode: "onChange",
    defaultValues: (alunoParaEditar || dadosEdicao || defaultValues)
  });

  /**
   * ✅ FORMATAÇÃO PARA EXIBIÇÃO:
   * Prioriza o campo 'nomeExibicao' (capitalização original salva).
   */
  const formatarParaExibicao = (texto, original = null) => {
    if (original) return original; 
    if (!texto || typeof texto !== 'string') return '';
    return texto.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  /**
   * ✅ NORMALIZAÇÃO PARA ID (TÉCNICO):
   * Remove acentos e espaços para o ID do documento no Firebase.
   */
  const normalizarParaId = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleBuscaRapida = async (searchData, setShowSearch, setSearchData) => {
    const idUnidade = usuarioLogado?.unidadeid || usuarioLogado?.unidadeId;
    
    if (!searchData.nome || !searchData.mae || !searchData.nasc) {
      return toast.error("PREENCHA NOME, MÃE E NASCIMENTO!");
    }

    if (!idUnidade) {
      return toast.error("ERRO: UNIDADE NÃO IDENTIFICADA!");
    }

    const idToast = toast.loading("VERIFICANDO ALUNO NO SISTEMA...");

    try {
      const nomeId = normalizarParaId(searchData.nome);
      const maeId = normalizarParaId(searchData.mae);
      const nascId = searchData.nasc.replace(/\D/g, '');
      
      const idBusca = `${nomeId}_${nascId}_${maeId}_${idUnidade}`;

      const docRef = doc(db, "pastas_digitais", idBusca);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const d = docSnap.data();
        
        const dadosFormatados = {
          ...d,
          nome: formatarParaExibicao(d.nome, d.nomeExibicao), 
          nomeMae: formatarParaExibicao(d.nomeMae, d.nomeMaeExibicao),
          nomePai: formatarParaExibicao(d.nomePai, d.nomePaiExibicao),
          endereco_rua: formatarParaExibicao(d.endereco_rua),
          endereco_bairro: formatarParaExibicao(d.endereco_bairro),
          endereco_cidade: formatarParaExibicao(d.endereco_cidade),
          contato1_nome: formatarParaExibicao(d.contato1_nome)
        };

        reset(dadosFormatados);
        setShowSearch(false);
        setSearchData({ nome: '', mae: '', nasc: '' });
        toast.success("ALUNO LOCALIZADO!", { id: idToast });
      } else {
        // 🚀 SE NÃO ACHAR: Preenche o formulário com os dados da busca para facilitar o cadastro
        const dataNascDigitada = searchData.nasc; // formato yyyy-mm-dd
        let idadeCalculada = "";

        if (dataNascDigitada) {
          const [ano, mes, dia] = dataNascDigitada.split('-');
          idadeCalculada = calcularIdade(`${dia}/${mes}/${ano}`);
        }

        reset({
          ...defaultValues,
          nome: searchData.nome,
          nomeMae: searchData.mae,
          dataNascimento: searchData.nasc,
          idade: idadeCalculada
        });

        setShowSearch(false);
        setSearchData({ nome: '', mae: '', nasc: '' });
        
        toast.error("ALUNO NÃO ENCONTRADO. DADOS COPIADOS PARA O FORMULÁRIO.", { 
          id: idToast,
          duration: 4000 
        });
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      toast.error("ERRO AO BUSCAR ALUNO.", { id: idToast });
    }
  };

  const salvarDados = async (data) => {
    const idUnidade = usuarioLogado?.unidadeid || usuarioLogado?.unidadeId;
    if (!idUnidade) return toast.error("UNIDADE NÃO IDENTIFICADA!");

    const acaoSalvar = async () => {
      // Salva tudo em lowercase conforme solicitado para padronização
      const dadosTratados = prepararParaBanco(data);
      
      const nomeId = normalizarParaId(data.nome);
      const maeId = normalizarParaId(data.nomeMae);
      const dataId = data.dataNascimento.replace(/\D/g, '');
      const idUnico = `${nomeId}_${dataId}_${maeId}_${idUnidade}`;
      
      const payload = {
        ...dadosTratados,
        // Mantém a capitalização original (ex: Rogeria dos Santos Silva)
        nomeExibicao: data.nome, 
        nomeMaeExibicao: data.nomeMae,
        nomePaiExibicao: data.nomePai,
        unidadeid: idUnidade,
        updatedAt: gerarCarimboServidor()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idUnico), payload, { merge: true });
      batch.set(doc(db, "cadastro_aluno", idUnico), payload, { merge: true });
      
      await batch.commit();
      reset(defaultValues);
      if (onSucesso) onSucesso();
    };

    await toast.promise(acaoSalvar(), { 
      loading: 'SINCRONIZANDO NO RODHON SYSTEM...', 
      success: 'DADOS SALVOS COM SUCESSO!', 
      error: 'ERRO AO SALVAR REGISTRO.' 
    });
  };

  return { register, handleSubmit, reset, watch, setValue, isSubmitting, handleBuscaRapida, salvarDados };
};