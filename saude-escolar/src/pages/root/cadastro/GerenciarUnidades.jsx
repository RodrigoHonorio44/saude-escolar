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

  // 2. ADICIONAR UNIDADE (ID nasce como o nome da escola)
  const handleAdicionar = async (e) => {
    e.preventDefault();
    const nomeLimpo = novaUnidade.trim().toLowerCase();
    if (!nomeLimpo) return;

    // Gerar ID: "cept anísio teixeira" -> "cept-anisio-teixeira"
    const personalizadoId = nomeLimpo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9\s]/g, "")    
      .split(/\s+/)                   
      .join('-');                     

    setSalvando(true);
    try {
      await setDoc(doc(db, "unidades", personalizadoId), {
        nome: nomeLimpo, // Padrão R S (lowercase)
        unidadeId: personalizadoId, 
        createdAt: new Date().toISOString(),
        status: 'ativo'
      });

      setNovaUnidade('');
      toast.success("Unidade criada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cadastrar unidade");
    } finally {
      setSalvando(false);
    }
  };

  // 3. EXCLUIR UNIDADE (Com Confirmação via Toast)
  const handleExcluir = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-slate-800">
          <AlertTriangle className="text-rose-500" size={18} />
          <span className="text-xs font-black uppercase tracking-tight">Excluir Unidade?</span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight">
          Esta ação é irreversível e removerá todos os vínculos.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteDoc(doc(db, "unidades", id));
                toast.success("Unidade removida com sucesso!");
              } catch (error) {
                toast.error("Erro ao excluir unidade");
              }
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-center',
      style: {
        borderRadius: '20px',
        background: '#fff',
        color: '#333',
        border: '1px solid #e2e8f0',
        padding: '16px'
      },
    });
  };

  const formatarNome = (txt) => {
    return txt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-900 italic uppercase">Gerenciar Colégios</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura de Unidades do Município</p>
      </div>

      <div className="bg-white p-6 rounded-[30px] border border-slate-200/60 shadow-sm">
        <form onSubmit={handleAdicionar} className="flex gap-3">
          <div className="relative flex-1">
            <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={novaUnidade}
              onChange={(e) => setNovaUnidade(e.target.value)}
              placeholder="NOME DA UNIDADE (EX: JOANA BENEDICTA)"
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
                    {formatarNome(u.nome)}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">ID: {u.id}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(u.id);
                        toast.success("ID copiado!");
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