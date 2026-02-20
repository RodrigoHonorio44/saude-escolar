import { useState } from 'react';
import { auth, db } from '../../config/firebase'; 
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext'; 
import { Check, X, LogOut, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Dimensões = {
  view: "flex-1 min-h-screen bg-[#020617] p-[clamp(0.75rem,3vw,2.5rem)] overflow-y-auto flex items-center justify-center",
  content: "w-full max-w-[400px] mx-auto", 
  card: "bg-white rounded-[24px] lg:rounded-[32px] shadow-2xl p-8 lg:p-10",
  textName: "text-[clamp(1.2rem,1.5vw,1.5rem)] font-black uppercase italic tracking-tighter",
  textSub: "text-[clamp(0.65rem,1vw,0.75rem)] font-bold uppercase tracking-widest"
};

const TrocarSenha = () => {
  const { user, handleLogout } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validacoes = {
    length: novaSenha.length >= 6,
    special: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha),
    upper: /[A-Z]/.test(novaSenha),
    match: novaSenha === confirmarSenha && novaSenha !== ''
  };

  const podeSalvar = Object.values(validacoes).every(Boolean);

  const handleTroca = async (e) => {
    e.preventDefault();
    if (!podeSalvar || loading) return;
    setLoading(true);

    try {
      // 1. Atualiza a senha no Firebase Auth
      await updatePassword(auth.currentUser, novaSenha);

      // 2. Referência do documento do usuário
      const userDocRef = doc(db, "users", user.uid);
      
      // 3. Atualiza o Firestore com dados normalizados em lowercase
      await updateDoc(userDocRef, {
        primeiroAcesso: false,
        requirePasswordChange: false,
        // Salvando data como string para evitar erro 400 de objeto complexo se houver conflito
        dataUltimaTroca: new Date().toISOString().toLowerCase(), 
        ultimoLogin: serverTimestamp()
      });

      toast.success("SENHA ATUALIZADA!");

      setTimeout(async () => {
        localStorage.clear();
        await signOut(auth);
        window.location.replace('/login');
      }, 2000);

    } catch (err) {
      setLoading(false);
      console.error("Erro detalhado:", err);
      
      // Tratamento para erro de sessão expirada (exige login recente para trocar senha)
      if (err.code === 'auth/requires-recent-login') {
        toast.error("POR SEGURANÇA, FAÇA LOGIN NOVAMENTE ANTES DE MUDAR A SENHA.");
        setTimeout(() => handleLogout(), 3000);
      } else {
        toast.error("ERRO 400: DADOS INVÁLIDOS OU PERMISSÃO NEGADA.");
      }
    }
  };

  return (
    <div className={Dimensões.view}>
      <Toaster position="top-right" />
      <div className={Dimensões.content}>
        <div className={Dimensões.card + " relative animate-in zoom-in duration-500"}>
          
          <button onClick={handleLogout} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 p-2">
            <LogOut size={20} />
          </button>

          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg rotate-3">
            <ShieldCheck size={28} />
          </div>
          
          <div className="text-center mb-8">
            <h2 className={`${Dimensões.textName} text-slate-900`}>Segurança</h2>
            <p className={`${Dimensões.textSub} text-slate-400 mt-2`}>
              Olá, <span className="text-blue-600">{user?.nome?.split(' ')[0]}</span>.<br/>
              Defina sua senha definitiva.
            </p>
          </div>

          <form onSubmit={handleTroca} className="space-y-5">
            <div className="space-y-1.5 relative">
              <label className={Dimensões.textSub + " text-slate-400 ml-1"}>Nova Senha</label>
              <input 
                type={showPass ? "text" : "password"} 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 text-slate-700 font-bold"
                placeholder="DIGITE A NOVA SENHA"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)} 
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[42px] text-slate-400">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="space-y-1.5 relative">
              <label className={Dimensões.textSub + " text-slate-400 ml-1"}>Confirmar Senha</label>
              <input 
                type={showConfirm ? "text" : "password"} 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 text-slate-700 font-bold"
                placeholder="CONFIRME SUA SENHA"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)} 
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-[42px] text-slate-400">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              {Object.entries({
                '6+ Caracteres': validacoes.length,
                'Uma Maiúscula': validacoes.upper,
                'Um Símbolo': validacoes.special,
                'Senhas Iguais': validacoes.match
              }).map(([label, val]) => (
                <div key={label} className={`flex items-center gap-2 ${val ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {val ? <Check size={14} strokeWidth={4}/> : <X size={14} strokeWidth={4}/>} 
                  <span className={Dimensões.textSub}>{label}</span>
                </div>
              ))}
            </div>

            <button 
              disabled={!podeSalvar || loading}
              type="submit"
              className={`w-full font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[11px] ${
                podeSalvar && !loading ? 'bg-[#020617] text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-300'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Finalizar Configuração'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrocarSenha;