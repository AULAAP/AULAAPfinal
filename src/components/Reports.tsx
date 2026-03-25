import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Award, 
  Filter, 
  Download, 
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Beneficiary, Section, User, AttendanceRecord } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface ReportsProps {
  user: User;
}

export default function Reports({ user }: ReportsProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
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
      setAttendance(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttendanceRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

    return () => {
      bUnsubscribe();
      sUnsubscribe();
      aUnsubscribe();
    };
  }, [user.uid, user.churchId, user.role]);

  // Process data for charts
  
  // 1. Beneficiaries per Section
  const sectionData = sections.map(s => ({
    name: s.name,
    count: beneficiaries.filter(b => b.section === s.name).length
  }));

  // 2. Gender Distribution
  const genderData = [
    { name: 'Masculino', value: beneficiaries.filter(b => b.gender === 'M').length },
    { name: 'Femenino', value: beneficiaries.filter(b => b.gender === 'F').length }
  ];

  // 3. Attendance Average
  const calculateAverageAttendance = () => {
    if (attendance.length === 0) return 0;
    let totalPossible = 0;
    let totalPresent = 0;
    attendance.forEach(record => {
      Object.values(record.records).forEach(present => {
        totalPossible++;
        if (present) totalPresent++;
      });
    });
    return totalPossible === 0 ? 0 : Math.round((totalPresent / totalPossible) * 100);
  };

  const avgAttendance = calculateAverageAttendance();

  // 4. Attendance Trend
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const attendanceTrend = daysOfWeek.map((day, index) => {
    const dayRecords = attendance.filter(record => {
      const date = new Date(record.date + 'T00:00:00'); // Ensure local time
      return date.getDay() === index;
    });
    
    if (dayRecords.length === 0) return { name: day, attendance: 0 };
    
    let totalPossible = 0;
    let totalPresent = 0;
    dayRecords.forEach(record => {
      Object.values(record.records).forEach(present => {
        totalPossible++;
        if (present) totalPresent++;
      });
    });
    
    return {
      name: day,
      attendance: totalPossible === 0 ? 0 : Math.round((totalPresent / totalPossible) * 100)
    };
  }).filter(d => d.name !== 'Dom'); // Usually no classes on Sunday in this context, or just keep it.

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-outfit">Reportes y Estadísticas</h1>
          <p className="text-gray-500 font-outfit">Visualización de datos para toma de decisiones</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white text-gray-700 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-all shadow-sm font-outfit">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
          <button className="bg-primary text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-outfit">
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Alumnos', value: beneficiaries.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Asistencia Promedio', value: `${avgAttendance}%`, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Secciones Activas', value: sections.length, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Tasa de Retención', value: '94%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl font-outfit">+2.5%</span>
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest font-outfit mb-1">{kpi.label}</p>
            <h3 className="text-4xl font-black text-gray-900 font-outfit">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Beneficiaries by Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[3rem] shadow-xl shadow-black/5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 font-outfit">
              <BarChart3 className="w-6 h-6 text-primary" />
              Alumnos por Clase
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit' }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[12, 12, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-10 rounded-[3rem] shadow-xl shadow-black/5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 font-outfit">
              <LineChartIcon className="w-6 h-6 text-blue-500" />
              Tendencia de Asistencia
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#3b82f6" 
                  strokeWidth={5} 
                  dot={{ r: 7, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 10 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-10 rounded-[3rem] shadow-xl shadow-black/5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 font-outfit">
              <PieChartIcon className="w-6 h-6 text-accent" />
              Distribución por Género
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={10}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'var(--color-secondary)'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: 'Outfit', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Performance Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-primary p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 font-outfit">
              <Award className="w-8 h-8 text-white/80" />
              Resumen de Desempeño
            </h3>
            <p className="text-white/80 mb-10 font-outfit text-lg leading-relaxed">
              El club de lectura mantiene la asistencia más alta este mes. Se recomienda reforzar el club de deportes los fines de semana.
            </p>
            <div className="space-y-6">
              {[
                { label: 'Club de Lectura', progress: 95 },
                { label: 'Refuerzo Matemático', progress: 82 },
                { label: 'Coro Infantil', progress: 75 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm font-bold mb-2 font-outfit">
                    <span>{item.label}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-black/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </div>
  );
}
