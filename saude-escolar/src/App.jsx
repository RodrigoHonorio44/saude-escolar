import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// IMPORTAÇÕES (Caminhos atualizados)
import { AuthProvider, useAuth } from './context/AuthContext.jsx'; 
import { Login } from './pages/auth/Login.jsx';
import DashboardRoot from './pages/root/DashboardRoot.jsx'; 
import DashboardEnfermeiro from './pages/dashboard/DashboardEnfermeiro.jsx';
import GestaoUsuario from './pages/root/cadastro/GestaoUsuarios.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx';

function RouterContent() {
  const { user, loading } = useAuth();

  // DEBUG MASTER R S
  console.log("SISTEMA R S - ESTADO ATUAL:", { 
    logado: !!user, 
    role: user?.role, 
    email: user?.email 
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-white font-black italic tracking-tighter text-2xl">
      RODHON<span className="text-blue-500">SYS</span> <span className="ml-4 animate-pulse">CARREGANDO...</span>
    </div>
  );

  // Verificação simplificada para acesso Root
  const isRoot = user && (user.role === 'root' || user.email === "rodrigohono21@gmail.com");

  return (
    <div className={`flex min-h-screen ${user ? 'bg-slate-50' : 'bg-white'}`}>
      {/* Sidebar aparece apenas para usuários logados */}
      {user && <Sidebar userRole={user.role} />}
      
      <main className="flex-1 relative overflow-hidden">
        <Routes>
          {/* AUTH */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

          {/* REDIRECIONAMENTO INICIAL */}
          <Route path="/" element={
            user ? (
              isRoot ? <Navigate to="/root" replace /> : <Navigate to="/enfermeiro" replace />
            ) : <Navigate to="/login" replace />
          } />

          {/* ROTAS ROOT (PROTEGIDAS) */}
          <Route path="/root" element={isRoot ? <DashboardRoot /> : <Navigate to="/login" replace />} />
          
          {/* NOVA ROTA DE GESTÃO DE USUÁRIOS */}
          <Route path="/usuarios" element={
            isRoot ? (
              <div className="p-8 lg:ml-0 overflow-y-auto h-screen">
                 <GestaoUsuario />
              </div>
            ) : <Navigate to="/login" replace />
          } />

          {/* ROTAS OPERACIONAIS */}
          <Route path="/enfermeiro" element={
            user ? <DashboardEnfermeiro user={user} /> : <Navigate to="/login" replace />
          } />

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#fff',
              fontWeight: '900',
              fontStyle: 'italic',
              textTransform: 'uppercase',
              fontSize: '12px',
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.1)'
            },
          }}
        />
        <RouterContent />
      </BrowserRouter>
    </AuthProvider>
  );
}