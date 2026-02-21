import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, getDocs, writeBatch, Timestamp, where 
} from 'firebase/firestore';
import { 
  ShieldAlert, Zap, Database, Trash2, 
  AlertTriangle, CheckCircle, Terminal, Activity, RefreshCcw 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PainelControleMaster = () => {
  const [aba, setAba] = useState('status'); // 'status' ou 'anomalias'
  const [anomalias, setAnomalias] = useState([]);
  const [analisando, setAnalisando] = useState(false);
  const [relatorio, setRelatorio] = useState(null);

  // BUSCA ANOMALIAS EM TEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "anomalias_sistema"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnomalias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- FUNÇÕES DE MANUTENÇÃO ---
  const executarVarredura = async () => {
    setAnalisando(true);
    const inicio = performance.now();
    let falhas = 0;
    let foraPadrao = 0;

    try {
      const snap = await getDocs(collection(db, "users"));
      snap.forEach(uDoc => {
        const d = uDoc.data();
        if (!d.role || !d.status) falhas++;
        if (d.nome && d.nome !== d.nome.toLowerCase()) foraPadrao++;
      });
      setRelatorio({ 
        latencia: (performance.now() - inicio).toFixed(2), 
        total: snap.size, falhas, foraPadrao 
      });
      toast.success("VARREDURA R S CONCLUÍDA");
    } catch (e) { toast.error("ERRO NO BANCO"); }
    setAnalisando(false);
  };

  const limparLogsVelhos = async () => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    const q = query(collection(db, "logs_gestao"), where("data", "<", Timestamp.fromDate(limite)));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    toast.success(`${snap.size} LOGS ANTIGOS APAGADOS`);
  };

  const resolverAnomalia = async (id) => {
    await updateDoc(doc(db, "anomalias_sistema", id), { resolvido: true });
    toast.success("ERRO MARCADO COMO RESOLVIDO");
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-6">
      <Toaster position="top-right" />

      {/* HEADER DINÂMICO */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg animate-pulse">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic leading-none">Root Control Center</h2>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Monitoramento de Saúde e Dados</p>
          </div>
        </div>

        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10">
          <button onClick={() => setAba('status')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${aba === 'status' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Integridade</button>
          <button onClick={() => setAba('anomalias')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${aba === 'anomalias' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>
            Anomalias {anomalias.filter(a => !a.resolvido).length > 0 && <span className="bg-white text-rose-600 px-1.5 rounded-full text-[8px] animate-bounce">{anomalias.filter(a => !a.resolvido).length}</span>}
          </button>
        </div>
      </div>

      {/* CONTEÚDO: ABA STATUS */}
      {aba === 'status' && (
        <div className="grid gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-800 uppercase italic flex items-center gap-2"><Database className="text-blue-600"/> Saúde do Banco de Dados</h3>
              <div className="flex gap-2">
                <button onClick={executarVarredura} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-xl text-slate-700 transition-all"><RefreshCcw size={18} className={analisando ? 'animate-spin' : ''}/></button>
                <button onClick={limparLogsVelhos} className="bg-rose-50 text-rose-600 p-3 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18}/></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatBox label="Latência" value={relatorio ? `${relatorio.latencia}ms` : '--'} color="text-blue-600" />
              <StatBox label="Dados Incompletos" value={relatorio ? relatorio.falhas : '--'} color="text-rose-600" />
              <StatBox label="Fora do Padrão" value={relatorio ? relatorio.foraPadrao : '--'} color="text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: ABA ANOMALIAS */}
      {aba === 'anomalias' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          {anomalias.length === 0 && <div className="text-center p-20 bg-white rounded-[2.5rem] text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma anomalia detectada</div>}
          
          {anomalias.map(erro => (
            <div key={erro.id} className={`bg-white p-6 rounded-[2.5rem] border ${erro.resolvido ? 'opacity-50 grayscale' : 'border-rose-100 shadow-md'} flex flex-col md:flex-row justify-between items-center gap-6`}>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${erro.resolvido ? 'bg-slate-400' : 'bg-rose-600 animate-ping'}`}></div>
                  <span className="font-black text-xs text-slate-700 uppercase italic">{erro.erro}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[9px] text-slate-500 break-all">
                  {erro.detalhes}
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">URL: {erro.url} • {erro.data?.toDate().toLocaleString()}</p>
              </div>

              {!erro.resolvido && (
                <button onClick={() => resolverAnomalia(erro.id)} className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                  <CheckCircle size={24} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color }) => (
  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
    <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{label}</span>
    <p className="text-2xl font-black text-slate-800 italic mt-1">{value}</p>
  </div>
);

export default PainelControleMaster;