import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// ✅ Importações necessárias para o Cache
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// 🚨 ADICIONADO 'export' PARA PERMITIR INSTÂNCIA SECUNDÁRIA (ANTI-LOGOUT)
export const firebaseConfig = {
  apiKey: "AIzaSyDh3TqDTChoHOH5orZ0dn-8cuMzWUtPQl8",
  authDomain: "saude-escolar-e2bac.firebaseapp.com",
  projectId: "saude-escolar-e2bac",
  storageBucket: "saude-escolar-e2bac.firebasestorage.app",
  messagingSenderId: "107995000337",
  appId: "1:107995000337:web:0000e2d73fe8b73d258bb0"
};

const app = initializeApp(firebaseConfig);

// ✅ Configuração Econômica: Ativa persistência de dados
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() // Evita conflitos se abrir várias abas
  })
});

export const auth = getAuth(app);