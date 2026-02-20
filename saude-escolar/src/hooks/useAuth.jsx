import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase'; // Verifique se o caminho está correto
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ⚠️ ATENÇÃO: Verifique se sua coleção no Firebase é 'users' ou 'usuarios'
        // No código anterior você usou 'usuarios', aqui está 'users'.
        const docRef = doc(db, "usuarios", firebaseUser.uid); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // ✅ NORMALIZAÇÃO R S: Garante que os dados lidos estejam em lowercase
          setUser({ 
            uid: firebaseUser.uid, 
            ...data,
            nome: data.nome?.toLowerCase() || 'usuário r s',
            role: data.role?.toLowerCase() || 'enfermeiro',
            email: firebaseUser.email?.toLowerCase()
          });
        } else {
          setUser({ 
            uid: firebaseUser.uid, 
            role: 'enfermeiro',
            email: firebaseUser.email?.toLowerCase()
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}