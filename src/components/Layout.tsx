import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Layers,
  ChevronDown,
  PlusCircle,
  UserCircle,
  ArrowLeft,
  Calendar,
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Church
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(user.mustChangePassword || false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsChanging(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('No hay usuario autenticado.');

      // Re-authenticate if needed (standard for sensitive operations)
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
      }

      await updatePassword(firebaseUser, newPassword);
      
      // Update Firestore flag
      await updateDoc(doc(db, 'users', user.uid), {
        mustChangePassword: false
      });

      setPasswordSuccess('Contraseña actualizada con éxito.');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        // Update local user object if possible or just rely on next reload
      }, 2000);
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('La contraseña actual es incorrecta.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Por seguridad, vuelva a iniciar sesión antes de cambiar su contraseña.');
      } else {
        setPasswordError('Ocurrió un error al cambiar la contraseña.');
      }
    } finally {
      setIsChanging(false);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
    { path: '/dashboard/sections', icon: Layers, label: 'Clases' },
    { path: '/dashboard/beneficiaries', icon: Users, label: 'Alumnos' },
    { path: '/dashboard/attendance', icon: UserCheck, label: 'Asistencia' },
    { path: '/dashboard/reports', icon: BarChart3, label: 'Informes' },
  ];

  if (['admin', 'director', 'pastor'].includes(user.role)) {
    menuItems.push({ path: '/dashboard/admin', icon: ShieldCheck, label: 'Admin' });
  }

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-blue-50">
        <div className="p-8">
          <div className="mb-6 flex justify-center">
            <div className="bg-white p-4 rounded-[2rem] shadow-2xl shadow-black/5 border border-gray-100 flex items-center justify-center">
              <img src="/aulapp.png" alt="AULAPP Logo" className="w-32 h-auto object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3 italic tracking-tight">
            <div className="bg-primary text-white p-2 rounded-2xl shadow-lg shadow-blue-100">
              <Church className="w-6 h-6" />
            </div>
            <span className="text-secondary truncate">{user.churchId.toUpperCase()}</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all group ${
                (item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path))
                  ? 'bg-primary text-white font-bold shadow-lg shadow-blue-100 scale-[1.02]'
                  : 'text-gray-500 hover:bg-blue-50 hover:text-primary font-semibold'
              }`}
            >
              <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                (item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path))
                  ? 'text-white'
                  : 'text-gray-400 group-hover:text-primary'
              }`} />
              <span className="text-lg">{item.label}</span>
              {(item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path)) && (
                <motion.div layoutId="activeNav" className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <div className="flex items-center gap-4 px-4 py-4 mb-3 bg-blue-50/50 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-md">
              {user.churchId[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-base font-extrabold text-gray-800 truncate">{user.churchId.toUpperCase()}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{user.username}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center gap-3 px-6 py-3 text-gray-500 hover:bg-blue-50 rounded-2xl transition-all font-bold group mb-2"
          >
            <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Cambiar Contraseña
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !user.mustChangePassword && setIsChangePasswordOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative z-10 border border-gray-100"
            >
              <div className="text-center mb-8">
                <div className="bg-amber-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-100/50">
                  <ShieldCheck className="text-amber-600 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Seguridad</h2>
                <p className="text-gray-500 mt-2 font-bold">
                  {user.mustChangePassword 
                    ? 'Por seguridad, debes crear una nueva contraseña para continuar.' 
                    : 'Actualiza tu contraseña de acceso.'}
                </p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl text-center">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-accent text-sm font-bold bg-accent/10 p-3 rounded-xl text-center">{passwordSuccess}</p>
                )}

                {!user.mustChangePassword && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Contraseña actual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                      required={!user.mustChangePassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChanging}
                  className="w-full bg-primary hover:opacity-90 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-4 uppercase tracking-widest disabled:opacity-50"
                >
                  {isChanging ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                </button>

                {!user.mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        {/* Header Mobile */}
        <header className="md:hidden bg-primary p-6 flex items-center justify-between rounded-b-[2.5rem] shadow-xl shadow-blue-100">
          <div className="flex items-center gap-4">
            {!isDashboard && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <img src="/aulapp.png" alt="AULAPP Logo" className="w-12 h-auto object-contain drop-shadow-md" />
              <div>
                <h1 className="text-xl font-black text-white italic tracking-tight">{user.churchId.toUpperCase()}</h1>
                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">¡Hola, {user.username}!</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-all active:scale-90"
          >
            <Menu className="w-7 h-7" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {!isDashboard && (
            <div className="hidden md:block mb-8">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-3 text-gray-400 hover:text-primary font-bold transition-all group"
              >
                <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-50 group-hover:border-primary group-hover:scale-110 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </div>
                <span className="text-lg">Volver</span>
              </button>
            </div>
          )}
          <Outlet />
        </main>

        {/* Bottom Nav Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-40 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                (item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path))
                  ? 'text-primary scale-110'
                  : 'text-gray-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-white z-50 md:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-gray-800">Menú</h2>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 text-lg font-medium transition-all ${
                      (item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path))
                        ? 'text-primary font-bold'
                        : 'text-gray-600'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.label}
                  </Link>
                ))}
                
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="flex items-center gap-3 text-lg font-medium text-gray-600 w-full"
                >
                  <Lock className="w-6 h-6" />
                  Cambiar Contraseña
                </button>
              </nav>
              <button
                onClick={handleLogout}
                className="mt-auto flex items-center gap-3 text-red-600 font-bold py-4 border-t border-gray-100"
              >
                <LogOut className="w-6 h-6" />
                Cerrar Sesión
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
