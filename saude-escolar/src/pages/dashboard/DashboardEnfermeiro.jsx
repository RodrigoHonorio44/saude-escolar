import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../../config/firebase"; 
import { doc, onSnapshot, collection, getDocs, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Brain, 
  Menu, Sun, Moon, LifeBuoy, BarChart3, 
  Contact, Zap, Construction
} from "lucide-react";

const Placeholder = ({ title }) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-10">
    <Construction size={48} className="mb-4 text-blue-500" />
    <h2 className="text-xl font-black uppercase italic tracking-tighter">{title}</h2>
    <p className="text-xs uppercase font-bold mt-2">Módulo em desenvolvimento no Rodhon System</p>
  </div>
);

const DashboardEnfermeiro = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("home");
  const [cadastroMode, setCadastroMode] = useState("aluno");
  const [menuAberto, setMenuAberto] = useState(null); 
  const [isExpanded, setIsExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false); 
  const [atendimentosRaw, setAtendimentosRaw] = useState([]);
  const [alunosRaw, setAlunosRaw] = useState([]);

  // ✅ PADRÃO R S: Identificação Root
  const cargoLower = useMemo(() => user?.role?.toLowerCase() || "", [user]);
  const isRoot = useMemo(() => cargoLower === 'root' || user?.email === "rodrigohono21@gmail.com", [cargoLower, user]);

  // Recuperação de Inspeção (Vindo do DashboardRoot)
  const inspecaoId = localStorage.getItem('inspecao_unidade_id'); 
  const inspecaoNome = localStorage.getItem('inspecao_unidade_nome'); 
  const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';

  // ✅ SINCRONIZAÇÃO DE UNIDADE: Ajustado para o campo 'unidade' do seu banco
  const userContext = useMemo(() => {
    if (!user) return null;
    if (modoInspecao && isRoot) {
      return { 
        ...user, 
        escolaId: inspecaoId?.toLowerCase().trim(), 
        unidade: inspecaoNome?.toLowerCase().trim() 
      };
    }
    return user;
  }, [user, inspecaoId, inspecaoNome, modoInspecao, isRoot]);

  // Listener para manter os dados do usuário atualizados em tempo real
  useEffect(() => {
    const userId = initialUser?.uid || initialUser?.id;
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "usuarios", userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Normaliza para lowercase conforme padrão R S
        setUser({ id: docSnap.id, ...data });
      }
    });
    return () => unsub();
  }, [initialUser?.uid, initialUser?.id]);

  // Busca de Dados Filtrada por Unidade
  useEffect(() => {
    const fetchGlobalData = async () => {
      const currentUser = userContext || user;
      if (!currentUser) return; 

      try {
        let qAtend = collection(db, "atendimentos_enfermagem");
        let qAlunos = collection(db, "pastas_digitais");

        // Regra de Filtro: Root vê tudo, Enfermeiro vê apenas sua unidade
        if (!isRoot || modoInspecao) {
          const idParaFiltro = modoInspecao ? inspecaoId : currentUser?.escolaId;
          
          if (idParaFiltro) {
            const normalizedId = idParaFiltro.toLowerCase().trim();
            qAtend = query(qAtend, where("escolaId", "==", normalizedId));
            qAlunos = query(qAlunos, where("escolaId", "==", normalizedId));
          }
        }

        const [snapAtend, snapPastas] = await Promise.all([getDocs(qAtend), getDocs(qAlunos)]);
        setAtendimentosRaw(snapAtend.docs.map(d => ({ id: d.id, ...d.data() })));
        setAlunosRaw(snapPastas.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { 
        console.error("Erro R S na busca global:", err); 
      }
    };
    fetchGlobalData();
  }, [user, userContext, isRoot, modoInspecao, inspecaoId]);

  const handleLogoutClick = async () => {
    try { 
      localStorage.removeItem('inspecao_unidade_id');
      localStorage.removeItem('modo_inspecao');
      if (onLogout) await onLogout(); 
      await signOut(auth); 
      window.location.replace("/login"); 
    } catch (error) { console.error(error); }
  };

  const isLiberado = (itemKey) => {
    if (isRoot || cargoLower === "admin") return true;
    if (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') return false;
    return user?.modulosSidebar?.[itemKey] === true;
  };

  const menuItems = [
    { id: "home", label: "Painel Geral", icon: <LayoutDashboard size={20} />, key: "dashboard" },
    { id: "atendimento", label: "Ficha de Atendimento", icon: <Stethoscope size={20} />, key: "atendimento" },
    { id: "alunos_especiais", label: "Saúde Inclusiva", icon: <Brain size={20} />, key: "saude_inclusiva" },
    { id: "contato", label: "Busca de Contatos", icon: <Contact size={20} />, key: "espelho" },
    { id: "pasta_digital", label: "Prontuário Digital", icon: <FolderSearch size={20} />, key: "pasta_digital" },
    { 
      id: "pacientes", label: "Novos Registros", icon: <UserPlus size={20} />, key: "pacientes",
      subItems: [{ id: "aluno", label: "Alunos" }, { id: "funcionario", label: "Funcionários" }, { id: "saude_escolar", label: "Ficha Médica" }]
    }, 
    { id: "historico", label: "Arquivo BAENF", icon: <ClipboardList size={20} />, key: "relatorios" },
    { id: "auditoria", label: "Relatórios Pro", icon: <BarChart3 size={20} />, key: "auditoria_pro" },
  ];

  const renderContent = () => {
    const currentUnidade = userContext?.unidade || user?.unidade || "Não definida";
    switch (activeTab) {
      case "home": return <Placeholder title={`Dashboard - ${currentUnidade.toUpperCase()}`} />;
      case "atendimento": return <Placeholder title="Módulo de Atendimento" />;
      case "pacientes": return <Placeholder title={`Cadastro de ${cadastroMode.toUpperCase()}`} />;
      default: return <Placeholder title="Módulo Rodhon System" />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans ${darkMode ? "bg-black" : "bg-slate-50"}`}>
      {/* SIDEBAR */}
      <aside className={`${isExpanded ? "w-72" : "w-24"} ${darkMode ? "bg-[#020617]" : "bg-white"} flex flex-col border-r ${darkMode ? "border-slate-800" : "border-slate-200"} transition-all duration-300 relative shadow-2xl`}>
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="mb-12 flex items-center gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><Zap size={24} fill="white"/></div>
              {isExpanded && <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}>BAENF<span className="text-blue-600">.RS</span></h2>}
          </div>

          <nav className="space-y-3">
            {menuItems.map((item) => {
              const liberado = isLiberado(item.key);
              const isActive = activeTab === item.id;
              return (
                <div key={item.id}>
                  <button 
                    onClick={() => { 
                      if(item.subItems) setMenuAberto(menuAberto === item.id ? null : item.id); 
                      else { setActiveTab(item.id); setMenuAberto(null); }
                    }} 
                    disabled={!liberado} 
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${!liberado ? "opacity-10 grayscale cursor-not-allowed" : isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                  >
                    <div className="flex items-center gap-4">
                      {item.icon} {isExpanded && <span className="text-[11px] font-black uppercase italic tracking-wider">{item.label}</span>}
                    </div>
                    {item.subItems && isExpanded && <ChevronDown size={14} className={`transition-transform ${menuAberto === item.id ? "rotate-180" : ""}`} />}
                  </button>
                  {item.subItems && menuAberto === item.id && isExpanded && (
                    <div className="mt-3 ml-6 space-y-2 border-l-2 border-slate-100 pl-6">
                      {item.subItems.map((sub) => (
                        <button key={sub.id} onClick={() => { setActiveTab(item.id); setCadastroMode(sub.id); }} className={`w-full text-left py-2 px-3 rounded-lg text-[10px] font-black uppercase italic transition-all ${cadastroMode === sub.id && activeTab === item.id ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"}`}>{sub.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-8 border-t border-slate-100 space-y-5">
            <button className="flex items-center gap-4 text-slate-400 font-black uppercase italic text-[11px] hover:text-blue-600 transition-colors"><LifeBuoy size={18}/> {isExpanded && "Central de Ajuda"}</button>
            <button onClick={handleLogoutClick} className="flex items-center gap-4 text-rose-500 font-black uppercase italic text-[11px] hover:text-rose-700 transition-colors"><LogOut size={18}/> {isExpanded && "Encerrar Sessão"}</button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-24 border-b flex items-center justify-between px-10 ${darkMode ? "bg-[#020617] border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-400"><Menu size={24}/></button>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <h1 className="text-sm font-black uppercase italic tracking-[0.2em] text-slate-400 leading-none">
                    {menuItems.find(i => i.id === activeTab)?.label || "Dashboard"}
                   </h1>
                   {modoInspecao && <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Modo Inspeção</span>}
                </div>
                <p className="text-lg font-black text-slate-800 uppercase tracking-tighter mt-1">
                  {userContext?.unidade || "Unidade Não Vinculada"}
                </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
               <p className="text-[10px] font-black text-slate-400 uppercase italic">Profissional Conectado</p>
               <p className="text-xs font-black text-blue-600 uppercase">{user?.nome || "Usuário"}</p>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all shadow-inner">{darkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-slate-600"/>}</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
          <div className="max-w-[1600px] mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardEnfermeiro;