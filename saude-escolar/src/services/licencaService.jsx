import { auth, db, firebaseConfig } from '../config/firebase'; // Adicione o firebaseConfig aqui
import { initializeApp } from 'firebase/app'; // Necessário para a instância secundária
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * ✅ CADASTRO PADRÃO R S (Versão Anti-Expulsão)
 * Cria o usuário em uma instância separada para você continuar logado como Root.
 */
export const cadastrarUsuarioService = async (dados) => {
  // 1. Cria uma "bolha" (App Secundário) para não afetar seu login de Admin
  const secondaryApp = initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 2. Cria o acesso usando a instância secundária
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      dados.email.toLowerCase().trim(), 
      dados.password
    );

    const uid = userCredential.user.uid;
    const agora = new Date();
    const dataExp = new Date();
    dataExp.setDate(agora.getDate() + (dados.prazo || 365));

    const userRef = doc(db, "users", uid);

    const novoUsuario = {
      uid: uid,
      nome: dados.nome.toLowerCase().trim(),
      email: dados.email.toLowerCase().trim(),
      role: dados.role.toLowerCase(),
      registroProfissional: dados.registroProfissional?.toUpperCase() || '',
      
      escola: dados.unidade.toLowerCase().trim(), 
      escolaId: dados.unidadeId.toLowerCase().trim(),
      unidade: dados.unidade.toLowerCase().trim(),
      unidadeId: dados.unidadeId.toLowerCase().trim(),

      status: 'ativo',
      statusLicenca: 'ativa',
      licencaStatus: 'ativa',
      primeiroAcesso: true,
      requirePasswordChange: true,
      currentSessionId: "",

      createdAt: agora.toISOString(), 
      dataCadastro: serverTimestamp(), 
      dataExpiracao: Timestamp.fromDate(dataExp), 

      modulosSidebar: {
        atendimento: dados.modulosSidebar?.atendimento ?? true,
        dashboard: dados.modulosSidebar?.dashboard ?? true,
        dashboard_admin: dados.modulosSidebar?.dashboard_admin ?? false,
        espelho: true,
        pacientes: true,
        pasta_digital: true,
        relatorios: true,
        saude_escolar: true,
        saude_inclusiva: true,
      }
    };

    // 3. Salva no banco principal (db)
    await setDoc(userRef, novoUsuario);

    // 4. Finaliza a sessão secundária e destrói a instância para limpar memória
    await signOut(secondaryAuth);
    await secondaryApp.delete();

    return { success: true, id: uid };

  } catch (error) {
    // Se der erro, mata a instância secundária para não travar o navegador
    await secondaryApp.delete();
    console.error("Erro ao cadastrar na coleção users:", error);
    throw error;
  }
};

/**
 * 🔄 RENOVAÇÃO DE LICENÇA
 */
export const renovarLicencaService = async (userId, dias) => {
  try {
    const userRef = doc(db, "users", userId);
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + dias);

    await updateDoc(userRef, {
      dataExpiracao: Timestamp.fromDate(novaData),
      status: 'ativo',
      licencaStatus: 'ativa',
      primeiroAcesso: false, 
      ultimaRenovacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao renovar licença:", error);
    throw error;
  }
};

/**
 * 🛡️ MONITORAMENTO EM TEMPO REAL
 */
export const monitorarLicenca = (userId, onBlock) => {
  if (!userId) return;

  const userDoc = doc(db, "users", userId);

  return onSnapshot(userDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
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