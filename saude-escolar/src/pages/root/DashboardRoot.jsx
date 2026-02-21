import React, { useEffect, useState } from 'react';
import { db, auth } from '../../config/firebase'; 
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'; 
import { useAuth } from '../../context/AuthContext.jsx'; 
import { signOut } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast'; 
import * as XLSX from 'xlsx';
import { 
  Users, ShieldCheck, Activity, Calendar, UserPlus, DollarSign,
  AlertCircle, ArrowRight, Loader2, Eye, LayoutDashboard, Undo2, Zap, Settings, Download, ShieldAlert, Save, Database, LogOut, ExternalLink, School, ActivitySquare
} from "lucide-react";

import DashboardEnfermeiro from '../dashboard/DashboardEnfermeiro.jsx'; 
import GestaoUsuarios from './cadastro/GestaoUsuarios.jsx'; 
import CadastrarUsuario from './cadastro/CadastrarUsuario.jsx';
import ControleLicencas from './ControleLicencas.jsx';
import GerenciarUnidades from './cadastro/GerenciarUnidades.jsx'; 
import PainelControleMaster from './PainelControleMaster.jsx'; 

const EstiloMaster = {
  card: "bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden",
  input: "bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all",
  buttonMaster: "bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center justify-center gap-2",
  sidebarItem: (active) => `flex items-center gap-3 w-full p-3.5 rounded-xl font-bold text-xs transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5'}`
};

