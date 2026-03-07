const admin = require('firebase-admin');

// 1. Baixe sua chave privada no console do Firebase:
// Configurações do Projeto > Contas de Serviço > Gerar nova chave privada
const serviceAccount = require("./caminho-para-sua-chave.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const definirPoderes = async (uid, escolaId, role) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { 
      escolaId: escolaId, 
      role: role,
      licenca: "ativa" 
    });
    console.log("✅ Sucesso! O crachá digital foi entregue ao usuário.");
  } catch (error) {
    console.error("❌ Erro:", error);
  }
};

// COLOQUE OS DADOS AQUI E RODE O SCRIPT
definirPoderes("ID_DO_USUARIO_AQUI", "ID_DA_ESCOLA", "enfermeiro");