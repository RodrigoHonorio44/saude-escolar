import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { School, Plus, Trash2, Loader2, Copy, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const GerenciarUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [novaUnidade, setNovaUnidade] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // 1. CARREGAR UNIDADES EM TEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "unidades"), orderBy("nome", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUnidades(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. ADICIONAR UNIDADE (Padrão R S: Lowercase + ID Amigável)
  const handleAdicionar = async (e) => {
    e.preventDefault();
    const nomeLimpo = novaUnidade.trim().toLowerCase();
    if (!nomeLimpo) return;

    // Gerar ID mantendo acentos para compatibilidade com seu print: "cept-anísio-teixeira"
    const personalizadoId = nomeLimpo
      .replace(/[^a-z0-9áéíóúâêîôûãõç\s]/g, "") // Remove apenas caracteres estranhos, mantém letras/acentos
      .split(/\s+/)
      .join('-');

    setSalvando(true);
    try {
      await setDoc(doc(db, "unidades", personalizadoId), {
        nome: nomeLimpo,
        unidadeId: personalizadoId,
        createdAt: new Date().toISOString(),
        status: 'ativo'
      });

      setNovaUnidade('');
      toast.success("UNIDADE REGISTRADA COM SUCESSO!");
    } catch (error) {
      console.error(error);
      toast.error("ERRO AO CADASTRAR UNIDADE");
    } finally {
      setSalvando(false);
    }
  };

  // 3. EXCLUIR UNIDADE (Com Confirmação Master)
  const handleExcluir = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-slate-800">
          <AlertTriangle className="text-rose-500" size={18} />
          <span className="text-xs font-black uppercase italic tracking-tighter">Remover Unidade?</span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight">
          Ação irreversível. Vínculos de usuários poderão ser afetados.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteDoc(doc(db, "unidades", id));
                toast.success("UNIDADE REMOVIDA!");
              } catch (error) {
                toast.error("ERRO AO EXCLUIR");
              }
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all"
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-center',
      style: { borderRadius: '20px', border: '1px solid #e2e8f0', padding: '16px' },
    });
  };

  const formatarNome = (txt) => {
    return txt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-900 italic uppercase leading-none">Gerenciar Colégios</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura de Unidades R S</p>
      </div>

      <div className="bg-white p-6 rounded-[30px] border border-slate-200/60 shadow-sm">
        <form onSubmit={handleAdicionar} className="flex gap-3">
          <div className="relative flex-1">
            <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={novaUnidade}
              onChange={(e) => setNovaUnidade(e.target.value)}
              placeholder="NOME DA UNIDADE (EX: CEPT ANÍSIO TEIXEIRA)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-wider outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="bg-slate-900 hover:bg-blue-600 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            {salvando ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Cadastrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-10 flex justify-center text-slate-300">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : unidades.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            Nenhuma unidade registrada no sistema
          </div>
        ) : (
          unidades.map((u) => (
            <div 
              key={u.id}
              className="bg-white border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <School size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase italic leading-tight">
                    {formatarNome(u.nome)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[8px] font-black text-blue-500/70 uppercase tracking-tighter">ID: {u.id}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(u.id);
                        toast.success("ID COPIADO!");
                      }}
                      className="text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleExcluir(u.id)}
                className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GerenciarUnidades;