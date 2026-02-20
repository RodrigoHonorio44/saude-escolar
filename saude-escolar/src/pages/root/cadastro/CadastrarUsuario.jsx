import { useState, useEffect } from 'react';
import { db } from '../../../config/firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { cadastrarUsuarioService } from '../../../services/licencaService'; 
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  UserPlus, CheckCircle2, 
  Loader2, ShieldCheck, School 
} from 'lucide-react';

const CadastrarUsuario = () => {
  const [loading, setLoading] = useState(false);
  const [unidadesCarregadas, setUnidadesCarregadas] = useState([]); 
  const [unidadesLoading, setUnidadesLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    senha: '', 
    role: 'enfermeiro', 
    prazo: '365', 
    registroProfissional: '',
    escolaId: '' 
  });

  // 1. CARREGAR UNIDADES DO BANCO EM TEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "unidades"), orderBy("nome", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ 
        id: d.id, 
        nome: d.data().nome,
        unidadeId: d.data().unidadeId 
      }));
      setUnidadesCarregadas(lista);
      
      if (lista.length > 0 && !formData.escolaId) {
        setFormData(prev => ({ ...prev, escolaId: lista[0].id }));
      }
      setUnidadesLoading(false);
    });
    return () => unsub();
  }, []);

  const [modulos, setModulos] = useState({
    dashboard: true,       
    atendimento: true,     
    pasta_digital: true,   
    pacientes: true,       
    relatorios: true,       
    saude_inclusiva: true, 
    dashboard_admin: false 
  });

  const moduloLabels = {
    dashboard: "Dashboard",
    atendimento: "Atendimento",
    pasta_digital: "Pasta Digital",
    pacientes: "Cadastros",
    relatorios: "Histórico",
    saude_inclusiva: "Saúde Inclusiva",
    dashboard_admin: "Relatórios Master"
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    const nomeLimpo = formData.nome.trim();
    
    if (nomeLimpo.split(/\s+/).length < 2) {
      toast.error("Insira nome e sobrenome.");
      return;
    }

    setLoading(true);
    try {
      const escolaSelecionada = unidadesCarregadas.find(u => u.id === formData.escolaId);

      // 🎯 ENVIANDO PARA O SERVICE PADRÃO R S (TUDO NORMALIZADO)
      await cadastrarUsuarioService({
        nome: nomeLimpo, // O service já faz o lower
        email: formData.email,
        password: formData.senha,
        role: formData.role,
        // ✅ Atualizado: Agora envia em lowercase para o banco
        registroProfissional: formData.registroProfissional.toLowerCase().trim(),
        unidadeId: escolaSelecionada?.unidadeId || formData.escolaId, 
        unidade: escolaSelecionada?.nome || 'unidade r s',
        prazo: parseInt(formData.prazo),
        modulosSidebar: modulos
      });
      
      toast.success(`USUÁRIO ${nomeLimpo.toUpperCase()} CADASTRADO!`, {
        style: { background: '#0f172a', color: '#fff', borderRadius: '15px', fontWeight: 'bold' }
      });

      setFormData({ ...formData, nome: '', email: '', senha: '', registroProfissional: '' });
      toast("Sessão Admin encerrada por segurança. Faça login novamente.", { icon: '🔒' });

    } catch (error) { 
      let msg = error.message;
      if(error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado!";
      toast.error("ERRO: " + msg.toUpperCase()); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <Toaster position="top-right" /> 
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
            <UserPlus size={32} className="text-blue-600" /> Gestão Master <span className="text-blue-600">Users</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-2">Padrão R S - Vínculo Dinâmico</p>
        </div>
      </div>

      <form onSubmit={handleCadastro} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Nome Completo</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 focus:ring-2 ring-blue-500/20 transition-all" 
                  placeholder="EX: MARCELO SILVA" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block flex items-center gap-2">
                  <School size={14}/> Unidade de Lotação (Busca no Banco)
                </label>
                <select 
                  className="w-full p-4 bg-white rounded-2xl border-2 border-slate-100 outline-none font-black text-slate-700 cursor-pointer disabled:opacity-50"
                  value={formData.escolaId} 
                  disabled={unidadesLoading}
                  onChange={e => setFormData({...formData, escolaId: e.target.value})}
                >
                  {unidadesLoading ? (
                    <option>Carregando unidades...</option>
                  ) : (
                    unidadesCarregadas.map(u => (
                      <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Cargo</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="enfermeiro">Enfermeiro(a)</option>
                  <option value="tecnico_enfermagem">Técnico(a) Enfermagem</option>
                  <option value="diretora">Diretora</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">COREN / Registro</label>
                {/* Removido o uppercase visual para seguir a entrada em minúsculo */}
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700" 
                  placeholder="000.000-rj" value={formData.registroProfissional} onChange={e => setFormData({...formData, registroProfissional: e.target.value})} />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <input required type="email" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="email@dominio.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input required type="password" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Senha" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[35px] text-white shadow-xl">
            <h2 className="text-lg font-black mb-6 flex items-center gap-3 text-blue-400 uppercase italic">
              <ShieldCheck size={20} /> Licença Master
            </h2>

            <div className="mb-6">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Validade do Acesso</label>
              <select className="w-full p-4 bg-slate-800 rounded-2xl border border-slate-700 text-white font-bold outline-none"
                value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})}>
                <option value="365">Anual (365 dias)</option>
                <option value="180">Semestral (180 dias)</option>
                <option value="30">Mensal (30 dias)</option>
              </select>
            </div>

            <div className="space-y-2 mb-8">
              {Object.keys(modulos).map(m => (
                <div key={m} onClick={() => setModulos({...modulos, [m]: !modulos[m]})} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${modulos[m] ? 'bg-blue-600/10 border-blue-500/50' : 'bg-transparent border-slate-800 opacity-30'}`}>
                  <span className="text-[9px] font-black uppercase tracking-tighter">{moduloLabels[m]}</span>
                  {modulos[m] && <CheckCircle2 size={14} className="text-blue-400" />}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading || unidadesLoading} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'}`}>
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Processar Cadastro'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarUsuario;