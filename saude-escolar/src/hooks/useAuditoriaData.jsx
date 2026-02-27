import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const useAuditoriaData = (user) => {
  const [data, setData] = useState({ atendimentos: [], alunos: [], questionarios: [], loading: true });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.unidadeid) return;

      // 🔍 TENTATIVA DE CACHE: Se já buscamos nos últimos 5 minutos, não busca de novo
      const lastFetch = localStorage.getItem(`last_fetch_${user.unidadeid}`);
      const now = Date.now();
      
      if (lastFetch && (now - lastFetch < 300000)) { // 5 minutos
        const cached = localStorage.getItem(`cache_auditoria_${user.unidadeid}`);
        if (cached) {
          setData({ ...JSON.parse(cached), loading: false });
          return;
        }
      }

      try {
        const unid = user.unidadeid.toLowerCase().trim();
        
        // Promessas paralelas para ganhar tempo
        const [snapAtend, snapAlunos, snapQuest] = await Promise.all([
          getDocs(query(collection(db, "atendimento_enfermagem"), where("unidadeid", "==", unid))),
          getDocs(query(collection(db, "cadastro_aluno"), where("unidadeid", "==", unid))),
          getDocs(query(collection(db, "pastas_digitais"), where("escolaId", "==", unid)))
        ]);

        const payload = {
          atendimentos: snapAtend.docs.map(d => d.data()),
          alunos: snapAlunos.docs.map(d => d.data()),
          questionarios: snapQuest.docs.map(d => d.data()),
          loading: false
        };

        // Salva no Cache para evitar leituras repetidas ao trocar de aba
        localStorage.setItem(`cache_auditoria_${user.unidadeid}`, JSON.stringify(payload));
        localStorage.setItem(`last_fetch_${user.unidadeid}`, now.toString());

        setData(payload);
      } catch (e) {
        console.error("Erro na Auditoria (Economia Firebase):", e);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [user?.unidadeid]);

  return data;
};