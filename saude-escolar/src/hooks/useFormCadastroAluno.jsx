import { useForm } from 'react-hook-form';
import { db } from '../config/firebase';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
  prepararParaBanco, 
  calcularIdade, 
  gerarCarimboServidor 
} from '../utils/RegrasRodhon';

export const useFormCadastroAluno = (alunoParaEditar, dadosEdicao, defaultValues, onSucesso, usuarioLogado) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    mode: "onChange",
    defaultValues: (alunoParaEditar || dadosEdicao || defaultValues)
  });

  // Função para transformar texto do banco em exibição amigável
  const formatarParaExibicao = (texto) => {
    if (!texto || typeof texto !== 'string') return '';
    return texto.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const handleBuscaRapida = async (searchData, setShowSearch, setSearchData) => {
    if (!searchData.nome || !searchData.mae || !searchData.nasc) {
      return toast.error("PREENCHA NOME, MÃE E NASCIMENTO PARA BUSCAR!");
    }

    const idToast = toast.loading("LOCALIZANDO NO RODHON SYSTEM...");

    try {
      const nomeLimpo = searchData.nome.trim().toLowerCase();
      const maeLimpo = searchData.mae.trim().toLowerCase();
      const nascLimpo = searchData.nasc.replace(/-/g, '');
      
      const nomeP = nomeLimpo.split(' ');
      const maeP = maeLimpo.split(' ');
      const idBusca = `${nomeP[0]}-${nomeP[1] || ''}_${nascLimpo}_${maeP[0]}`;

      const docRef = doc(db, "cadastro_aluno", idBusca);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const d = docSnap.data();
        
        // Converte os dados salvos em minúsculas para o formato de exibição na tela
        const dadosFormatados = {
          ...d,
          nome: formatarParaExibicao(d.nome),
          nomeMae: formatarParaExibicao(d.nomeMae),
          nomePai: formatarParaExibicao(d.nomePai),
          endereco_rua: formatarParaExibicao(d.endereco_rua),
          endereco_bairro: formatarParaExibicao(d.endereco_bairro),
          endereco_cidade: formatarParaExibicao(d.endereco_cidade),
          contato1_nome: formatarParaExibicao(d.contato1_nome)
        };

        reset(dadosFormatados);
        setShowSearch(false);
        setSearchData({ nome: '', mae: '', nasc: '' });
        toast.success("CADASTRO LOCALIZADO E PREENCHIDO!", { id: idToast });
      } else {
        toast.error("ALUNO NÃO ENCONTRADO NA BASE.", { id: idToast });
      }
    } catch (error) {
      toast.error("ERRO AO ACESSAR O BANCO.", { id: idToast });
    }
  };

  const salvarDados = async (data) => {
    const idUnidade = usuarioLogado?.unidadeid || usuarioLogado?.unidadeId;
    if (!idUnidade) return toast.error("UNIDADE NÃO IDENTIFICADA!");

    const acaoSalvar = async () => {
      // REGRA: Tudo vira minúscula para o banco via util prepararParaBanco
      const dadosTratados = prepararParaBanco(data);
      
      const nomePartes = dadosTratados.nome.split(' ');
      const maePartes = dadosTratados.nomeMae.split(' ');
      const idUnico = `${nomePartes[0]}-${nomePartes[1] || ''}_${data.dataNascimento.replace(/-/g, '')}_${maePartes[0]}`;
      
      const payload = {
        ...dadosTratados,
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
      loading: 'SALVANDO NO RODHON SYSTEM...', 
      success: 'SUCESSO!', 
      error: 'ERRO AO SALVAR.' 
    });
  };

  return { register, handleSubmit, reset, watch, setValue, isSubmitting, handleBuscaRapida, salvarDados };
};