const DashboardRoot = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, ativos: 0, bloqueados: 0 });
  const [loading, setLoading] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [unidadesBD, setUnidadesBD] = useState([]); 
  const [anomaliasPendentes, setAnomaliasPendentes] = useState(0);

  const [unidadeSelecionada, setUnidadeSelecionada] = useState({
    id: 'cept-anisio-teixeira', nome: 'cept anísio teixeira'
  });

  // MONITORAR ANOMALIAS EM TEMPO REAL PARA O BADGE
  useEffect(() => {
    const q = query(collection(db, "anomalias_sistema"), where("resolvido", "==", false));
    const unsub = onSnapshot(q, (snap) => {
      setAnomaliasPendentes(snap.size);
    });
    return () => unsub();
  }, []);

  // 1. CARREGAR COLÉGIOS DO FIREBASE (DINÂMICO)
  useEffect(() => {
    const qUnidades = query(collection(db, "unidades"), orderBy("nome", "asc"));
    const unsubUnidades = onSnapshot(qUnidades, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUnidadesBD(lista);
      if (lista.length > 0 && !unidadesBD.find(u => u.id === unidadeSelecionada.id)) {
        setUnidadeSelecionada(lista[0]);
      }
    });
    return () => unsubUnidades();
  }, []);

  // 2. MONITORAR ESTATÍSTICAS DE USUÁRIOS
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "!=", "root"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      setStats({
        total: docs.length,
        ativos: docs.filter(d => d.statusLicenca?.toLowerCase() === 'ativa' || d.status?.toLowerCase() === 'ativo').length,
        bloqueados: docs.filter(d => d.statusLicenca?.toLowerCase() === 'bloqueada' || d.status?.toLowerCase() === 'bloqueado').length
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatarNomeRoot = (nomeCru) => {
    if (!nomeCru) return "Rodrigo Honorio";
    const partes = nomeCru.toLowerCase().split(' ');
    const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1);
    const ultimo = partes.length > 1 ? partes[partes.length - 1].charAt(0).toUpperCase() + partes[partes.length - 1].slice(1) : "";
    return `${primeiro} ${ultimo}`.trim();
  };

  const nomeExibicao = user?.role === 'root' ? formatarNomeRoot(user.nome) : "Rodrigo Honorio";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Sessão encerrada");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  if (modoVisualizacao) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
        <div className="bg-slate-900 text-white text-[9px] font-bold uppercase py-1.5 text-center tracking-[0.3em]">
          MODO INSPEÇÃO: {unidadeSelecionada.nome.toUpperCase()}
        </div>
        <button onClick={() => setModoVisualizacao(false)} className="fixed bottom-6 right-6 z-[100000] bg-rose-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 font-bold text-xs uppercase hover:bg-rose-700 transition-all">
          <Undo2 size={18} /> Sair da Inspeção
        </button>
        <DashboardEnfermeiro user={{ ...user, unidade: unidadeSelecionada.nome.toLowerCase(), escolaId: unidadeSelecionada.id, role: 'enfermeiro' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fcfdfe] font-sans text-slate-900">
      <Toaster position="top-right" />
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-[#0f172a] flex-col p-6 text-white fixed h-full shadow-2xl">
        <div className="mb-10 px-2">
           <h2 className="text-xl font-black text-blue-500 tracking-tight uppercase italic">RODHON<span className="text-white">MASTER</span></h2>
           <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Nível Root 2026</p>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          <button onClick={() => setAbaAtiva('home')} className={EstiloMaster.sidebarItem(abaAtiva === 'home')}>
            <LayoutDashboard size={18} /> Painel Central
          </button>
          
          <button onClick={() => setAbaAtiva('manutencao')} className={EstiloMaster.sidebarItem(abaAtiva === 'manutencao')}>
            <ShieldAlert size={18} /> Saúde do Sistema
            {anomaliasPendentes > 0 && (
              <span className="ml-auto bg-rose-600 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse font-black">
                {anomaliasPendentes}
              </span>
            )}
          </button>

          <button onClick={() => setAbaAtiva('licencas')} className={EstiloMaster.sidebarItem(abaAtiva === 'licencas')}>
            <DollarSign size={18} /> Faturamento Master
          </button>

          <button onClick={() => setAbaAtiva('colégios')} className={EstiloMaster.sidebarItem(abaAtiva === 'colégios')}>
            <School size={18} /> Gerenciar Colégios
          </button>

          <button onClick={() => setAbaAtiva('cadastrar')} className={EstiloMaster.sidebarItem(abaAtiva === 'cadastrar')}>
            <UserPlus size={18} /> Novo Usuário
          </button>

          <button onClick={() => setAbaAtiva('usuarios')} className={EstiloMaster.sidebarItem(abaAtiva === 'usuarios')}>
            <Users size={18} /> Gestão de Acessos
          </button>
          
          <button className={EstiloMaster.sidebarItem(false)}><Download size={18} /> Backup Global</button>
          <button className={EstiloMaster.sidebarItem(false)}><Database size={18} /> Logs Auditoria</button>
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-white/5 px-2">
           <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Logado como</p>
             <p className="text-[11px] font-medium text-slate-300 truncate">{user?.email}</p>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 transition-all">
             <LogOut size={18} /> Encerrar Sessão
           </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 p-8">
        <div className="max-w-[1400px] mx-auto">
          
          {abaAtiva !== 'home' && (
            <button 
              onClick={() => setAbaAtiva('home')} 
              className="mb-8 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-500 hover:text-blue-600 shadow-sm transition-all w-fit"
            >
              <Undo2 size={14} /> Voltar ao Início
            </button>
          )}

          {/* HOME ROOT */}
          {abaAtiva === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
                    Olá, <span className="text-blue-600">{nomeExibicao}</span>
                  </h1>
                  <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-[0.2em]">Camada de Inteligência Root</p>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={unidadeSelecionada.id}
                    onChange={(e) => setUnidadeSelecionada(unidadesBD.find(u => u.id === e.target.value))}
                    className={EstiloMaster.input}
                  >
                    {unidadesBD.map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                  </select>
                  <button onClick={() => setModoVisualizacao(true)} className={EstiloMaster.buttonMaster}>
                    <ExternalLink size={16} /> Inspecionar Unidade
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Usuários', val: stats.total, icon: Users, color: 'text-blue-600' },
                  { label: 'Licenças Ativas', val: stats.ativos, icon: ShieldCheck, color: 'text-emerald-600' },
                  { label: 'Bloqueios Atuais', val: stats.bloqueados, icon: AlertCircle, color: 'text-rose-600' }
                ].map((item, idx) => (
                  <div key={idx} className={`${EstiloMaster.card} p-6 flex items-center justify-between border-none bg-white shadow-xl shadow-slate-200/50`}>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <h3 className="text-3xl font-black mt-1 text-slate-800">{loading ? '...' : item.val}</h3>
                    </div>
                    <item.icon className={item.color} size={24} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Banner de Saúde do Sistema */}
                <div 
                  className="lg:col-span-8 bg-[#0f172a] p-10 rounded-[40px] flex flex-col justify-between min-h-[320px] relative overflow-hidden shadow-2xl group cursor-pointer border border-white/5"
                  onClick={() => setAbaAtiva('manutencao')}
                >
                  <div className="z-10">
                    <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center mb-8 shadow-lg shadow-rose-600/20">
                      <Zap size={28} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Saúde do Sistema</h3>
                    <p className="text-slate-400 text-[11px] mt-2 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                      Detecte anomalias silenciosas, limpe logs e normalize o banco de dados.
                    </p>
                  </div>
                  <ActivitySquare size={220} className="absolute -right-10 -bottom-10 text-white/[0.03] group-hover:text-rose-500/10 transition-all duration-700 rotate-12" />
                  <div className="z-10 mt-6 flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest">
                    Varrer Sistema Agora <ArrowRight size={14} />
                  </div>
                </div>

                {/* Atalho Gestão de Colégios */}
                <div 
                  onClick={() => setAbaAtiva('colégios')}
                  className={`${EstiloMaster.card} lg:col-span-4 p-10 rounded-[40px] flex flex-col justify-between group cursor-pointer border-none shadow-xl`}
                >
                   <div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600">
                        <School size={24} />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Gestão de Unidades</h3>
                      <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-widest leading-snug">Adicione colégios sem mexer no código.</p>
                   </div>
                   <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase tracking-widest">
                     Configurar <ArrowRight size={14} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPONENTES DAS ABAS */}
          {abaAtiva === 'manutencao' && <PainelControleMaster />}
          {abaAtiva === 'licencas' && <ControleLicencas />}
          {abaAtiva === 'usuarios' && <GestaoUsuarios />}
          {abaAtiva === 'colégios' && <GerenciarUnidades />}
          {abaAtiva === 'cadastrar' && (
             <CadastrarUsuario onSucess={() => setAbaAtiva('usuarios')} />
          )}

        </div>
      </main>
    </div>
  );
};

export default DashboardRoot;