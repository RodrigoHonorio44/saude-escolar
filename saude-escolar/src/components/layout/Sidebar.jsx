import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, HeartPulse, Lock, LogOut, School } from 'lucide-react';
import { auth } from '../../config/firebase';

export function Sidebar({ userRole }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const menu = userRole === 'root' 
    ? [
        { name: 'dashboard root', path: '/root', icon: <LayoutDashboard size={20}/> },
        { name: 'unidades escolares', path: '/escolas', icon: <School size={20}/> }
      ]
    : [
        { name: 'painel saúde', path: '/enfermeiro', icon: <HeartPulse size={20}/> },
        { name: 'fichas alunos', path: '/alunos', icon: <Users size={20}/> }
      ];

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-2xl">
      <div className="p-6 text-center border-b border-slate-800">
        <h2 className="text-2xl font-black italic text-blue-500 tracking-tighter uppercase">sistema r s</h2>
        <p className="text-[10px] uppercase tracking-widest text-slate-400">saúde escolar</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menu.map((item) => (
          <Link key={item.path} to={item.path} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white text-xs font-bold uppercase">
            {item.icon} {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button onClick={handleLogout} className="flex items-center gap-3 p-2 text-red-500 hover:text-red-400 text-xs font-black w-full text-left uppercase">
          <LogOut size={16}/> sair do sistema
        </button>
      </div>
    </aside>
  );
}