import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// IMPORTAÇÕES
import { AuthProvider, useAuth } from './context/AuthContext.jsx'; 
import { Login } from './pages/auth/Login.jsx';
import DashboardRoot from './pages/root/DashboardRoot.jsx'; 
import DashboardEnfermeiro from './pages/dashboard/DashboardEnfermeiro.jsx';
import GestaoUsuario from './pages/root/cadastro/GestaoUsuarios.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx';

// 🚀 IMPORTAÇÃO DO COMPONENTE DE SEGURANÇA (Troque o caminho se necessário)
import TrocarSenha from './pages/auth/TrocarSenha.jsx'; 
import MonitorGastos from './components/MonitorGastos.jsx'; 

function RouterContent() {
  const { user, loading } = useAuth();

  // Verificação para acesso Root (R S)
  const isRoot = user && (user.role === 'root' || user.email === "rodrigohono21@gmail.com");

  // 🛡️ LÓGICA DE TRAVA DE SENHA OBRIGATÓRIA
  const precisaTrocarSenha = user && !isRoot && (user.requirePasswordChange === true || !user.dataUltimaTroca);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-white font-black italic tracking-tighter text-2xl">
      RODHON<span className="text-blue-500">SYS</span> <span className="ml-4 animate-pulse">CARREGANDO...</span>
    </div>
  );

  return (
    <div className={`flex min-h-screen ${user ? 'bg-slate-50' : 'bg-white'}`}>
      {/* Sidebar oculta se precisar trocar a senha */}
      {user && !precisaTrocarSenha && <Sidebar userRole={user.role} />}
      
      <main className="flex-1 relative overflow-hidden">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

          {/* 🔐 ROTA DE REDEFINIR SENHA (AGORA COM O COMPONENTE REAL) */}
          <Route path="/redefinir-senha" element={
            user ? <TrocarSenha /> : <Navigate to="/login" replace />
          } />

          <Route path="/" element={
            user ? (
              precisaTrocarSenha ? (
                <Navigate to="/redefinir-senha" replace />
              ) : isRoot ? (
                <Navigate to="/root" replace />
              ) : (
                <Navigate to="/enfermeiro" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/root" element={isRoot ? <DashboardRoot /> : <Navigate to="/" replace />} />
          
          <Route path="/usuarios" element={
            isRoot ? (
              <div className="p-8 lg:ml-0 overflow-y-auto h-screen">
                 <GestaoUsuario />
              </div>
            ) : <Navigate to="/" replace />
          } />

          <Route path="/enfermeiro" element={
            user ? (
              precisaTrocarSenha ? <Navigate to="/redefinir-senha" replace /> : <DashboardEnfermeiro user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {isRoot && <MonitorGastos />}
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