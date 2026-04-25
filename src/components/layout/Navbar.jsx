import { HiMenu, HiLogout } from 'react-icons/hi';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ toggleSidebar }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <header className="
      sticky top-0 z-30
      bg-white/70 backdrop-blur-xl
      border-b border-glass
      px-6 py-3
      flex items-center justify-between
    ">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
      >
        <HiMenu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* User display */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-200 flex items-center justify-center">
            <span className="text-primary-700 font-display font-bold text-xs">
              {(usuario?.nombres || 'U')[0]}
            </span>
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {usuario?.nombre_completo || usuario?.nombres}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-2 px-3 py-2 rounded-xl text-sm
            text-rose-500 hover:text-rose-600
            hover:bg-rose-50 border border-transparent hover:border-rose-200
            transition-all duration-200
          "
        >
          <HiLogout className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Salir</span>
        </button>
      </div>
    </header>
  );
}
