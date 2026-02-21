import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Clock, User, ClipboardList } from 'lucide-react';

const HistoricoAtendimento = ({ alunoId }) => {
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarHistorico = async () => {
      try {
        const q = query(
          collection(db, "atendimento_enfermagem"),
          where("alunoId", "==", alunoId),
          orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistorico(docs);
      } catch (error) {
        console.error("erro ao buscar histórico:", error);
      } finally {
        setCarregando(false);
      }
    };

    if (alunoId) buscarHistorico();
  }, [alunoId]);

  if (carregando) return <div className="p-4 text-center italic">carregando histórico...</div>;

  return (
    <div className="space-y-4 p-2">
      <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-400 mb-4">
        linha do tempo / atendimentos
      </h3>
      
      {historico.length === 0 ? (
        <p className="text-slate-400 italic text-sm text-center py-10">nenhum registro encontrado.</p>
      ) : (
        historico.map((item) => (
          <div key={item.id} className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm hover:border-blue-100 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock size={14} />
                <span className="text-[10px] font-black italic">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-black uppercase italic">
                {item.escola}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 lowercase italic">
                <span className="text-blue-500 font-black">queixa:</span> {item.queixa}
              </p>
              <p className="text-xs font-bold text-slate-700 lowercase italic">
                <span className="text-blue-500 font-black">conduta:</span> {item.procedimento}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex items-center gap-2">
              <User size={12} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase italic">
                prof: {item.profissional.nome} ({item.profissional.registro})
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HistoricoAtendimento;