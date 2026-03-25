import { motion } from 'motion/react';
import { PlusCircle, UserCircle, Layers, ChevronRight, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionsOverview() {
  const options = [
    {
      title: 'Crear Clase',
      description: 'Configure nuevos grupos, clubes o niveles para organizar a sus beneficiarios.',
      icon: PlusCircle,
      path: '/sections/create',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Niños en Clase o Club',
      description: 'Gestione la lista de integrantes, asistencia y progreso por cada grupo específico.',
      icon: UserCircle,
      path: '/sections/children',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Registro de Asistencia',
      description: 'Tome asistencia diaria de los niños asignados a cada clase o club.',
      icon: CalendarCheck,
      path: '/sections/attendance',
      color: 'bg-amber-500',
      textColor: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-outfit">Gestión de Clases</h1>
        <p className="text-gray-500 font-outfit">Seleccione una opción para administrar sus grupos de trabajo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {options.map((option, index) => (
          <motion.div
            key={option.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={option.path}
              className="block bg-white p-10 rounded-[3rem] shadow-xl shadow-black/5 border border-gray-100 hover:border-primary/30 hover:shadow-2xl transition-all group h-full"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`${option.color} p-5 rounded-[1.5rem] text-white shadow-lg shadow-black/10`}>
                  <option.icon className="w-10 h-10" />
                </div>
                <ChevronRight className="w-8 h-8 text-gray-300 group-hover:text-primary group-hover:translate-x-2 transition-all" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors font-outfit">
                {option.title}
              </h2>
              <p className="text-gray-500 leading-relaxed font-outfit text-lg">
                {option.description}
              </p>

              <div className={`mt-8 inline-flex items-center gap-3 font-bold ${option.textColor} text-sm font-outfit uppercase tracking-widest`}>
                Acceder ahora
                <div className="w-6 h-6 rounded-full bg-current opacity-10 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-primary rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary/20 relative overflow-hidden">
        <div className="bg-white/20 p-6 rounded-[1.5rem] relative z-10">
          <Layers className="w-12 h-12" />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <h3 className="text-2xl font-bold mb-2 font-outfit">¿Por qué usar Clases?</h3>
          <p className="text-white/80 font-outfit text-lg leading-relaxed">
            Organizar a los alumnos en secciones o clubes permite un seguimiento más personalizado de su desarrollo académico y personal, facilitando la labor del tutor.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50%] left-[-10%] w-48 h-48 bg-black/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
