import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../config/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Adicionei o signOut
import { doc, getDoc } from 'firebase/firestore';
import { monitorarLicenca } from '../services/licencaService'; // Importando seu novo monitor

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para deslogar (usada pelo monitor de licença)
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    let unsubscribeMonitor = null; // Guardamos o monitor aqui para poder parar ele depois

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("SISTEMA R S - Verificando Auth...");
      
      if (firebaseUser) {
        // 1. Busca os dados iniciais
        const docRef = doc(db, "users", firebaseUser.uid); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          setUser({ 
            uid: firebaseUser.uid, 
            ...data,
            nome: data.nome?.toLowerCase() || 'usuário r s',
            role: data.role?.toLowerCase() || 'enfermeiro',
            email: firebaseUser.email?.toLowerCase()
          });

          // 🛡️ 2. ATIVA O MONITOR DE LICENÇA (VIGILÂNCIA EM TEMPO REAL)
          // Se o monitor detectar bloqueio ou expiração, chama o handleLogout
          unsubscribeMonitor = monitorarLicenca(firebaseUser.uid, () => {
            console.log("🚨 SISTEMA R S - Bloqueio detectado via Monitor!");
            handleLogout();
          });

        } else {
          // Caso o documento não exista no Firestore mas exista no Auth
          setUser({ 
            uid: firebaseUser.uid, 
            role: firebaseUser.email === "rodrigohono21@gmail.com" ? "root" : "enfermeiro",
            email: firebaseUser.email?.toLowerCase()
          });
        }
      } else {
        setUser(null);
        // Se deslogou, paramos de monitorar
        if (unsubscribeMonitor) unsubscribeMonitor();
      }
      setLoading(false);
    });

    // Cleanup ao desmontar o componente
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
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}