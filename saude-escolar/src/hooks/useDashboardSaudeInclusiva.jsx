import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../config/firebase'; 
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';

const useDashboardSaudeInclusiva = (user) => {
  const [alunosEspeciais, setAlunosEspeciais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("todos");

  const tabelaCIDs = {
    // 🧠 TEA — Transtornos do Espectro Autista
    "f84.0": "autismo infantil",
    "f84.1": "autismo atípico",
    "f84.5": "síndrome de asperger",
    "f84.8": "outros transtornos invasivos do desenvolvimento",
    "f84.9": "transtorno invasivo do desenvolvimento não especificado",
    "6a02": "transtorno do espectro do autismo (cid-11)",

    // ⚡ TDAH e Transtornos Hipercinéticos
    "f90.0": "tdah tipo desatento",
    "f90.1": "tdah tipo hiperativo/impulsivo",
    "f90.8": "outros transtornos hipercinéticos",
    "f90.9": "transtorno hipercinético não especificado",
    "6a05": "tdah (cid-11)",

    // 📚 Transtornos de Aprendizagem
    "f81.0": "transtorno específico de leitura (dislexia)",
    "f81.1": "transtorno da ortografia",
    "f81.2": "transtorno da matemática (discalculia)",
    "f81.3": "transtorno misto das habilidades escolares",
    "f81.9": "transtorno de aprendizagem não especificado",

    // 🗣️ Linguagem e Comunicação
    "f80.0": "transtorno da articulação da fala",
    "f80.1": "transtorno da linguagem expressiva",
    "f80.2": "transtorno da linguagem receptiva",
    "f80.8": "outros transtornos do desenvolvimento da fala",
    "f80.9": "transtorno de fala não especificado",

    // 🎯 Desenvolvimento Motor e Global
    "f82": "transtorno do desenvolvimento da coordenação",
    "f83": "transtornos mistos do desenvolvimento",
    "f88": "outros transtornos do desenvolvimento psicológico",
    "f89": "transtorno do desenvolvimento não especificado",

    // 😠 Comportamento e Conduta
    "f91.0": "transtorno de conduta familiar",
    "f91.1": "transtorno de conduta socializado",
    "f91.2": "transtorno de conduta não socializado",
    "f91.3": "transtorno opositor desafiante (tod)",
    "f92.0": "transtorno misto de conduta e emoções",

    // 😰 Emoções e Ansiedade Infantil
    "f93.0": "ansiedade de separação",
    "f93.1": "fobia social infantil",
    "f93.2": "ansiedade generalizada infantil",
    "f93.8": "outros transtornos emocionais da infância",
    "f93.9": "transtorno emocional infantil não especificado",

    // 🧠 Intelectual
    "f70": "deficiência intelectual leve",
    "f71": "deficiência intelectual moderada",
    "f72": "deficiência intelectual grave",
    "f73": "deficiência intelectual profunda",
    "f79": "deficiência intelectual não especificada",

    // ♿ Outros e Acessibilidade
    "g80": "paralisia cerebral",
    "q90": "síndrome de down",
    "h54": "cegueira ou baixa visão",
    "h90": "deficiência auditiva"
  };

  useEffect(() => {
    const buscarAlunosEspeciais = async () => {
      if (!auth.currentUser || !user) return;
      setLoading(true);
      try {
        const idParaFiltro = (user.unidadeid || user.escolaId || "joana-benedicta-rangel").trim();
        
        const q = query(
          collection(db, "cadastro_aluno"), 
          where("unidadeid", "==", idParaFiltro)
        );

        const snap = await getDocs(q);
        
        const lista = snap.docs.map(doc => {
          const dados = doc.data();
          const cid = (dados.saude?.cids?.[0] || dados.cid || "").toLowerCase();
          const acess = dados.saude?.acessibilidades || [];
          const nec = (dados.tipoNecessidade || "").toLowerCase();

          // LÓGICA MULTI-CATEGORIA (Para o aluno aparecer em várias abas)
          let categorias = [];
          
          // 1. Deficiência Auditiva
          if (cid.startsWith("h90") || acess.includes("surdo") || acess.includes("mudo") || acess.includes("auditiva")) {
            categorias.push("auditiva");
          } 
          // 2. Deficiência Visual
          if (cid.startsWith("h54") || acess.includes("cego") || acess.includes("visual")) {
            categorias.push("visual");
          } 
          // 3. Locomoção
          if (cid.startsWith("g80") || acess.includes("cadeirante") || acess.includes("muletas")) {
            categorias.push("locomocao");
          } 
          // 4. TEA
          if (cid.startsWith("f84") || cid === "6a02" || nec.includes("autismo") || acess.includes("tea")) {
            categorias.push("tea");
          } 
          // 5. TDAH
          if (cid.startsWith("f90") || cid === "6a05" || nec.includes("tdah") || acess.includes("tdah")) {
            categorias.push("tdah");
          } 
          // 6. Aprendizagem
          if (cid.startsWith("f81")) {
            categorias.push("aprendizagem");
          } 
          // 7. Linguagem
          if (cid.startsWith("f80")) {
            categorias.push("linguagem");
          } 
          // 8. Intelectual
          if (cid.startsWith("f7") || acess.includes("intelectual")) {
            categorias.push("intelectual");
          } 
          // 9. Comportamento
          if (cid.startsWith("f91") || cid.startsWith("f92")) {
            categorias.push("comportamento");
          } 
          // 10. Emocional
          if (cid.startsWith("f93")) {
            categorias.push("emocional");
          }

          // Se não caiu em nenhuma específica mas é PCD
          if (categorias.length === 0) {
            categorias.push("outros");
          }

          return { 
            id: doc.id, 
            ...dados,
            categoriasSaude: categorias, // Agora é um Array
            cidDescricao: tabelaCIDs[cid] || dados.tipoNecessidade || "Não especificado",
            nomeFormatado: dados.nome || dados.nomeExibicao || "Sem Nome"
          };
        })
        .filter(a => {
          const temCid = a.saude?.cids?.length > 0 || a.cid;
          const temAcess = a.saude?.acessibilidades?.length > 0;
          const ehPCD = a.isPCD === "sim" || a.saude?.temAlergia === "sim";
          return temCid || ehPCD || temAcess;
        });

        setAlunosEspeciais(lista);
      } catch (error) {
        console.error("Erro ao carregar Saúde Inclusiva:", error);
      } finally {
        setLoading(false);
      }
    };
    
    buscarAlunosEspeciais();
  }, [user]); 

  const dadosFiltrados = useMemo(() => {
    let base = [...alunosEspeciais];

    if (abaAtiva !== "todos") {
      // Verifica se a aba ativa está presente na lista de categorias do aluno
      base = base.filter(a => a.categoriasSaude.includes(abaAtiva));
    }

    if (filtro) {
      const termo = filtro.toLowerCase().trim();
      base = base.filter(a => 
        a.nomeFormatado.toLowerCase().includes(termo) || 
        (a.saude?.cids?.[0] || "").toLowerCase().includes(termo)
      );
    }

    return base;
  }, [alunosEspeciais, abaAtiva, filtro]);

  return { 
    alunosEspeciais, dadosFiltrados, loading, 
    filtro, setFiltro, abaAtiva, setAbaAtiva 
  };
};

export default useDashboardSaudeInclusiva;