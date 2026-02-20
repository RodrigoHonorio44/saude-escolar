import { db } from '../config/firebase'; 
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * ✅ FUNÇÃO DE CADASTRO (O que estava faltando!)
 * Esta é a função que o seu componente CadastrarUsuario.jsx está pedindo.
 */
export const cadastrarUsuarioService = async (dados) => {
  try {
    // Usamos a coleção 'usuarios' conforme seu ControleLicencas monitora
    const usuariosRef = collection(db, "usuarios");

    const novoUsuario = {
      nome: dados.nome.toLowerCase().trim(),
      email: dados.email.toLowerCase().trim(),
      role: dados.role.toLowerCase(),
      escolaId: dados.escolaId ? dados.escolaId.toLowerCase() : '',
      unidade: dados.unidade ? dados.unidade.toLowerCase() : '',
      registroProfissional: dados.registroProfissional || '',
      
      // Status e Licença
      status: 'ativo',
      statusLicenca: 'ativa',
      licencaStatus: 'ativa',
      
      // Datas
      createdAt: serverTimestamp(),
      ultimaRenovacao: serverTimestamp(),
      dataExpiracao: dados.dataExpiracao, // O formulário já envia o Timestamp/ISO
      
      // Módulos (Padrão 2026)
      modulosSidebar: dados.modulosSidebar || {
        dashboard: true,
        atendimento: true,
        relatorios: true
      }
    };

    const docRef = await addDoc(usuariosRef, novoUsuario);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao cadastrar no Firestore:", error);
    throw error;
  }
};

/**
 * 🛡️ MONITORAMENTO EM TEMPO REAL
 */
export const monitorarLicenca = (userId, onBlock) => {
  if (!userId) return;

  // Monitora na coleção usuarios (Padrão R S)
  const userDoc = doc(db, "usuarios", userId);

  return onSnapshot(userDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 🛡️ TRAVA MESTRE ROOT: Rodrigo Honorío imune
      const emailRoot = "rodrigohono21@gmail.com";
      if (data.email?.toLowerCase() === emailRoot || data.role?.toLowerCase() === 'root') {
        return; 
      }

      const hoje = new Date();
      const dataExp = data.dataExpiracao?.seconds 
        ? new Date(data.dataExpiracao.seconds * 1000) 
        : new Date(data.dataExpiracao);

      const statusBloqueado = 
        data.licencaStatus?.toLowerCase().trim() === 'bloqueada' || 
        data.status?.toLowerCase().trim() === 'bloqueado';

      const expirou = data.dataExpiracao && hoje > dataExp;

      if (statusBloqueado || expirou) {
        onBlock();
      }
    }
  });
};