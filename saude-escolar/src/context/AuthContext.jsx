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

  // 1. MONITOR DE ESTADO DE AUTENTICAÇÃO
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid); 
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({ 
              uid: firebaseUser.uid, 
              ...data,
              unidadeid: (data.unidadeId || data.unidadeid || '').toLowerCase(),
              escolaid: (data.escolaId || data.escolaid || '').toLowerCase(),
              nome: data.nome || 'usuário r s',
              role: data.role?.toLowerCase() || 'enfermeiro',
              email: firebaseUser.email?.toLowerCase(),
              primeiroAcesso: data.primeiroAcesso || data.requirePasswordChange || false
            });
          } else {
            setUser({ 
              uid: firebaseUser.uid, 
              role: firebaseUser.email === "rodrigohono21@gmail.com" ? "root" : "enfermeiro",
              email: firebaseUser.email?.toLowerCase(),
              primeiroAcesso: false
            });
          }
        } catch (err) {
          console.error("Erro ao carregar perfil R S:", err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. MONITOR DE LICENÇA (Separado para evitar erros de Snapshot)
  useEffect(() => {
    let unsubscribeMonitor = null;

    // Só inicia o monitor se tiver usuário, se não for root e se o loading já acabou
    if (user && user.uid && user.role !== 'root' && !loading) {
      try {
        unsubscribeMonitor = monitorarLicenca(user.uid, (status) => {
          // Se o serviço de licença retornar que não está ativa
          console.log("🛡️ Validação de Licença R S executada.");
        }, () => {
          // Callback de erro ou licença inválida
          console.error("🚨 LICENÇA INVÁLIDA OU EXPIRADA!");
          handleLogout();
        });
      } catch (e) {
        console.error("Erro ao iniciar monitor:", e);
      }
    }

    return () => {
      if (unsubscribeMonitor) unsubscribeMonitor();
    };
  }, [user?.uid, loading]); // Só reativa se o ID do usuário mudar

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