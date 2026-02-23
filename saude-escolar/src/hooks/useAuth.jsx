import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ✅ CORREÇÃO R S: Alterado de 'usuarios' para 'users'
        const docRef = doc(db, "users", firebaseUser.uid); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // ✅ PADRONIZAÇÃO R S: Tudo em lowercase conforme solicitado [2026-01-24]
          setUser({ 
            uid: firebaseUser.uid, 
            ...data,
            nome: data.nome?.toLowerCase() || 'usuário r s',
            role: data.role?.toLowerCase() || 'enfermeiro',
            email: firebaseUser.email?.toLowerCase(),
            unidade: data.unidade?.toLowerCase() || '',
            escola: data.escola?.toLowerCase() || ''
          });
        } else {
          // Fallback seguro caso o documento ainda não exista na 'users'
          setUser({ 
            uid: firebaseUser.uid, 
            role: firebaseUser.email === "rodrigohono21@gmail.com" ? 'root' : 'enfermeiro',
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