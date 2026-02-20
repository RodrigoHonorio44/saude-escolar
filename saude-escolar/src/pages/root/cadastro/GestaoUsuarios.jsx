import { useEffect, useState } from 'react';
import { db, auth } from '../../../config/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  collection, onSnapshot, doc, updateDoc, query, 
  where, serverTimestamp, addDoc, Timestamp, orderBy 
} from 'firebase/firestore'; 
import { 
  Search, LogOut, ShieldCheck, UserMinus, Loader2, KeyRound, School
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

  // CARREGA USUÁRIOS E UNIDADES
  useEffect(() => {
    // Busca Unidades para o Select
    const qUnidades = query(collection(db, "unidades"), orderBy("nome", "asc"));
    const unsubUnidades = onSnapshot(qUnidades, (snap) => {
      setUnidades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Busca Usuários
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

  const expulsarUsuario = async (id, nome) => {
    if (window.confirm(`EXPULSAR DEFINITIVAMENTE ${nome.toUpperCase()}?`)) {
      try {
        await updateDoc(doc(db, "users", id), { 
          status: 'bloqueado',
          licencaStatus: 'bloqueada',
          currentSessionId: "" 
        });
        registrarLog(nome, "expulsao definitiva");
        toast.error("USUÁRIO EXPULSO");
      } catch (e) { toast.error("ERRO AO EXPULSAR"); }
    }
  };

  const derrubarSessao = async (id, nome) => {
    try {
      await updateDoc(doc(db, "users", id), { currentSessionId: "" });
      registrarLog(nome, "sessao derrubada");
      toast.success("SESSÃO ENCERRADA");
    } catch (e) { toast.error("ERRO AO DERRUBAR"); }
  };

  // FILTRAGEM COMBINADA (NOME + ESCOLA)
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
            {/* SELECT DE UNIDADES */}
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

            {/* BUSCA POR NOME */}
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
                  <th className={`${UI.padding} ${UI.label} text-center`}>Renovação Rápida</th>
                  <th className={`${UI.padding} ${UI.label} text-right`}>Ações e Segurança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuariosFiltrados.map((u) => {
                  const exp = u.dataExpiracao?.seconds ? new Date(u.dataExpiracao.seconds * 1000) : null;
                  const expirado = exp && new Date() > exp;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className={UI.padding}>
                        <div className="flex flex-col">
                          <span className={UI.name}>{u.nome}</span>
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
                        <div className="flex justify-center gap-2">
                          {[30, 90, 365].map(d => (
                            <button key={d} onClick={() => renovarLicenca(u.id, u.nome, d)} className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[9px] font-black transition-all">
                              {d === 365 ? '1 ANO' : `${d}D`}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className={UI.padding}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            title="Resetar Senha"
                            onClick={() => resetarSenha(u.email, u.nome)}
                            className={`${UI.buttonAction} bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100`}
                          >
                            <KeyRound size={16} />
                          </button>

                          <button 
                            title="Derrubar Sessão"
                            onClick={() => derrubarSessao(u.id, u.nome)}
                            className={`${UI.buttonAction} ${u.currentSessionId ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white' : 'bg-slate-50 text-slate-300'}`}
                          >
                            <LogOut size={16} />
                          </button>

                          <button 
                            title="Bloquear Usuário"
                            onClick={() => expulsarUsuario(u.id, u.nome)}
                            className={`${UI.buttonAction} bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100`}
                          >
                            <UserMinus size={16} />
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

export default GestaoUsuarios;