import React, { useState } from 'react';
import { db } from "../../config/firebase"; 
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { 
  Phone, MapPin, User, Search, X, Loader2,
  Home, Smartphone, CreditCard, Heart, MessageCircle
} from 'lucide-react';

const BuscaContatos = ({ user }) => {
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [mensagem, setMensagem] = useState("");

  const pesquisarAluno = async (e) => {
    if (e) e.preventDefault();
    
    const termo = busca.trim().toLowerCase();
    if (termo.length < 3) {
      setMensagem("Digite ao menos 3 letras para buscar");
      return;
    }

    setCarregando(true);
    setMensagem("");
    
    try {
      // Filtro rigoroso: apenas alunos da unidade do usuário logado
      const q = query(
        collection(db, "cadastro_aluno"),
        where("unidadeid", "==", user.unidadeid),
        where("nome", ">=", termo),
        where("nome", "<=", termo + "\uf8ff"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
      
      setResultados(docs);
      if (docs.length === 0) setMensagem("Nenhum aluno encontrado nesta unidade");
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setMensagem("Erro na comunicação com o servidor");
    } finally {
      setCarregando(false);
    }
  };

  // Função para limpar o número e gerar o link do WhatsApp
  const abrirWhatsApp = (telefone, nomeAluno) => {
    const numeroLimpo = telefone.replace(/\D/g, "");
    const texto = encodeURIComponent(`Olá, sou da equipe de saúde da escola. Gostaria de falar sobre o aluno(a) ${nomeAluno}.`);
    window.open(`https://wa.me/55${numeroLimpo}?text=${texto}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* BARRA DE PESQUISA - TEXTO LIVRE */}
      <form onSubmit={pesquisarAluno} className="relative max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome do aluno + Enter para buscar..."
            className="w-full bg-white border-2 border-slate-100 rounded-3xl py-4 px-6 pr-32 text-sm font-bold shadow-sm focus:border-blue-500 outline-none transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button type="submit" disabled={carregando} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl transition-all flex items-center gap-2">
              {carregando ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              <span className="text-[10px] font-black uppercase italic pr-1">Buscar</span>
            </button>
          </div>
        </div>

        {resultados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
            {resultados.map((aluno) => (
              <button key={aluno.id} type="button" onClick={() => { setAlunoSelecionado(aluno); setResultados([]); setBusca(""); }} className="w-full p-4 flex items-center justify-between hover:bg-blue-50 border-b border-slate-50 last:border-0 group">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-all rounded-full text-blue-600"><User size={16}/></div>
                  <div>
                    <p className="text-xs font-black uppercase text-slate-800">{aluno.nomeExibicao || aluno.nome}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{aluno.turma} • {aluno.matriculaInteligente}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* CARD ÚNICO ESTILO PRONTUÁRIO */}
      {alunoSelecionado ? (
        <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-between items-end mb-4 px-2">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ficha de Contato Ativa</h2>
             <button onClick={() => setAlunoSelecionado(null)} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 hover:opacity-70">
                Limpar <X size={14}/>
             </button>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
            {/* HEADER */}
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="relative z-10">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Unidade: {alunoSelecionado.unidade}</p>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">
                  {alunoSelecionado.nomeExibicao || alunoSelecionado.nome}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Matrícula: {alunoSelecionado.matriculaInteligente}</span>
                  <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Turma: {alunoSelecionado.turma}</span>
                </div>
              </div>
              <Home size={140} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
            </div>

            {/* CONTEÚDO */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* FILIAÇÃO */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Heart size={14}/> Filiação e Saúde
                </h3>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase font-black">Mãe</p>
                    <p className="text-xs font-bold text-slate-700 uppercase">{alunoSelecionado.nomeMae || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase font-black">Cartão SUS</p>
                    <p className="text-xs font-mono font-bold text-slate-600">{alunoSelecionado.cartaoSus || "--- --- ---"}</p>
                  </div>
                </div>
              </div>

              {/* ENDEREÇO */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14}/> Localização
                </h3>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 min-h-[120px]">
                  <p className="text-sm font-bold text-slate-700 uppercase leading-tight">
                    {alunoSelecionado.endereco_rua}, {alunoSelecionado.endereco_numero}
                  </p>
                  <p className="text-[10px] text-blue-600 font-black uppercase mt-1">{alunoSelecionado.endereco_bairro}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-3">{alunoSelecionado.endereco_cidade} / {alunoSelecionado.endereco_uf}</p>
                </div>
              </div>

              {/* CONTATOS E WHATSAPP */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={14}/> Canais de Contato
                </h3>
                <div className="bg-green-50 p-5 rounded-3xl border border-green-100 flex flex-col gap-4">
                  <div>
                    <p className="text-[8px] text-green-700 uppercase font-black">{alunoSelecionado.contato1_parentesco || "Responsável"}</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{alunoSelecionado.contato1_nome}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`tel:${alunoSelecionado.contato1_telefone}`} className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center border border-green-200 hover:bg-green-100 transition-colors">
                      <Phone size={18} className="text-green-600 mb-1"/>
                      <span className="text-[9px] font-black text-green-700 uppercase">Ligar</span>
                    </a>
                    
                    <button 
                      onClick={() => abrirWhatsApp(alunoSelecionado.contato1_telefone, alunoSelecionado.nome)}
                      className="bg-green-600 p-3 rounded-2xl flex flex-col items-center justify-center text-white hover:bg-green-700 transition-all shadow-md shadow-green-200"
                    >
                      <MessageCircle size={18} className="mb-1"/>
                      <span className="text-[9px] font-black uppercase">WhatsApp</span>
                    </button>
                  </div>
                  <p className="text-center font-mono font-black text-green-700 tracking-tighter">{alunoSelecionado.contato1_telefone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50">
          <Search size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Aguardando busca por aluno...</p>
        </div>
      )}
    </div>
  );
};

export default BuscaContatos;