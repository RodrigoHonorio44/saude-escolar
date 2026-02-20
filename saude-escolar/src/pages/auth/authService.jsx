import { auth, db } from '../config/firebase'; // Ajuste o caminho conforme seu projeto
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export const cadastrarUsuarioService = async (dados) => {
  try {
    // 1. Cria o login no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      dados.email.trim().toLowerCase(), 
      dados.password
    );
    
    const uid = userCredential.user.uid;

    // 2. Monta o objeto padronizado em lowercase
    const usuarioFinal = {
      uid: uid,
      nome: dados.nome.toLowerCase(),
      email: dados.email.toLowerCase(),
      role: dados.role.toLowerCase(),
      registroProfissional: dados.registroProfissional?.toLowerCase() || "n/a",
      escolaId: dados.escolaId.toLowerCase(),
      unidade: dados.unidade.toLowerCase(),
      modulosSidebar: dados.modulosSidebar,
      status: 'ativo',
      statusLicenca: 'ativa',
      dataCadastro: Timestamp.now(),
      dataExpiracao: dados.dataExpiracao,
      createdAt: new Date().toISOString(),
      primeiroAcesso: true
    };

    // 3. Salva na coleção 'users'
    await setDoc(doc(db, "users", uid), usuarioFinal);

    return { success: true, uid };
  } catch (error) {
    throw error;
  }
};