import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase'; 
import { collection, onSnapshot } from 'firebase/firestore';
import { Database, Zap, Globe, Activity, ChevronDown, DollarSign, TrendingUp, Info, Search, AlertTriangle } from 'lucide-react';

const MonitorGastosRS = () => {
  const [stats, setStats] = useState({
    leiturasServidor: 0,
    leiturasCache: 0,
    totalDocs: 0,
    ultimaColecao: 'NENHUMA'
  });
  const [minimizado, setMinimizado] = useState(true);

  // --- CONFIGURAÇÃO FINANCEIRA ---
  const COTACAO_DOLAR = 5.17; 
  const PRECO_100K_LEITURAS_USD = 0.06; 
  const MARGEM_LUCRO = 3.0; 

  // Cálculos
  const totalLeituras = stats.leiturasServidor + stats.leiturasCache;
  const custoUSD = (stats.leiturasServidor / 100000) * PRECO_100K_LEITURAS_USD;
  const custoBRL = custoUSD * COTACAO_DOLAR;
  const sugestaoCobranca = custoBRL * MARGEM_LUCRO;
  const economiaPercentual = totalLeituras > 0 ? (stats.leiturasCache / totalLeituras) * 100 : 0;

  useEffect(() => {
    // Rastreador Dinâmico: Adicione aqui as coleções que deseja vigiar
    const colecoesParaVigiar = ["unidades", "users", "pacientes", "atendimentos"];
    
    const unsubs = colecoesParaVigiar.map(nomeCol => {
      return onSnapshot(collection(db, nomeCol), { includeMetadataChanges: true }, (snap) => {
        const isCache = snap.metadata.fromCache;
        if (!snap.metadata.hasPendingWrites) {
          setStats(prev => ({
            leiturasServidor: isCache ? prev.leiturasServidor : prev.leiturasServidor + snap.docs.length,
            leiturasCache: isCache ? prev.leiturasCache + snap.docs.length : prev.leiturasCache,
            totalDocs: snap.docs.length,
            ultimaColecao: nomeCol.toUpperCase()
          }));
        }
      });
    });

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  if (minimizado) {
    return (
      <button 
        onClick={() => setMinimizado(false)}
        className="fixed bottom-6 right-6 bg-[#0f172a] text-white p-4 rounded-full shadow-2xl z-[9999] hover:scale-110 transition-all border border-slate-700/50 flex items-center justify-center"
      >
        <Activity size={20} className={stats.leiturasServidor > 100 ? "text-rose-500 animate-pulse" : "text-emerald-400"} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-[#0f172a] text-white p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[9999] border border-slate-800 w-80 animate-in slide-in-from-bottom-10 duration-500 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[11px] font-[1000] uppercase italic tracking-widest text-slate-400 flex items-center gap-2">
            <Activity size={14} className="text-blue-500" /> RS-Monitor Econômico
          </h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase">Base: US$ 1,00 = R$ {COTACAO_DOLAR.toFixed(2)}</p>
        </div>
        <button onClick={() => setMinimizado(true)} className="bg-slate-800/50 p-2 rounded-xl text-slate-400 hover:text-white transition-all">
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="space-y-4">
        
        {/* DETECTOR DE ORIGEM DO GASTO - NOVO */}
        <div className="bg-blue-500/10 p-4 rounded-[1.8rem] border border-blue-500/20">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-[1000] uppercase italic text-blue-400 tracking-tighter">Origem do Gasto (Ativo)</span>
            <Search size={14} className="text-blue-400" />
          </div>
          <span className="text-lg font-[1000] italic text-white leading-none">{stats.ultimaColecao}</span>
          <p className="text-[8px] text-slate-500 mt-2 font-black uppercase italic">Coleção sendo processada agora</p>
        </div>

        {/* Bloco de Custo Real (BRL) */}
        <div className="bg-gradient-to-br from-rose-500/10 to-transparent p-4 rounded-[1.8rem] border border-rose-500/20">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-[1000] uppercase italic text-rose-500 tracking-tighter">Custo Operacional (Sessão)</span>
            <Globe size={14} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-rose-500/80 italic">R$</span>
            <span className="text-2xl font-[1000] italic leading-none">{custoBRL.toFixed(4)}</span>
          </div>
          <p className="text-[8px] text-slate-500 mt-2 font-black uppercase italic">
            {stats.leiturasServidor} Documentos Pagos
          </p>
        </div>

        {/* Bloco de Sugestão de Cobrança */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-4 rounded-[1.8rem] border border-emerald-500/20">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-[1000] uppercase italic text-emerald-400 tracking-tighter">Sugestão p/ Cobrança</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-emerald-400/80 italic">R$</span>
            <span className="text-2xl font-[1000] italic leading-none">{sugestaoCobranca.toFixed(4)}</span>
          </div>
          <p className="text-[8px] text-slate-500 mt-2 font-black uppercase italic">Margem: {MARGEM_LUCRO}x aplicada</p>
        </div>

        {/* Stats de Performance (Econômetro) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/30 p-3 rounded-2xl border border-emerald-500/10">
            <span className="block text-[8px] font-black text-slate-500 uppercase italic">Economia</span>
            <span className="text-sm font-[1000] text-emerald-500 italic">{economiaPercentual.toFixed(1)}%</span>
          </div>
          <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700">
            <span className="block text-[8px] font-black text-slate-500 uppercase italic">Docs Cache</span>
            <span className="text-sm font-[1000] text-slate-300 italic">+{stats.leiturasCache}</span>
          </div>
        </div>

        {/* Diagnóstico p/ Consertar */}
        <div className={`p-4 rounded-[1.8rem] border ${economiaPercentual < 50 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex items-center gap-3">
             <AlertTriangle size={18} className={economiaPercentual < 50 ? 'text-rose-500' : 'text-slate-500'} />
             <p className="text-[9px] font-black uppercase italic leading-tight text-slate-300">
               {economiaPercentual < 50 
                 ? `VAZAMENTO: Otimize a coleção ${stats.ultimaColecao}. Use limit(20) ou paginação.` 
                 : "ESTRUTURA SAUDÁVEL: O cache está cobrindo a maioria das requisições."}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MonitorGastosRS;