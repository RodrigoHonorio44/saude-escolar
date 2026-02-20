import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { School, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GerenciarUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [novaUnidade, setNovaUnidade] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // 1. CARREGAR UNIDADES
  useEffect(() => {
    const q = query(collection(db, "unidades"), orderBy("nome", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUnidades(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. ADICIONAR UNIDADE (Padrão R S: Salva em lowercase)
  const handleAdicionar = async (e) => {
    e.preventDefault();
    if (!novaUnidade.trim()) return;

    setSalvando(true);
    try {
      await addDoc(collection(db, "unidades"), {
        nome: novaUnidade.toLowerCase().trim(), // Padronização R S
        createdAt: new Date().toISOString()
      });
      setNovaUnidade('');
      toast.success("Unidade cadastrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao cadastrar unidade");
    } finally {
      setSalvando(false);
    }
  };

  // 3. EXCLUIR UNIDADE
  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente excluir esta unidade?")) {
      try {
        await deleteDoc(doc(db, "unidades", id));
        toast.success("Unidade removida");
      } catch (error) {
        toast.error("Erro ao excluir");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-900 italic uppercase">Gerenciar Colégios</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura de Unidades do Município</p>
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      <div className="bg-white p-6 rounded-[30px] border border-slate-200/60 shadow-sm">
        <form onSubmit={handleAdicionar} className="flex gap-3">
          <div className="relative flex-1">
            <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={novaUnidade}
              onChange={(e) => setNovaUnidade(e.target.value)}
              placeholder="NOME DA UNIDADE (EX: CEPT ANÍSIO TEIXEIRA)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-xs font-bold uppercase tracking-wider outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Cadastrar
          </button>
        </form>
      </div>

      {/* LISTAGEM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-10 flex justify-center text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : unidades.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">
            Nenhuma unidade cadastrada
          </div>
        ) : (
          unidades.map((u) => (
            <div 
              key={u.id}
              className="bg-white border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <School size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                    {u.nome}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ID: {u.id.substring(0,8)}</p>
                </div>
              </div>
              <button 
                onClick={() => handleExcluir(u.id)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
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