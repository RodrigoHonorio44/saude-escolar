import { useEffect, useState } from 'react';
import { db, auth } from '../../../config/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth'; 
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, deleteField, serverTimestamp, addDoc } from 'firebase/firestore'; 
import { 
  Users, Trash2, CheckCircle, XCircle, Search, 
  LayoutDashboard, UserRound, Stethoscope, ClipboardList, Lock, FolderSearch,
  LogOut, HeartPulse, BarChart3, KeyRound, Contact,
  Accessibility, Building2, Eraser, ShieldCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// 🟦 DESIGN SYSTEM DE DIMENSÕES (Ajuste aqui e muda em tudo)
const UI = {
  // Container principal com respiro inteligente
  container: "w-full max-w-[1600px] mx-auto p-[clamp(0.5rem,2vw,2rem)] space-y-6",
  
  // Cards com arredondamento que se adapta
  card: "bg-white rounded-[clamp(1rem,3vw,2.5rem)] shadow-sm border border-slate-100 overflow-hidden",
  
  // Tipografia Dinâmica (Ajusta o tamanho da fonte sozinho)
  title: "text-[clamp(1.1rem,2.5vw,1.7rem)] font-black text-slate-800 uppercase italic leading-none",
  label: "text-[clamp(0.6rem,1vw,0.75rem)] font-bold uppercase tracking-widest text-slate-400",
  name: "text-[clamp(0.75rem,1.2vw,0.95rem)] font-black text-slate-700 uppercase italic tracking-tight",
  
  // Botões e Espaçamentos
  padding: "p-[clamp(0.75rem,2vw,2rem)]",
  buttonAction: "p-[clamp(0.4rem,1vw,0.7rem)] rounded-[clamp(0.5rem,1vw,1rem)] transition-all flex items-center justify-center",
};

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const q = query(collection(db, "usuarios"), where("role", "!=", "root"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÕES DE LOGICA (IDÊNTICAS ÀS SUAS) ---
  const registrarLog = async (usuarioNome, acao) => {
    try {
      await addDoc(collection(db, "logs_gestao"), {
        admin: "Rodrigo Root",
        usuarioAfetado: usuarioNome.toLowerCase(),
        acao: acao.toLowerCase(),
        data: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const resetarSenha = async (email, nome) => {
    if (!email) return toast.error("E-mail não localizado.");
    if (window.confirm(`Resetar senha de ${nome}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        registrarLog(nome, "Reset de senha");
        toast.success("E-mail enviado");
      } catch (e) { toast.error("Erro ao enviar"); }
    }
  };

  const derrubarSessao = async (id, nome) => {
    if (window.confirm(`Derrubar sessão de ${nome}?`)) {
      try {
        await updateDoc(doc(db, "usuarios", id), { currentSessionId: "" });
        registrarLog(nome, "Sessão derrubada");
        toast.success("Usuário desconectado");
      } catch (e) { toast.error("Erro"); }
    }
  };

  const toggleModulo = async (userId, modulo, valorAtual) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), { [`modulosSidebar.${modulo}`]: !valorAtual });
      toast.success("Módulo atualizado");
    } catch (e) { toast.error("Erro"); }
  };

  const alternarStatus = async (id, statusAtual, nome) => {
    const novoStatus = statusAtual === 'ativo' ? 'bloqueado' : 'ativo';
    try {
      await updateDoc(doc(db, "usuarios", id), { 
        status: novoStatus,
        statusLicenca: novoStatus === 'ativo' ? 'ativa' : 'bloqueada',
        "modulosSidebar.dashboard": novoStatus === 'ativo'
      });
      registrarLog(nome, `Status para ${novoStatus}`);
      toast.success(`${nome} ${novoStatus}`);
    } catch (e) { toast.error("Erro"); }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.escolaId?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className={UI.container}>
      <Toaster position="top-right" />
      
      {/* HEADER DINÂMICO */}
      <div className={`${UI.card} ${UI.padding}`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-[clamp(0.8rem,1.5vw,1.2rem)] rounded-2xl shadow-xl shrink-0">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className={UI.title}>Acessos Master</h2>
              <p className={UI.label}>Gestão de Sessões e Permissões</p>
            </div>
          </div>
          
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Buscar profissional..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xs shadow-inner focus:ring-2 ring-blue-100"
              value={filtro} onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABELA DINÂMICA */}
      <div className={UI.card}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className={`${UI.padding} ${UI.label}`}>Profissional / Status</th>
                <th className={`${UI.padding} ${UI.label} text-center`}>Acesso aos Módulos</th>
                <th className={`${UI.padding} ${UI.label} text-right`}>Segurança Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className={UI.padding}>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={UI.name}>{u.nome}</span>
                        {u.currentSessionId && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                      </div>
                      <span className="text-[10px] text-blue-500 font-bold uppercase truncate">{u.escolaId || 'Sem Unidade'}</span>
                    </div>
                  </td>

                  <td className={UI.padding}>
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {['dashboard', 'atendimento', 'saude_inclusiva', 'pasta_digital', 'auditoria_pro'].map(m => (
                        <ModuloBtn key={m} ativo={u.modulosSidebar?.[m]} onClick={() => toggleModulo(u.id, m, u.modulosSidebar?.[m])} />
                      ))}
                    </div>
                  </td>

                  <td className={UI.padding}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => resetarSenha(u.email, u.nome)} className={`${UI.buttonAction} bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm`}>
                        <KeyRound size={16} />
                      </button>
                      
                      <button 
                        disabled={!u.currentSessionId} 
                        onClick={() => derrubarSessao(u.id, u.nome)} 
                        className={`${UI.buttonAction} ${u.currentSessionId ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white shadow-sm' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
                      >
                        <LogOut size={16} />
                      </button>

                      <button 
                        onClick={() => alternarStatus(u.id, u.status, u.nome)} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all shadow-sm
                          ${u.status === 'ativo' ? 'bg-slate-900 text-white hover:bg-rose-600' : 'bg-emerald-500 text-white'}
                        `}
                      >
                        {u.status === 'ativo' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        <span className="hidden sm:inline">{u.status === 'ativo' ? 'Bloquear' : 'Ativar'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ModuloBtn = ({ ativo, onClick }) => (
  <button 
    onClick={onClick} 
    className={`p-2 lg:p-3 rounded-xl border-2 transition-all ${ativo ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
  >
    {ativo ? <LayoutDashboard size={14} /> : <Lock size={14} />}
  </button>
);

export default GestaoUsuarios;