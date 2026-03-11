import React, { useState, useEffect } from 'react';
import { db } from "../../config/firebase"; 
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// Adicionado Printer nos ícones
import { Search, User, FilterX, Trash2, Loader2, ChevronRight, X, Activity, AlertTriangle, Clock, ShieldCheck, Printer } from "lucide-react"; 
import ImpressaoBaenf from '../../components/ImpressaoBaenf'; // Importando o componente de impressão

const ArquivoBaenf = ({ user }) => {
  const [nomeBusca, setNomeBusca] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [atendimentos, setAtendimentos] = useState([]);
  const [datasComAtendimento, setDatasComAtendimento] = useState([]);
  const [carregando, setCarregando] = useState(false);
  
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;

  // Função para disparar a impressão
  const handleImprimir = () => {
    window.print();
  };

  useEffect(() => {
    if (!user?.unidadeid) return;
    const q = query(collection(db, "atendimento_enfermagem"), where("unidadeid", "==", user.unidadeid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datas = snapshot.docs.map(doc => doc.data().data);
      setDatasComAtendimento([...new Set(datas)]);
    });
    return () => unsubscribe();
  }, [user?.unidadeid]);

  useEffect(() => {
    if (!user?.unidadeid || nomeBusca !== '') return;

    const dataFormatada = dataSelecionada.toISOString().split('T')[0];
    const q = query(
      collection(db, "atendimento_enfermagem"), 
      where("unidadeid", "==", user.unidadeid),
      where("data", "==", dataFormatada)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAtendimentos(dados);
      setPaginaAtual(1);
    });
    return () => unsubscribe();
  }, [dataSelecionada, user?.unidadeid, nomeBusca]);

  const realizarBuscaNome = async (e) => {
    if (e) e.preventDefault();
    if (!nomeBusca.trim() || !user?.unidadeid) return;

    setCarregando(true);
    const nomeLower = nomeBusca.toLowerCase().trim();
    const q = query(
      collection(db, "atendimento_enfermagem"),
      where("unidadeid", "==", user.unidadeid),
      where("nomePaciente", ">=", nomeLower),
      where("nomePaciente", "<=", nomeLower + "\uf8ff")
    );

    try {
      const snap = await getDocs(q);
      setAtendimentos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setPaginaAtual(1);
    } catch (e) { console.error(e); } finally { setCarregando(false); }
  };

  const totalPaginas = Math.ceil(atendimentos.length / itensPorPagina);
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensExibidos = atendimentos.slice(indexPrimeiroItem, indexUltimoItem);

  return (
    <div className="relative min-h-screen pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FILTROS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
            <label className="text-[10px] font-black uppercase italic text-slate-400 mb-2 block">Buscar Paciente</label>
            <form onSubmit={realizarBuscaNome} className="relative">
              <input
                type="text"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do aluno..."
                value={nomeBusca}
                onChange={(e) => setNomeBusca(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-xl">
                {carregando ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
             <Calendar
              onChange={(val) => { setNomeBusca(''); setDataSelecionada(val); }}
              value={dataSelecionada}
              tileContent={({ date, view }) => (view === 'month' && datasComAtendimento.includes(date.toISOString().split('T')[0])) ? <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mx-auto mt-1"></div> : null}
              className="border-none w-full"
            />
          </div>
        </div>

        {/* LISTA RESUMIDA */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm font-black uppercase italic text-slate-500 tracking-widest">
                {nomeBusca ? `Resultados: ${nomeBusca}` : `Atendimentos: ${dataSelecionada.toLocaleDateString()}`}
            </h3>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black italic">
                {atendimentos.length} REGISTROS
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {itensExibidos.map((at) => (
              <div 
                key={at.id} 
                onClick={() => setItemSelecionado(at)}
                className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User size={24} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase italic text-slate-800 text-sm">{at.nomePaciente}</h4>
                        <p className="text-[10px] font-bold text-blue-500 uppercase">Turma {at.turma} • {at.horario}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button 
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(p => p - 1)}
                className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase italic disabled:opacity-30 border"
              >Anterior</button>
              <span className="text-[10px] font-black text-slate-400 italic">Página {paginaAtual} de {totalPaginas}</span>
              <button 
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual(p => p + 1)}
                className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase italic disabled:opacity-30 border"
              >Próxima</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES COMPLETOS */}
      {itemSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[40px] shadow-2xl relative p-6 md:p-10 border border-white/20">
            
            {/* AÇÕES DO MODAL (IMPRIMIR E FECHAR) */}
            <div className="absolute right-6 top-6 flex items-center gap-2">
              <button 
                onClick={handleImprimir}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 flex items-center gap-2 px-4 group"
              >
                <Printer size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase italic">Imprimir</span>
              </button>
              
              <button 
                onClick={() => setItemSelecionado(null)} 
                className="p-2.5 bg-slate-100 rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cabeçalho do Modal */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-6 border-b border-slate-100">
              <div className="h-20 w-20 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-200 shrink-0">
                <User size={40} />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-black uppercase italic text-slate-800 leading-tight mb-1">
                  {itemSelecionado.nomePaciente}
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 uppercase italic">
                    RA: {itemSelecionado.baenf?.split('-').pop()}
                  </span>
                  <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-3 py-1 rounded-lg border border-slate-100 uppercase italic">
                    Turma {itemSelecionado.turma}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-50/80 p-5 rounded-[32px] border border-slate-100">
                  <h5 className="flex items-center gap-2 text-[11px] font-black uppercase italic text-slate-400 mb-4 tracking-wider">
                    <Activity size={16} className="text-blue-500"/> Sinais Vitais
                  </h5>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-2">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Peso / Altura</p>
                      <p className="font-bold text-slate-700 text-sm">{itemSelecionado.peso}kg / {itemSelecionado.altura}m</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">IMC</p>
                      <p className="font-bold text-slate-700 text-sm">{itemSelecionado.imc || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Temperatura</p>
                      <p className="font-bold text-rose-500 text-sm">{itemSelecionado.temperatura}°C</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Idade</p>
                      <p className="font-bold text-slate-700 text-sm">{itemSelecionado.idade} anos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/80 p-5 rounded-[32px] border border-amber-100">
                  <h5 className="flex items-center gap-2 text-[11px] font-black uppercase italic text-amber-500 mb-3 tracking-wider">
                    <AlertTriangle size={16}/> Alergias & CID
                  </h5>
                  <p className="text-[11px] font-bold text-amber-700 uppercase leading-relaxed">
                    {itemSelecionado.alunoPossuiAlergia === "sim" ? `Alergia: ${itemSelecionado.qualAlergia}` : "Sem alergias relatadas"}
                  </p>
                  {itemSelecionado.saude?.cids?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {itemSelecionado.saude.cids.map(cid => (
                        <span key={cid} className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-amber-600 border border-amber-200 uppercase">
                          {cid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50/40 p-5 rounded-[32px] border border-blue-100">
                  <h5 className="flex items-center gap-2 text-[11px] font-black uppercase italic text-blue-500 mb-4 tracking-wider">
                    <Clock size={16}/> Evolução
                  </h5>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Motivo:</p>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">{itemSelecionado.motivoAtendimento}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Conduta:</p>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">{itemSelecionado.procedimentos}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-5 rounded-[32px] border border-slate-100">
                  <h5 className="flex items-center gap-2 text-[11px] font-black uppercase italic text-slate-400 mb-4 tracking-wider">
                    <ShieldCheck size={16} className="text-emerald-500"/> Responsável
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Profissional</p>
                      <p className="text-xs font-black text-slate-700 uppercase italic">{itemSelecionado.atendenteNome}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Registro (COREN)</p>
                      <p className="text-xs font-black text-blue-600 uppercase">
                        {itemSelecionado.atendenteRegistro || "N/A"}
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Destino</p>
                      <p className="text-xs font-black text-emerald-600 uppercase italic">{itemSelecionado.destinoHospital}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center">
              <p className="text-[10px] text-slate-300 font-black uppercase italic tracking-widest">
                Protocolo Gerado em {itemSelecionado.criadoEm?.toDate().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE DE IMPRESSÃO (Fica escondido na tela) */}
      <ImpressaoBaenf dados={itemSelecionado} />
    </div>
  );
};

export default ArquivoBaenf;