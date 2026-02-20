import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase'; // Certifique-core de que o caminho está correto
import { collection, onSnapshot } from 'firebase/firestore';
import { Database, Zap, Globe, Activity } from 'lucide-react'; // ✅ Corrigido para Activity

const MonitorGastos = () => {
  const [stats, setStats] = useState({
    leiturasServidor: 0,
    leiturasCache: 0,
    totalDocs: 0
  });
  const [minimizado, setMinimizado] = useState(true);

  useEffect(() => {
    // Monitoramos a coleção de unidades como termômetro do sistema R S
    const unsub = onSnapshot(collection(db, "unidades"), { includeMetadataChanges: true }, (snap) => {
      // snap.metadata.fromCache indica se veio do banco local (grátis) ou nuvem (pago)
      const isCache = snap.metadata.fromCache;
      
      // Só atualizamos os contadores se não houver mudanças pendentes (evita duplicidade)
      if (!snap.metadata.hasPendingWrites) {
        setStats(prev => ({
          leiturasServidor: isCache ? prev.leiturasServidor : prev.leiturasServidor + 1,
          leiturasCache: isCache ? prev.leiturasCache + 1 : prev.leiturasCache,
          totalDocs: snap.docs.length
        }));
      }
    });

    return () => unsub();
  }, []);

  // Versão Minimizado (Bolinha flutuante)
  if (minimizado) {
    return (
      <button 
        onClick={() => setMinimizado(false)}
        className="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-full shadow-2xl z-[9999] hover:scale-110 transition-all border border-slate-700 flex items-center justify-center"
      >
        <Database size={20} className={stats.leiturasServidor > 10 ? "text-orange-400" : "text-emerald-400"} />
        {/* Badge discreto com total de leituras pagas */}
        {stats.leiturasServidor > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">
            {stats.leiturasServidor}
          </span>
        )}
      </button>
    );
  }

  // Versão Painel Aberto
  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-5 rounded-[25px] shadow-2xl z-[9999] border border-slate-700 w-64 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity size={12} className="text-blue-400" /> RS-Monitor Econômico
        </h3>
        <button 
          onClick={() => setMinimizado(true)} 
          className="text-slate-500 hover:text-white transition-colors"
        >
          <Database size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {/* LEITURAS PAGAS */}
        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-rose-500/20">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-rose-400" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Servidor (Pago)</span>
          </div>
          <span className="font-black text-rose-400 text-sm">{stats.leiturasServidor}</span>
        </div>

        {/* LEITURAS GRÁTIS */}
        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Cache (Grátis)</span>
          </div>
          <span className="font-black text-emerald-400 text-sm">{stats.leiturasCache}</span>
        </div>

        <div className="pt-2 border-t border-slate-800/50">
          <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500 tracking-tighter">
            <span>Docs na Coleção:</span>
            <span className="text-slate-300">{stats.totalDocs}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorGastos;