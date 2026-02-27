import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../config/firebase'; 
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';

const useDashboardSaudeInclusiva = (user) => {
  const [alunosEspeciais, setAlunosEspeciais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("todos");

  useEffect(() => {
    const buscarAlunosEspeciais = async () => {
      if (!auth.currentUser || !user) return;
      
      setLoading(true);
      try {
        const cargoLower = user?.role?.toLowerCase() || "";
        const isRoot = cargoLower === 'root' || user?.email === "rodrigohono21@gmail.com";
        const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';

        let q;
        
        // Lógica de Filtro por Hierarquia
        if (isRoot && !modoInspecao) {
          q = query(collection(db, "pastas_digitais"), orderBy("nome", "asc"));
        } else {
          const idParaFiltro = user.escolaId?.toLowerCase().trim();
          if (!idParaFiltro) {
             setAlunosEspeciais([]);
             return;
          }
          q = query(
            collection(db, "pastas_digitais"), 
            where("escolaId", "==", idParaFiltro),
            orderBy("nome", "asc")
          );
        }

        const snap = await getDocs(q);
        
        // Filtro inicial para garantir que apenas PCDs entrem na lista
        const lista = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(a => {
            const marcadorPCD = a.isPCD?.toString().toLowerCase().trim() === "sim";
            const temCategoria = (a.categoriasPCD && a.categoriasPCD.length > 0) || (a.tipoNecessidade);
            return marcadorPCD && temCategoria;
          });

        setAlunosEspeciais(lista);
      } catch (error) {
        console.error("Erro ao carregar PCDs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    buscarAlunosEspeciais();
  }, [user]); 

  // Lógica de Filtragem e Busca
  const dadosFiltrados = useMemo(() => {
    let base = [...alunosEspeciais];

    if (abaAtiva === "tea") {
      base = base.filter(a => 
        a.categoriasPCD?.includes("tea") || 
        a.tipoNecessidade?.toLowerCase().includes("tea") || 
        a.tipoNecessidade?.toLowerCase().includes("autismo")
      );
    } else if (abaAtiva === "tdah") {
      base = base.filter(a => 
        a.categoriasPCD?.includes("tdah") || 
        a.tipoNecessidade?.toLowerCase().includes("tdah")
      );
    } else if (abaAtiva === "outros") {
      base = base.filter(a => {
        const cats = a.categoriasPCD || [];
        const n = a.tipoNecessidade?.toLowerCase() || "";
        const ehTea = cats.includes("tea") || n.includes("tea") || n.includes("autismo");
        const ehTdah = cats.includes("tdah") || n.includes("tdah");
        return !ehTea && !ehTdah; 
      });
    }

    if (filtro) {
      const termo = filtro.toLowerCase().trim();
      base = base.filter(a => a.nome?.toLowerCase().includes(termo));
    }

    return base;
  }, [alunosEspeciais, abaAtiva, filtro]);

  return {
    alunosEspeciais,
    dadosFiltrados,
    loading,
    filtro,
    setFiltro,
    abaAtiva,
    setAbaAtiva
  };
};

export default useDashboardSaudeInclusiva;