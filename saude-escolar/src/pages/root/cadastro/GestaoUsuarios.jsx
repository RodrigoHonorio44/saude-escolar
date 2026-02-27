import { useEffect, useState } from 'react';
import { db, auth } from '../../../config/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  collection, onSnapshot, doc, updateDoc, query, 
  where, serverTimestamp, addDoc, Timestamp, orderBy 
} from 'firebase/firestore'; 
import { 
  Search, LogOut, ShieldCheck, UserMinus, UserCheck, Loader2, KeyRound, School,
  LayoutDashboard, Stethoscope, Accessibility, HeartPulse, FolderSearch, UserRound, BarChart3, ClipboardList, Lock
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const UI = {
  container: "w-full max-w-[1600px] mx-auto p-[clamp(0.5rem,2vw,2rem)] space-y-6",
  card: "bg-white rounded-[clamp(1rem,3vw,2.5rem)] shadow-sm border border-slate-100 overflow-hidden",
  title: "text-[clamp(1.1rem,2.5vw,1.7rem)] font-black text-slate-800 uppercase italic leading-none",
  label: "text-[clamp(0.6rem,1vw,0.75rem)] font-bold uppercase tracking-widest text-slate-400",
  name: "text-[clamp(0.75rem,1.2vw,0.95rem)] font-black text-slate-700 uppercase italic tracking-tight",
  padding: "p-[clamp(0.75rem,2vw,2rem)]",
  buttonAction: "p-[clamp(0.4rem,1vw,0.7rem)] rounded-[clamp(0.5rem,1vw,1rem)] transition-all flex items-center justify-center",
};

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [escolaSelecionada, setEscolaSelecionada] = useState('todas');

  useEffect(() => {
    const qUnidades = query(collection(db, "unidades"), orderBy("nome", "asc"));
    const unsubUnidades = onSnapshot(qUnidades, (snap) => {
      setUnidades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qUsers = query(collection(db, "users"), where("role", "!=", "root"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubUnidades(); unsubUsers(); };
  }, []);

  const registrarLog = async (usuarioNome, acao) => {
    try {
      await addDoc(collection(db, "logs_gestao"), {
        admin: "rodrigo root",
        usuarioAfetado: usuarioNome.toLowerCase(),
        acao: acao.toLowerCase(),
        data: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const toggleModulo = async (userId, modulo, valorAtual) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        [`modulosSidebar.${modulo}`]: !valorAtual
      });
      toast.success(`Módulo Atualizado!`);
    } catch (e) { toast.error("Erro ao alterar módulo"); }
  };

  const alternarStatusUsuario = async (id, nome, statusAtual) => {
    const isBloqueado = statusAtual === 'bloqueado' || statusAtual === 'bloqueada';
    try {
      await updateDoc(doc(db, "users", id), { 
        status: isBloqueado ? 'ativo' : 'bloqueado',
        licencaStatus: isBloqueado ? 'ativa' : 'bloqueada',
        currentSessionId: "" 
      });
      const acaoTxt = isBloqueado ? "DESBLOQUEIO" : "BLOQUEIO";
      registrarLog(nome, acaoTxt);
      isBloqueado ? toast.success(`ACESSO DE ${nome.toUpperCase()} REATIVADO!`) : toast.error(`ACESSO DE ${nome.toUpperCase()} SUSPENSO!`);
    } catch (e) { toast.error("ERRO NA OPERAÇÃO"); }
  };

  const resetarSenha = async (email, nome) => {
    try {
      await sendPasswordResetEmail(auth, email);
      registrarLog(nome, "reset de senha enviado");
      toast.success(`E-MAIL DE RESET ENVIADO PARA ${nome.toUpperCase()}`);
    } catch (e) { toast.error("ERRO AO ENVIAR RESET"); }
  };

  const renovarLicenca = async (id, nome, dias) => {
    try {
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + dias);
      await updateDoc(doc(db, "users", id), {
        dataExpiracao: Timestamp.fromDate(novaData),
        status: 'ativo',
        licencaStatus: 'ativa',
        ultimaRenovacao: serverTimestamp()
      });
      registrarLog(nome, `renovacao ${dias} dias`);
      toast.success(`LICENÇA DE ${nome.toUpperCase()} RENOVADA!`);
    } catch (e) { toast.error("ERRO NA RENOVAÇÃO"); }
  };

  const derrubarSessao = async (id, nome) => {
    try {
      await updateDoc(doc(db, "users", id), { currentSessionId: "" });
      registrarLog(nome, "sessao derrubada");
      toast.success("SESSÃO ENCERRADA");
    } catch (e) { toast.error("ERRO AO DERRUBAR"); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchesFiltro = u.nome?.toLowerCase().includes(filtro.toLowerCase()) || u.email?.toLowerCase().includes(filtro.toLowerCase());
    const matchesEscola = escolaSelecionada === 'todas' || u.unidadeId === escolaSelecionada;
    return matchesFiltro && matchesEscola;
  });

  return (
    <div className={UI.container}>
      <Toaster position="top-right" />
      
      <div className={`${UI.card} ${UI.padding}`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className={UI.title}>Gestão de Acessos</h2>
              <p className={UI.label}>Monitoramento R S</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full lg:max-w-2xl">
            <div className="relative flex-1">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xs appearance-none cursor-pointer"
                value={escolaSelecionada}
                onChange={(e) => setEscolaSelecionada(e.target.value)}
              >
                <option value="todas">TODAS AS UNIDADES</option>
                {unidades.map(un => (
                  <option key={un.id} value={un.unidadeId}>{un.nome.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="BUSCAR NOME..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xs uppercase"
                value={filtro} onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={UI.card}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className={`${UI.padding} ${UI.label}`}>Profissional / Escola</th>
                  <th className={`${UI.padding} ${UI.label} text-center`}>Módulos</th>
                  <th className={`${UI.padding} ${UI.label} text-center`}>Renovação Rápida</th>
                  <th className={`${UI.padding} ${UI.label} text-right`}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuariosFiltrados.map((u) => {
                  const exp = u.dataExpiracao?.seconds ? new Date(u.dataExpiracao.seconds * 1000) : null;
                  const expirado = exp && new Date() > exp;
                  const isBloqueado = u.status === 'bloqueado' || u.licencaStatus === 'bloqueada';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className={UI.padding}>
                        <div className="flex flex-col">
                          <span className={`${UI.name} ${isBloqueado ? 'line-through text-slate-400' : ''}`}>{u.nome}</span>
                          <span className="text-[10px] text-blue-600 font-black uppercase flex items-center gap-1">
                            <School size={10}/> {u.unidade || 'Sem Unidade'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                            Expira: {exp ? exp.toLocaleDateString('pt-BR') : '---'} 
                            {expirado && <span className="ml-2 text-rose-500 font-black italic">! EXPIRADO</span>}
                          </span>
                        </div>
                      </td>

                      <td className={UI.padding}>
                        <div className="flex justify-center gap-1">
                          <ModuloBtn icon={<LayoutDashboard size={14}/>} ativo={u.modulosSidebar?.dashboard} onClick={() => toggleModulo(u.id, 'dashboard', u.modulosSidebar?.dashboard)} />
                          <ModuloBtn icon={<Stethoscope size={14}/>} ativo={u.modulosSidebar?.atendimento} onClick={() => toggleModulo(u.id, 'atendimento', u.modulosSidebar?.atendimento)} />
                          <ModuloBtn icon={<Accessibility size={14}/>} ativo={u.modulosSidebar?.saude_inclusiva} onClick={() => toggleModulo(u.id, 'saude_inclusiva', u.modulosSidebar?.saude_inclusiva)} />
                          <ModuloBtn icon={<HeartPulse size={14}/>} ativo={u.modulosSidebar?.saude_escolar} onClick={() => toggleModulo(u.id, 'saude_escolar', u.modulosSidebar?.saude_escolar)} />
                          <ModuloBtn icon={<FolderSearch size={14}/>} ativo={u.modulosSidebar?.pasta_digital} onClick={() => toggleModulo(u.id, 'pasta_digital', u.modulosSidebar?.pasta_digital)} />
                          <ModuloBtn icon={<UserRound size={14}/>} ativo={u.modulosSidebar?.pacientes} onClick={() => toggleModulo(u.id, 'pacientes', u.modulosSidebar?.pacientes)} />
                          <ModuloBtn icon={<BarChart3 size={14}/>} ativo={u.modulosSidebar?.auditoria_pro} onClick={() => toggleModulo(u.id, 'auditoria_pro', u.modulosSidebar?.auditoria_pro)} />
                          <ModuloBtn icon={<ClipboardList size={14}/>} ativo={u.modulosSidebar?.relatorios} onClick={() => toggleModulo(u.id, 'relatorios', u.modulosSidebar?.relatorios)} />
                        </div>
                      </td>

                      <td className={UI.padding}>
                        <div className="flex justify-center gap-1">
                          {[30, 60, 90, 365].map(d => (
                            <button 
                              key={d} 
                              onClick={() => renovarLicenca(u.id, u.nome, d)} 
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-[9px] font-black transition-all"
                            >
                              {d === 365 ? '1ANO' : `+${d}D`}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className={UI.padding}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => resetarSenha(u.email, u.nome)} className={`${UI.buttonAction} bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white`}>
                            <KeyRound size={16} />
                          </button>
                          <button onClick={() => derrubarSessao(u.id, u.nome)} className={`${UI.buttonAction} ${u.currentSessionId ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-300'}`}>
                            <LogOut size={16} />
                          </button>
                          <button onClick={() => alternarStatusUsuario(u.id, u.nome, u.status || u.licencaStatus)} className={`${UI.buttonAction} ${isBloqueado ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {isBloqueado ? <UserCheck size={16} /> : <UserMinus size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const ModuloBtn = ({ icon, ativo, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg border transition-all ${ativo ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-60 hover:opacity-100'}`}
  >
    {ativo ? icon : <Lock size={12} />}
  </button>
);

export default GestaoUsuarios;