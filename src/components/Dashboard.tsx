import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserCheck, UserMinus, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Beneficiary, Section, User, AttendanceRecord } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role !== 'admin' && user.churchId === undefined) {
      setLoading(false);
      return;
    }

    const bQ = user.role === 'admin'
      ? query(collection(db, 'beneficiaries'))
      : query(collection(db, 'beneficiaries'), where('churchId', '==', user.churchId));
    const bUnsubscribe = onSnapshot(bQ, (snapshot) => {
      setBeneficiaries(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Beneficiary)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'beneficiaries'));

    const sQ = user.role === 'admin'
      ? query(collection(db, 'classes'))
      : query(collection(db, 'classes'), where('churchId', '==', user.churchId));
    const sUnsubscribe = onSnapshot(sQ, (snapshot) => {
      setSections(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Section)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'classes'));

    const aQ = user.role === 'admin'
      ? query(collection(db, 'attendance'))
      : query(collection(db, 'attendance'), where('churchId', '==', user.churchId));
    const aUnsubscribe = onSnapshot(aQ, (snapshot) => {
      const data: Record<string, Record<string, boolean>> = {};
      snapshot.docs.forEach(doc => {
        const record = doc.data() as AttendanceRecord;
        Object.entries(record.records).forEach(([bId, present]) => {
          if (!data[bId]) data[bId] = {};
          data[bId][record.date] = present;
        });
      });
      setAttendance(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

    return () => {
      bUnsubscribe();
      sUnsubscribe();
      aUnsubscribe();
    };
  }, [user.uid, user.churchId, user.role]);

  const activeCount = beneficiaries.filter(b => b.status === 'Active').length;
  const inactiveCount = beneficiaries.filter(b => b.status === 'Inactive').length;

  const calculateAverageAttendance = () => {
    const activeBeneficiaries = beneficiaries.filter(b => b.status === 'Active');
    if (activeBeneficiaries.length === 0) return '0%';

    // Get current week dates
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    
    const weekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const todayStr = formatDate(new Date());

    let totalPossible = 0;
    let totalPresent = 0;

    activeBeneficiaries.forEach(child => {
      const childSection = sections.find(s => s.name === child.section);
      if (!childSection) return;

      const scheduledDays = childSection.schedule.days;
      const childAttendance = attendance[child.id] || {};

      weekDates.forEach(date => {
        const dateStr = formatDate(date);
        const dayNum = date.getDay();

        // Only count if it's a scheduled day and it's today or in the past
        if (scheduledDays.includes(dayNum) && dateStr <= todayStr) {
          totalPossible++;
          // Default to true if undefined
          if (childAttendance[dateStr] === undefined || childAttendance[dateStr] === true) {
            totalPresent++;
          }
        }
      });
    });

    if (totalPossible === 0) return '100%';
    
    const percentage = Math.min(Math.round((totalPresent / totalPossible) * 100), 100);
    return `${percentage}%`;
  };

  const stats = [
    { label: 'Total de Niños', value: beneficiaries.length.toString(), icon: Users, color: 'bg-blue-500' },
    { label: 'Activos', value: activeCount.toString(), icon: UserCheck, color: 'bg-emerald-500' },
    { label: 'Inactivos', value: inactiveCount.toString(), icon: UserMinus, color: 'bg-amber-500' },
    { label: 'Asistencia Promedio', value: calculateAverageAttendance(), icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const recentActivity = [
    { id: 1, action: 'Nuevo registro', name: 'Juan Pérez', date: 'Hace 2 horas' },
    { id: 2, action: 'Asistencia marcada', name: 'María García', date: 'Hace 3 horas' },
    { id: 3, action: 'Nota actualizada', name: 'Carlos Ruiz', date: 'Ayer' },
  ];

  if (loading) return <div className="flex items-center justify-center h-screen font-outfit text-gray-500 uppercase tracking-widest font-black">Cargando tablero...</div>;

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary p-8 md:p-12 rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-extrabold uppercase tracking-widest">Hoy es {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tight leading-tight uppercase relative inline-block">
              {/* Main White Text */}
              <span className="relative z-10 text-white drop-shadow-md">
                {user.churchId.toUpperCase()}
              </span>
              
              {/* The Silver "Lens Flare" that travels along the text */}
              <span 
                className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-transparent via-slate-300 via-white via-slate-300 via-transparent to-transparent bg-[length:200%_100%] bg-clip-text text-transparent animate-text-shimmer pointer-events-none mix-blend-screen opacity-100"
                aria-hidden="true"
              >
                {user.churchId.toUpperCase()}
              </span>

              {/* Outer silver glow flare */}
              <span 
                className="absolute inset-0 z-0 blur-md bg-gradient-to-r from-transparent via-transparent via-slate-400/40 via-white/40 via-slate-400/40 via-transparent to-transparent bg-[length:200%_100%] animate-text-shimmer pointer-events-none opacity-60"
                aria-hidden="true"
              >
                {user.churchId.toUpperCase()}
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-blue-50 max-w-md">
              ¡Hola, {user.username}! ¿Listo para una nueva aventura hoy?
            </p>
          </div>
          
          <div className="relative flex-shrink-0 -ml-2 md:-ml-4">
            <motion.div
              className="bg-white w-28 h-28 md:w-44 md:h-44 rounded-full shadow-2xl shadow-black/5 border border-gray-100 flex items-center justify-center p-2"
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <img 
                src="/aulapp.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2810/2810147.png";
                }}
                alt="AULAPP Logo"
                className="w-full h-full object-contain cursor-pointer"
              />
            </motion.div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-2xl" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 card-rounded flex flex-col items-center text-center gap-4 group hover:scale-105 transition-all cursor-default"
          >
            <div className={`${stat.color} p-5 rounded-[1.5rem] text-white shadow-lg group-hover:rotate-6 transition-transform`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-extrabold uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black text-gray-800 tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white card-rounded overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3 italic">
              <div className="bg-accent text-white p-2 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              ACTIVIDAD RECIENTE
            </h2>
            <button className="text-sm text-primary font-black uppercase tracking-widest hover:underline">Ver todo</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map((item) => (
              <div key={item.id} className="p-6 hover:bg-blue-50/30 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-800">{item.name}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{item.action}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-black uppercase tracking-widest">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-secondary card-rounded p-10 text-white shadow-2xl shadow-amber-100 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-black italic mb-4 tracking-tight">ACCIONES RÁPIDAS</h3>
            <p className="text-amber-100 font-bold text-lg mb-8">Gestiona tus clases de forma divertida.</p>
          </div>
          <div className="space-y-4 relative z-10">
            {[
              { to: 'sections', label: 'Gestionar Clases' },
              { to: 'beneficiaries', label: 'Gestionar Alumnos' },
              { to: 'reports', label: 'Ver Informes' },
              { to: 'attendance', label: 'Lista de Asistencia' }
            ].map((action) => (
              <Link 
                key={action.to}
                to={action.to}
                className="w-full bg-white/20 hover:bg-white/30 p-5 rounded-2xl flex items-center justify-between transition-all group backdrop-blur-sm border border-white/10"
              >
                <span className="font-black text-lg uppercase tracking-tight">{action.label}</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            ))}
          </div>
          
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}
