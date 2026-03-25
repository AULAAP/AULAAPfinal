import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ArrowLeft, Mail, Lock, User as UserIcon, ShieldCheck, FileText, X } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Login({ error: externalError }: { error?: string | null }) {
  const [isRegistering, setIsRegistering] = useState(false); // Default to login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
      setIsRegistering(false);
    }
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting email auth...', email);
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        console.log('Registering new user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName: displayName.toUpperCase() });
        }
        console.log('Registration successful');
      } else {
        console.log('Signing in...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful');
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos. Por favor, verifique sus datos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Intente iniciar sesión.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Error: Debes activar "Correo electrónico" en tu consola de Firebase.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de red: Verifique su conexión o intente de nuevo en unos minutos.');
      } else {
        setError('Error al autenticar: ' + (err.message || 'Intente de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting Google auth...');
      console.log('Auth instance:', auth);
      console.log('Google Provider:', googleProvider);
      if (!auth || !googleProvider) {
        throw new Error('Firebase Auth o Google Provider no están inicializados correctamente.');
      }
      await signInWithPopup(auth, googleProvider);
      console.log('Google auth successful');
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/network-request-failed') {
        setError('Error de red: Verifique su conexión o intente de nuevo en unos minutos.');
      } else {
        setError('Error al autenticar con Google: ' + (err.message || 'Intente de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modals moved to the top of the Fragment for maximum visibility and to avoid any parent constraints */}
      <AnimatePresence>
        {modalType && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-6"
            onClick={() => {
              console.log('Closing modal via overlay');
              setModalType(null);
            }}
          >
            <motion.div
              key="modal-content"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] p-6 md:p-12 overflow-y-auto relative shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-gray-100"
            >
              <button 
                type="button"
                onClick={() => {
                  console.log('Closing modal via button');
                  setModalType(null);
                }}
                className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all z-20 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>

              {modalType === 'privacy' ? (
                <div className="space-y-8 font-outfit">
                  <div className="border-b border-gray-100 pb-6">
                    <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight">Política de Privacidad</h2>
                    <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Última actualización: 19 de marzo de 2026</p>
                  </div>
                  
                  <div className="space-y-6 text-gray-600 leading-relaxed">
                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">1. Introducción</h3>
                      <p className="font-medium">En AULAPP 1.0, operado por Compassion R.D., nos tomamos muy en serio la privacidad de nuestros usuarios y, especialmente, la de los menores de edad registrados en nuestro sistema. Esta política describe cómo recopilamos, usamos y protegemos su información.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">2. Información Recopilada</h3>
                      <ul className="list-disc pl-5 space-y-2 font-medium">
                        <li><strong>Datos del Tutor:</strong> Nombre, correo electrónico y registros de actividad en la plataforma.</li>
                        <li><strong>Datos del Menor:</strong> Nombres, apellidos, edad, sexo y registros de asistencia a las clases dominicales.</li>
                        <li><strong>Datos Técnicos:</strong> Dirección IP, tipo de navegador y datos de sesión para garantizar la seguridad de la cuenta.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">3. Uso de la Información</h3>
                      <p className="font-medium">La información recopilada se utiliza exclusivamente para:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-2 font-medium">
                        <li>Gestionar el registro y seguimiento de asistencia de los beneficiarios.</li>
                        <li>Generar reportes estadísticos internos para la mejora del proyecto social.</li>
                        <li>Garantizar la seguridad y prevenir el acceso no autorizado.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">4. Protección de Datos</h3>
                      <p className="font-medium">Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra pérdida, robo o uso indebido. El acceso a los datos de los menores está restringido únicamente al personal autorizado con credenciales verificadas.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">5. Sus Derechos</h3>
                      <p className="font-medium">Usted tiene derecho a acceder, rectificar o solicitar la eliminación de sus datos personales y los de los menores bajo su tutela registrados en el sistema, contactando directamente con la administración de Compassion R.D.</p>
                    </section>
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <button 
                      onClick={() => setModalType(null)}
                      className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-primary transition-colors shadow-lg shadow-gray-200"
                    >
                      He leído y comprendo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 font-outfit">
                  <div className="border-b border-gray-100 pb-6">
                    <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight">Términos de Servicio</h2>
                    <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Última actualización: 19 de marzo de 2026</p>
                  </div>

                  <div className="space-y-6 text-gray-600 leading-relaxed">
                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">1. Aceptación de Términos</h3>
                      <p className="font-medium">Al utilizar la plataforma AULAPP 1.0, usted acepta cumplir con estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el sistema.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">2. Uso Autorizado</h3>
                      <p className="font-medium">Esta plataforma es para uso exclusivo de tutores y personal administrativo autorizado por Compassion R.D. Queda estrictamente prohibido:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-2 font-medium">
                        <li>Compartir credenciales de acceso con personas no autorizadas.</li>
                        <li>Extraer información masiva para fines ajenos al proyecto social.</li>
                        <li>Ingresar información falsa o malintencionada sobre los beneficiarios.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">3. Responsabilidad del Usuario</h3>
                      <p className="font-medium">Usted es el único responsable de la veracidad de los datos ingresados y de mantener la confidencialidad de su contraseña. Cualquier actividad realizada bajo su cuenta se considerará su responsabilidad.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">4. Propiedad Intelectual</h3>
                      <p className="font-medium">AULAPP 1.0, incluyendo su diseño, logotipos y código fuente, es propiedad intelectual de Compassion R.D. Su uso está limitado a las funciones proporcionadas por la plataforma.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3">5. Modificaciones</h3>
                      <p className="font-medium">Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en esta ventana.</p>
                    </section>
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <button 
                      onClick={() => setModalType(null)}
                      className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-primary transition-colors shadow-lg shadow-gray-200"
                    >
                      Acepto los términos
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-2xl shadow-black/5 w-full max-w-md border border-gray-100 relative z-10"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-black/10 border border-gray-100 w-32 h-auto"
            >
              <img 
                src="/aulapp.png" 
                alt="AULAPP Logo" 
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>

          <Link 
            to="/" 
            className="absolute top-8 left-8 p-3 bg-gray-50 hover:bg-primary hover:text-white rounded-2xl transition-all group border border-gray-100"
            title="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>

          <div className="text-center mb-10 pt-6">
            <div className="flex items-center justify-center gap-4">
              <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
                <UserIcon className="text-primary w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">
                {isRegistering ? 'Registro' : 'Inicia Sesión'}
              </h2>
            </div>
            <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[10px]">
              {isRegistering ? 'Crea tu cuenta de tutor' : 'Accede a tu panel de control'}
            </p>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.p 
                  key="error"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-red-500 text-sm text-center font-bold font-outfit bg-red-50 py-4 rounded-2xl border border-red-100"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegistering && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit font-bold"
                    required={isRegistering}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit font-bold"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder={isRegistering ? "Crea tu contraseña" : "Tu contraseña"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-lg transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50" />
                    <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity text-white">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Recordar contraseña</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:opacity-90 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-4 font-outfit text-base uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta y Entrar' : 'Entrar')}
              </button>
            </form>

            {!isRegistering && (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <span className="relative px-4 bg-white text-[10px] font-black text-gray-400 uppercase tracking-widest">O continúa con</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-black py-5 rounded-2xl transition-all border border-gray-100 flex items-center justify-center gap-4 font-outfit text-base uppercase tracking-widest disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Google
                </button>
              </div>
            )}

            <div className="text-center pt-4 space-y-4">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-black text-primary hover:underline uppercase tracking-widest"
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Eres nuevo? Regístrate aquí'}
              </button>

              <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-50 mt-4">
                <button 
                  type="button"
                  onClick={(e) => { 
                    console.log('Opening Privacy Modal');
                    e.preventDefault(); 
                    e.stopPropagation();
                    setModalType('privacy'); 
                  }}
                  className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Privacidad
                </button>
                <button 
                  type="button"
                  onClick={(e) => { 
                    console.log('Opening Terms Modal');
                    e.preventDefault(); 
                    e.stopPropagation();
                    setModalType('terms'); 
                  }}
                  className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  Términos
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black font-outfit">
            © 2026 Compassion R.D.
          </div>
        </motion.div>
      </div>
    </>
  );
}
