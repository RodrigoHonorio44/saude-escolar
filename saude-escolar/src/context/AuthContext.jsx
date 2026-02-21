import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../config/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore';
import { monitorarLicenca } from '../services/licencaService'; 

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  useEffect(() => {
    let unsubscribeMonitor = null; 

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Limpa monitor anterior para evitar vazamento de memória e leituras extras
      if (unsubscribeMonitor) {
        unsubscribeMonitor();
        unsubscribeMonitor = null;
      }

      if (firebaseUser) {
        try {
          // 🎯 PADRÃO R S: Unificado na coleção 'users'
          const docRef = doc(db, "users", firebaseUser.uid); 
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // ✅ NORMALIZAÇÃO E CARREGAMENTO R S
            const usuarioDados = { 
              uid: firebaseUser.uid, 
              ...data,
              // Mapeamento de chaves para evitar erro de "Unidade não identificada"
              unidadeid: data.unidadeId || data.unidadeid || '',
              escolaid: data.escolaId || data.escolaid || '',
              
              // Padronização de valores em minúsculo para busca
              nome: data.nome?.toLowerCase() || 'usuário r s',
              role: data.role?.toLowerCase() || 'enfermeiro',
              unidade: data.unidade?.toLowerCase() || '',
              escola: data.escola?.toLowerCase() || '',
              email: firebaseUser.email?.toLowerCase(),
              
              // Flag de primeiro acesso para a rota protegida
              primeiroAcesso: data.primeiroAcesso || data.requirePasswordChange || false
            };

            setUser(usuarioDados);

            // 🛡️ MONITOR DE LICENÇA (SÓ PARA QUEM NÃO É ROOT)
            const isRoot = firebaseUser.email === "rodrigohono21@gmail.com" || data.role === 'root';
            
            if (!isRoot) {
              unsubscribeMonitor = monitorarLicenca(firebaseUser.uid, () => {
                console.log("🚨 SISTEMA R S - Licença Expirada ou Bloqueada!");
                handleLogout();
              });
            }

          } else {
            // Caso seja você (Root) e o doc ainda não exista na 'users'
            setUser({ 
              uid: firebaseUser.uid, 
              role: firebaseUser.email === "rodrigohono21@gmail.com" ? "root" : "enfermeiro",
              email: firebaseUser.email?.toLowerCase(),
              primeiroAcesso: false,
              unidadeid: '',
              escolaid: ''
            });
          }
        } catch (err) {
          console.error("Erro ao carregar perfil R S:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMonitor) unsubscribeMonitor();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}