import React from 'react';
import { useAuth } from '../context/AuthContext'; 
import MonitorGastos from '../components/MonitorGastos';
// Se você tiver uma Sidebar ou Navbar, importe-as aqui

const Layout = ({ children }) => {
  const { user, loading } = useAuth(); // Pegamos o 'loading' do seu AuthContext

  // ✅ Filtro de Segurança: Só você (Root) vê o monitor
  // Usamos o optional chaining (?.) para não dar erro enquanto o user carrega
  const isRoot = !loading && user?.email === "rodrigohono21@gmail.com";

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Exemplo de onde ficaria sua Sidebar */}
      {/* <Sidebar /> */}
      
      <main className="flex-1 relative">
        {/* Renderiza o conteúdo das páginas */}
        {children}
      </main>

      {/* 🚀 MONITOR ECONÔMICO R S */}
      {/* Só aparece se o carregamento terminou e o email for o seu */}
      {isRoot && <MonitorGastos />}
    </div>
  );
};

export default Layout;