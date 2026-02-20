import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          SISTEMA R S <span className="text-blue-500">· Validando...</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🛡️ IMUNIDADE MASTER (R S)
  const isRoot = user.role === 'root' || user.email?.toLowerCase() === "rodrigohono21@gmail.com";

  if (isRoot) {
    return children;
  }

  // 🔒 TRAVAS PARA USUÁRIOS COMUNS
  const userRole = user.role?.trim() || 'enfermeiro';
  const userStatus = user.status?.trim()?.toLowerCase();
  const licencaStatus = user.statusLicenca?.trim()?.toLowerCase();

  // 1. Bloqueio de conta/licença
  if (userStatus === 'bloqueado' || licencaStatus === 'bloqueada' || licencaStatus === 'expirada') {
    return <Navigate to="/bloqueado" replace />;
  }

  // 2. 🎯 CORREÇÃO: TROCA DE SENHA OBRIGATÓRIA (Sincronizado com o Login)
  // Agora checa requirePasswordChange E o nome correto da rota
  const precisaTrocarSenha = user.requirePasswordChange === true || user.primeiroAcesso === true || !user.dataUltimaTroca;
  
  if (precisaTrocarSenha && location.pathname !== '/redefinir-senha') {
    return <Navigate to="/redefinir-senha" replace />;
  }

  // 3. Permissões de Cargo
  if (allowedRoles) {
    const rolesPermitidas = allowedRoles.map(r => r.toLowerCase());
    if (!rolesPermitidas.includes(userRole.toLowerCase())) {
      return <Navigate to="/" replace />; 
    }
  }

  return children;
};

export default ProtectedRoute;