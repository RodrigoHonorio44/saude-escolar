import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db, auth } from "../../config/firebase"; 
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Brain, 
  Menu, Sun, Moon, BarChart3, 
  Contact, Zap, Construction, Mail, HeartPulse, AlertTriangle
} from "lucide-react";

// ✅ IMPORTAÇÕES EXISTENTES
import PainelGeralEnfermeiro from "./PainelGeralEnfermeiro"; 
import FormCadastroAluno from "../alunos/cadastro/FormCadastroAluno"; 
import FormCadastroFuncionario from "../funcionario/cadastro/FormCadastroFuncionario";
import AtendimentoEnfermagem from "../atendimento/cadastro/AtendimentoEnfermagem";
import QuestionarioSaude from "../dashboard/cadastro/QuestionarioSaude"; 

// 🔥 NOVAS IMPORTAÇÕES: SAÚDE INCLUSIVA, AUDITORIA, PRONTUÁRIO, CONTATOS E ARQUIVO
import DashboardSaudeInclusiva from "./DashboardSaudeInclusiva"; 
import DashboardAuditoria from "./DashboardAuditoria"; 
import ProntuarioDigital from "../alunos/ProntuarioDigital"; 
import BuscaContatos from "../alunos/BuscaContatos"; 
import ArquivoBaenf from "../atendimento/ArquivoBaenf"; // <--- NOVO COMPONENTE ADICIONADO

const MENU_ESTRUTURA = [
  { id: "home", label: "Painel Geral", icon: <LayoutDashboard size={20} />, key: "dashboard" },
  { id: "atendimento", label: "Ficha de Atendimento", icon: <Stethoscope size={20} />, key: "atendimento" },
  { id: "alunos_especiais", label: "Saúde Inclusiva", icon: <Brain size={20} />, key: "saude_inclusiva" },
  { id: "contato", label: "Busca de Contatos", icon: <Contact size={20} />, key: "espelho" },
  { id: "pasta_digital", label: "Prontuário Digital", icon: <FolderSearch size={20} />, key: "pasta_digital" },
  { 
    id: "pacientes", label: "Novos Registros", icon: <UserPlus size={20} />, key: "pacientes",
    subItems: [
      { id: "aluno", label: "Alunos" }, 
      { id: "funcionario", label: "Funcionários" }, 
      { id: "saude_escolar", label: "Ficha Médica" }
    ]
  }, 
  { id: "historico", label: "Arquivo BAENF", icon: <ClipboardList size={20} />, key: "relatorios" },
  { id: "auditoria", label: "Relatórios Pro", icon: <BarChart3 size={20} />, key: "auditoria_pro" },
];

