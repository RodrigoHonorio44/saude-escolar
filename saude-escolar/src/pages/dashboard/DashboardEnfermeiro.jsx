import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db, auth } from "../../config/firebase"; 
import { doc, onSnapshot, collection, getDocs, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Brain, 
  Menu, Sun, Moon, LifeBuoy, BarChart3, 
  Contact, Zap, Construction, Mail
} from "lucide-react";

// Importe o componente de cadastro
import FormCadastroAluno from '../alunos/cadastro/FormCadastroAluno'; 

// ✅ Definido fora do componente para evitar re-criação e ReferenceError
const MENU_ESTRUTURA = [
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

const Placeholder = ({ title }) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-10 animate-in fade-in">
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

  // ✅ PADRÃO R S: Identificação de Permissões
  const cargoLower = useMemo(() => user?.role?.toLowerCase() || "", [user]);
  const isRoot = useMemo(() => cargoLower === 'root' || user?.email === "rodrigohono21@gmail.com", [cargoLower, user]);

  const isLiberado = useCallback((itemKey) => {
    if (isRoot || cargoLower === "admin") return true;
    if (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') return false;
    return user?.modulosSidebar?.[itemKey] === true;
  }, [isRoot, cargoLower, user]);

  // ✅ Contexto de Unidade Otimizado
  const userContext = useMemo(() => {
    const inspecaoId = localStorage.getItem('inspecao_unidade_id'); 
    const inspecaoNome = localStorage.getItem('inspecao_unidade_nome'); 
    const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';

    if (modoInspecao && isRoot && inspecaoId) {
      return { 
        ...user, 
        escolaId: inspecaoId.toLowerCase().trim(), 
        unidade: inspecaoNome?.toLowerCase().trim() || "Unidade em Inspeção" 
      };
    }
    return user;
  }, [user, isRoot]);

  // ✅ Sincronização em tempo real (Firebase Economy)
  useEffect(() => {
    const userId = initialUser?.uid || initialUser?.id;
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "usuarios", userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(prev => ({ ...prev, ...data, id: docSnap.id }));
      }
    });

    return () => unsub(); // Limpeza de memória
  }, [initialUser?.uid, initialUser?.id]);

  const handleLogoutClick = async () => {
    try { 
      localStorage.clear();
      if (onLogout) await onLogout(); 
      await signOut(auth); 
      window.location.replace("/login"); 
    } catch (error) { console.error("Erro RS Logout:", error); }
  };

  // ✅ Renderização de Conteúdo Dinâmica
  const renderContent = () => {
    const currentUnidade = userContext?.unidade || user?.unidade || "Não vinculada";
    
    // Dados para o Form (Passando o objeto user completo para o Form ter acesso ao Registro e Role no Header interno)
    const contextData = {
      ...user,
      unidadeid: (userContext?.escolaId || user?.escolaId || "").toLowerCase(),
      unidade: currentUnidade.toLowerCase(),
      escola: currentUnidade.toLowerCase()
    };

    if (activeTab === "pacientes" && cadastroMode === "aluno") {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FormCadastroAluno 
            usuarioLogado={contextData}
            onVoltar={() => setActiveTab("home")}
            onSucesso={() => setActiveTab("pasta_digital")}
          />
        </div>
      );
    }

    const currentLabel = MENU_ESTRUTURA.find(i => i.id === activeTab)?.label || "Dashboard";
    return <Placeholder title={`${currentLabel} - ${currentUnidade.toUpperCase()}`} />;
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans ${darkMode ? "bg-black text-white" : "bg-slate-50 text-slate-900"}`}>
      
      {/* SIDEBAR */}
      <aside className={`${isExpanded ? "w-72" : "w-24"} ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex flex-col border-r transition-all duration-300 shadow-2xl relative z-50`}>
        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-12 flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><Zap size={24} fill="white"/></div>
            {isExpanded && <h2 className="text-2xl font-black uppercase italic tracking-tighter">BAENF<span className="text-blue-600">.RS</span></h2>}
          </div>

          <nav className="space-y-2">
            {MENU_ESTRUTURA.map((item) => {
              const liberado = isLiberado(item.key);
              const isActive = activeTab === item.id;
              
              return (
                <div key={item.id}>
                  <button 
                    onClick={() => {
                      if (item.subItems) setMenuAberto(menuAberto === item.id ? null : item.id);
                      else { setActiveTab(item.id); setMenuAberto(null); }
                    }}
                    disabled={!liberado}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                      !liberado ? "opacity-20 grayscale cursor-not-allowed" : 
                      isActive ? "bg-blue-600 text-white shadow-xl scale-[1.02]" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {item.icon}
                      {isExpanded && <span className="text-[10px] font-black uppercase italic tracking-wider">{item.label}</span>}
                    </div>
                    {item.subItems && isExpanded && <ChevronDown size={14} className={menuAberto === item.id ? "rotate-180" : ""} />}
                  </button>

                  {item.subItems && menuAberto === item.id && isExpanded && (
                    <div className="mt-2 ml-6 space-y-1 border-l-2 border-slate-200 pl-4 animate-in slide-in-from-left-2">
                      {item.subItems.map(sub => (
                        <button 
                          key={sub.id} 
                          onClick={() => { setActiveTab("pacientes"); setCadastroMode(sub.id); }}
                          className={`w-full text-left py-2 px-3 rounded-xl text-[10px] font-black uppercase italic transition-colors ${
                            cadastroMode === sub.id && activeTab === "pacientes" ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* RODAPÉ DA SIDEBAR COM EMAIL */}
        <div className="p-8 border-t border-slate-100 space-y-3">
           <button onClick={handleLogoutClick} className="flex items-center gap-4 text-rose-500 font-black uppercase italic text-[11px] hover:text-rose-700 transition-colors">
             <LogOut size={18}/> {isExpanded && "Encerrar Sessão"}
           </button>

           {isExpanded && user?.email && (
             <div className="flex items-center gap-2 px-1 opacity-50">
               <Mail size={12} className="text-slate-400" />
               <span className="text-[9px] font-bold text-slate-500 truncate lowercase">{user.email}</span>
             </div>
           )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-24 border-b flex items-center justify-between px-10 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-400"><Menu size={24}/></button>
            <div className="flex flex-col">
              <h1 className="text-sm font-black uppercase italic tracking-[0.2em] text-slate-400 leading-none">
                {MENU_ESTRUTURA.find(i => i.id === activeTab)?.label || "Dashboard"}
              </h1>
              <p className="text-lg font-black uppercase tracking-tighter mt-1">{userContext?.unidade || "Unidade"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
               <p className="text-[9px] font-black text-slate-400 uppercase italic">Profissional </p>
               <p className="text-xs font-black text-blue-600 uppercase leading-tight">{user?.nome || "Usuário"}</p>
               {/* ADICIONADO ROLE E REGISTRO PROFISSIONAL NO HEADER */}
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                {user?.role} • REG: {user?.registroProfissional || "N/A"}
               </p>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all">
              {darkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20}/>}
            </button>
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