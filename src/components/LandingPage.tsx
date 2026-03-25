import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, BookOpen, Users, Calendar, Award, ArrowRight, ShieldCheck, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';

const thumbnails = [
  "https://img.youtube.com/vi/xd2a4uhyTcI/maxresdefault.jpg",
  "https://img.youtube.com/vi/vPe9qKILwLw/maxresdefault.jpg",
  "https://img.youtube.com/vi/blryP1lGfqo/maxresdefault.jpg",
  "https://img.youtube.com/vi/cXSX7tsZF3Q/maxresdefault.jpg",
  "https://img.youtube.com/vi/AiyEBkIIHTE/maxresdefault.jpg",
  "https://img.youtube.com/vi/pxf5dWhSzko/maxresdefault.jpg",
  "https://img.youtube.com/vi/kQEUP8ql4t0/maxresdefault.jpg"
];

export default function LandingPage({ user }: { user?: User | null }) {
  const [currentThumb, setCurrentThumb] = useState(0);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentThumb((prev) => (prev + 1) % thumbnails.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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

      <div className="min-h-screen bg-[#FDFCF8] font-outfit overflow-x-hidden">
      {/* Navigation */}
      <nav className="px-8 py-4 flex flex-col items-center justify-center max-w-7xl mx-auto relative z-20 gap-4">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-4 rounded-[2rem] shadow-2xl shadow-black/5 border border-gray-100"
          >
            <img 
              src="/aulapp.png" 
              alt="AULAPP Logo" 
              className="w-32 h-auto object-contain" 
            />
          </motion.div>
        </div>
        
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-6 right-8"
          >
            <Link 
              to={user ? "/dashboard" : "/login"} 
              className="bg-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest text-primary border-2 border-primary/10 hover:border-primary/30 transition-all shadow-xl shadow-black/5 flex items-center gap-2 group"
            >
              {user ? "Ir al Panel" : "Iniciar Sesión"}
              {user ? <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> : <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </Link>
          </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 md:px-12 pt-2 pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-xs font-black text-accent uppercase tracking-widest">Plataforma de Gestión Educativa</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.9] tracking-tighter uppercase italic">
              <span className="text-secondary mr-1">AUL</span><span className="text-primary">APP</span> <br className="md:hidden" /> TRANSFORMA <br />
              <span className="text-primary">
                EL FUTURO
              </span> <br />
              DE TUS ALUMNOS
            </h1>
            
            <p className="text-lg text-gray-500 font-bold max-w-lg leading-relaxed">
              La herramienta definitiva para tutores y administradores. Gestiona asistencia, 
              seguimiento de alumnos y reportes en tiempo real con una interfaz moderna y divertida.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                to={user ? "/dashboard" : "/login"} 
                className="bg-primary text-white px-10 py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center gap-4 group"
              >
                {user ? "Ir al Panel de Control" : "Comenzar Ahora"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/100/100`} 
                    alt="User" 
                    className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                +500 Tutores <br />
                <span className="text-gray-900">Confían en nosotros</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-white p-4 rounded-[2rem] shadow-2xl shadow-black/10 border border-gray-100 hover:rotate-0 transition-all duration-500 aspect-video">
              <div className="w-full h-full overflow-hidden rounded-[1.5rem]">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentThumb}
                    src={thumbnails[currentThumb]} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    alt="Dashboard Preview" 
                    className="w-full h-full object-cover shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
              </div>
              
              {/* Floating elements - moved outside overflow-hidden container */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-4 md:-top-10 md:-right-4 bg-secondary p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl text-white flex items-center gap-3 md:gap-4 z-20"
              >
                <div className="bg-white/20 p-2 md:p-3 rounded-xl">
                  <Users className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">Alumnos</p>
                  <p className="text-xl md:text-2xl font-black tracking-tight">1,240+</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -left-4 md:-bottom-10 md:-left-4 bg-emerald-500 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl text-white flex items-center gap-3 md:gap-4 z-20"
              >
                <div className="bg-white/20 p-2 md:p-3 rounded-xl">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">Asistencia</p>
                  <p className="text-xl md:text-2xl font-black tracking-tight">98.5%</p>
                </div>
              </motion.div>
            </div>
            
            {/* Background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -z-10" />
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-32 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Características</h2>
            <p className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic">Todo lo que necesitas en un solo lugar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Users, title: "Gestión de Alumnos", desc: "Organiza y mantén al día la información de todos tus beneficiarios.", color: "bg-blue-500" },
              { icon: Calendar, title: "Control de Asistencia", desc: "Registra la asistencia diaria de forma rápida y sencilla.", color: "bg-emerald-500" },
              { icon: Award, title: "Reportes Avanzados", desc: "Visualiza el progreso y estadísticas con gráficos interactivos.", color: "bg-purple-500" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 rounded-[2.5rem] bg-[#FDFCF8] border border-gray-100 hover:shadow-2xl hover:shadow-black/5 transition-all"
              >
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight italic">{feature.title}</h3>
                <p className="text-gray-500 font-bold leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <img src="/aulapp.png" alt="AULAPP Logo" className="w-12 h-auto object-contain brightness-0 invert" />
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              <span className="text-secondary mr-0.5">AUL</span><span className="text-primary">APP</span>
            </span>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">© 2026 Compassion R.D. Todos los derechos reservados.</p>
          <div className="flex gap-8">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalType('privacy');
              }}
              className="text-gray-400 hover:text-white transition-colors font-black uppercase tracking-widest text-xs cursor-pointer"
            >
              Privacidad
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalType('terms');
              }}
              className="text-gray-400 hover:text-white transition-colors font-black uppercase tracking-widest text-xs cursor-pointer"
            >
              Términos
            </button>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