const DashboardEnfermeiro = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("home");
  const [cadastroMode, setCadastroMode] = useState("aluno");
  const [menuAberto, setMenuAberto] = useState(null); 
  const [isExpanded, setIsExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false); 
  const [visaoMensal, setVisaoMensal] = useState(false);

  const [metricas, setMetricas] = useState({
    totalAlunos: 0,
    totalFuncionarios: 0,
    atendimentosDia: 0,
    atendimentosMes: 0,
    pendentes: 0,
    tempoMedio: 0,
    tempoMedioMes: 0
  });

  // 🛠 RESET DE EMERGÊNCIA
  const limparCacheAuditoria = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('cache_auditoria') || key.includes('last_fetch')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  const calcularMinutosConsulta = (inicio, fim) => {
    if (!inicio || !fim) return 0;
    try {
      const [h1, m1] = inicio.split(':').map(Number);
      const [h2, m2] = fim.split(':').map(Number);
      const totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
      return totalMinutos > 0 ? totalMinutos : 0;
    } catch (e) { return 0; }
  };

  const cargoLower = useMemo(() => user?.role?.toLowerCase() || "", [user]);
  const isRoot = useMemo(() => cargoLower === 'root' || user?.email === "rodrigohono21@gmail.com", [cargoLower, user]);

  const userContext = useMemo(() => {
    const inspecaoId = localStorage.getItem('inspecao_unidade_id'); 
    const inspecaoNome = localStorage.getItem('inspecao_unidade_nome'); 
    const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';

    if (modoInspecao && isRoot && inspecaoId) {
      return { 
        ...user, 
        unidadeid: inspecaoId.toLowerCase().trim(), 
        unidade: inspecaoNome?.toLowerCase().trim() || "unidade em inspeção" 
      };
    }
    return {
      ...user,
      unidadeid: user?.unidadeid?.toLowerCase().trim() || "",
      unidade: user?.unidade?.toLowerCase().trim() || ""
    };
  }, [user, isRoot]);

  const isLiberado = useCallback((itemKey) => {
    if (isRoot || cargoLower === "admin") return true;
    if (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') return false;
    return user?.modulosSidebar?.[itemKey] === true;
  }, [isRoot, cargoLower, user]);

  // 🛡️ MONITOR DE MÉTRICAS
  useEffect(() => {
    const unidId = userContext?.unidadeid;
    if (!unidId || unidId === "") return;

    const handleSyncError = (error) => {
      if (error.code === 'permission-denied') {
        console.log("ℹ️ Sincronização R S: Aguardando estabilização de permissões...");
      } else {
        console.error("Erro de sincronização:", error);
      }
    };

    const qAlunos = query(collection(db, "cadastro_aluno"), where("unidadeid", "==", unidId));
    const unsubAlunos = onSnapshot(qAlunos, (snap) => {
      setMetricas(prev => ({ ...prev, totalAlunos: snap.size }));
    }, handleSyncError);

    const qFunc = query(collection(db, "cadastro_funcionario"), where("unidadeid", "==", unidId));
    const unsubFunc = onSnapshot(qFunc, (snap) => {
      setMetricas(prev => ({ ...prev, totalFuncionarios: snap.size }));
    }, handleSyncError);

    const qAtend = query(collection(db, "atendimento_enfermagem"), where("unidadeid", "==", unidId));
    const unsubAtend = onSnapshot(qAtend, (snap) => {
      const agora = new Date();
      const hojeStr = agora.toISOString().split('T')[0];
      let dia = 0, mes = 0, minDia = 0, minMes = 0, pend = 0;

      snap.forEach((doc) => {
        const d = doc.data();
        const duracao = calcularMinutosConsulta(d.horario, d.horaFim);
        if (d.statusAtendimento !== 'finalizado') pend++;
        if (d.data === hojeStr) {
          dia++;
          minDia += duracao;
        }
        if (d.data) {
          const [anoAtend, mesAtend] = d.data.split('-').map(Number);
          if ((mesAtend - 1) === agora.getMonth() && anoAtend === agora.getFullYear()) {
            mes++;
            minMes += duracao;
          }
        }
      });

      setMetricas(prev => ({ 
        ...prev, 
        atendimentosDia: dia, 
        atendimentosMes: mes,
        pendentes: pend,
        tempoMedio: dia > 0 ? Math.round(minDia / dia) : 0,
        tempoMedioMes: mes > 0 ? Math.round(minMes / mes) : 0
      }));
    }, handleSyncError);

    return () => { 
      unsubAlunos(); 
      unsubFunc(); 
      unsubAtend(); 
    };
  }, [userContext?.unidadeid]);

  const handleLogoutClick = async () => {
    try { 
      localStorage.clear();
      if (onLogout) await onLogout(); 
      await signOut(auth); 
      window.location.replace("/login"); 
    } catch (error) { console.error("Erro RS Logout:", error); }
  };

  const renderContent = () => {
    const contextData = { ...userContext };

    if (activeTab === "auditoria" && !contextData.unidadeid) {
        return (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10">
            <AlertTriangle size={48} className="mb-4 text-amber-500" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Erro de Sincronização</h2>
            <p className="text-xs uppercase font-bold mt-2">ID da unidade não detectado. Tente resetar o cache.</p>
            <button 
              onClick={limparCacheAuditoria}
              className="mt-6 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase italic shadow-lg hover:bg-blue-700 transition-all"
            >
              Resetar e Recarregar
            </button>
          </div>
        );
    }

    if (activeTab === "home") {
      return (
        <PainelGeralEnfermeiro 
          metricas={metricas}
          visaoMensal={visaoMensal}
          setVisaoMensal={setVisaoMensal}
          darkMode={darkMode}
          user={contextData} 
        />
      );
    }

    if (activeTab === "atendimento") {
      return (
        <AtendimentoEnfermagem 
          user={contextData} 
          onVoltar={() => setActiveTab("home")} 
          onVerHistorico={() => setActiveTab("historico")} 
        />
      );
    }

    if (activeTab === "alunos_especiais") {
      return (
        <DashboardSaudeInclusiva 
          user={contextData}
          onVoltar={() => setActiveTab("home")}
        />
      );
    }

    if (activeTab === "auditoria") {
      return (
        <DashboardAuditoria 
          user={contextData}
        />
      );
    }

    if (activeTab === "pasta_digital") {
      return (
        <ProntuarioDigital 
          user={contextData}
          onVoltar={() => setActiveTab("home")}
        />
      );
    }

    if (activeTab === "contato") {
      return (
        <BuscaContatos 
          user={contextData}
        />
      );
    }

    // 🔥 ROTA ATUALIZADA: ARQUIVO BAENF
    if (activeTab === "historico") {
      return (
        <ArquivoBaenf 
          user={contextData}
        />
      );
    }

    if (activeTab === "pacientes") {
      if (cadastroMode === "saude_escolar") {
        return (
          <QuestionarioSaude 
            onSucesso={() => {
              setActiveTab("home");
              setCadastroMode("aluno");
            }} 
            onVoltar={() => setActiveTab("home")}
          />
        );
      }
      if (cadastroMode === "aluno") {
        return (
          <FormCadastroAluno 
            usuarioLogado={contextData} 
            onVoltar={() => setActiveTab("home")} 
            onSucesso={() => setActiveTab("home")} 
          />
        );
      }
      if (cadastroMode === "funcionario") {
        return (
          <FormCadastroFuncionario 
            usuarioLogado={contextData} 
            onVoltar={() => setActiveTab("home")} 
            onSucesso={() => setActiveTab("home")} 
          />
        );
      }
    }

    return <Placeholder title={MENU_ESTRUTURA.find(i => i.id === activeTab)?.label || "Módulo"} />;
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans ${darkMode ? "bg-black text-white" : "bg-slate-50 text-slate-900"}`}>
      <aside className={`${isExpanded ? "w-72" : "w-24"} ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex flex-col border-r transition-all duration-300 shadow-2xl relative z-50`}>
        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-12 flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><Zap size={24} fill="white"/></div>
            {isExpanded && <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">BAENF<span className="text-blue-600">.System</span></h2>}
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
                    <div className="mt-2 ml-6 space-y-1 border-l-2 border-slate-200 pl-4">
                      {item.subItems.map(sub => (
                        <button 
                          key={sub.id} 
                          onClick={() => { 
                            setActiveTab("pacientes"); 
                            setCadastroMode(sub.id); 
                          }}
                          className={`w-full text-left py-2 px-3 rounded-xl text-[10px] font-black uppercase italic transition-colors flex items-center gap-2 ${
                            cadastroMode === sub.id && activeTab === "pacientes" ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {sub.id === "saude_escolar" && <HeartPulse size={12} />}
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

        <div className="p-8 border-t border-slate-100 space-y-3">
            <button onClick={handleLogoutClick} className="flex items-center gap-4 text-rose-500 font-black uppercase italic text-[11px] hover:text-rose-700 transition-colors">
              <LogOut size={18}/> {isExpanded && "Encerrar Sessão"}
            </button>
            {isExpanded && userContext?.email && (
              <div className="flex items-center gap-2 px-1 opacity-50">
                <Mail size={12} className="text-slate-400" />
                <span className="text-[9px] font-bold text-slate-500 truncate lowercase">{userContext.email}</span>
              </div>
            )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-24 border-b flex items-center justify-between px-10 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-400"><Menu size={24}/></button>
            <div className="flex flex-col text-left">
              <h1 className="text-sm font-black uppercase italic tracking-[0.2em] text-slate-400 leading-none">
                {activeTab === "contato" ? "Busca de Contatos" : activeTab === "alunos_especiais" ? "Saúde Inclusiva" : activeTab === "auditoria" ? "Relatórios Pro" : (MENU_ESTRUTURA.find(i => i.id === activeTab)?.label || "Dashboard")}
              </h1>
              <p className={`text-lg font-black uppercase tracking-tighter mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
                {userContext?.unidade || "unidade"}
              </p>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all">
            {darkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20}/>}
          </button>
        </header>

        <main className={`flex-1 overflow-y-auto p-10 ${darkMode ? "bg-black" : "bg-[#f8fafc]"}`}>
          <div className="max-w-[1600px] mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const Placeholder = ({ title }) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-10 animate-in fade-in">
    <Construction size={48} className="mb-4 text-blue-500" />
    <h2 className="text-xl font-black uppercase italic tracking-tighter">{title}</h2>
    <p className="text-xs uppercase font-bold mt-2">Módulo em desenvolvimento no Rodhon System</p>
  </div>
);

export default DashboardEnfermeiro;