import React, { useState, useEffect, useRef } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Award, 
  Filter, 
  Download, 
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  X,
  ChevronDown
} from 'lucide-react';
import { Beneficiary, Section, User, AttendanceRecord } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ReportsProps {
  user: User;
}

export default function Reports({ user }: ReportsProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showIndividualReports, setShowIndividualReports] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSection, setFilterSection] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
  
  // Apply filters to data
  const filteredBeneficiaries = beneficiaries.filter(b => {
    if (filterSection !== 'all' && b.section !== filterSection) return false;
    return true;
  });

  const filteredAttendance = attendance.filter(record => {
    if (startDate && record.date < startDate) return false;
    if (endDate && record.date > endDate) return false;
    if (filterSection !== 'all') {
      // Check if this record belongs to the selected section
      const section = sections.find(s => s.name === filterSection);
      if (section && record.classId !== section.id) return false;
    }
    return true;
  });

  // 1. Beneficiaries per Section
  const sectionData = sections
    .filter(s => filterSection === 'all' || s.name === filterSection)
    .map(s => ({
      name: s.name,
      count: beneficiaries.filter(b => b.section === s.name).length
    }));

  // 2. Gender Distribution
  const genderData = [
    { name: 'Masculino', value: filteredBeneficiaries.filter(b => b.gender === 'M').length },
    { name: 'Femenino', value: filteredBeneficiaries.filter(b => b.gender === 'F').length }
  ];

  // 3. Attendance Average
  const calculateAverageAttendance = () => {
    if (filteredAttendance.length === 0) return 0;
    let totalPossible = 0;
    let totalPresent = 0;
    filteredAttendance.forEach(record => {
      Object.values(record.records).forEach(present => {
        totalPossible++;
        if (present) totalPresent++;
      });
    });
    return totalPossible === 0 ? 0 : Math.round((totalPresent / totalPossible) * 100);
  };

  const avgAttendance = calculateAverageAttendance();

  // 5. Individual Attendance Stats
  const getBeneficiaryStats = (beneficiaryId: string) => {
    const beneficiaryAttendance = attendance.filter(record => 
      record.records[beneficiaryId] !== undefined
    );
    
    if (beneficiaryAttendance.length === 0) return { avg: 0, history: [] };
    
    const presentCount = beneficiaryAttendance.filter(record => record.records[beneficiaryId]).length;
    const avg = Math.round((presentCount / beneficiaryAttendance.length) * 100);
    
    // Last 30 days history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const history = beneficiaryAttendance
      .filter(record => record.date >= thirtyDaysAgoStr)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10); // Show last 10 records for compactness
      
    return { avg, history };
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage <= 60) return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', solid: 'bg-rose-500' };
    if (percentage <= 70) return { text: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', solid: 'bg-orange-500' };
    if (percentage <= 80) return { text: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', solid: 'bg-amber-500' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', solid: 'bg-emerald-500' };
  };

  // 4. Attendance Trend
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const attendanceTrend = daysOfWeek.map((day, index) => {
    const dayRecords = filteredAttendance.filter(record => {
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
  }).filter(d => d.name !== 'Dom');

  const handleExportPDF = async () => {
    console.log('Export button clicked');
    if (!reportRef.current) {
      console.error('Report ref is null');
      return;
    }
    
    setExporting(true);
    try {
      console.log('Starting export...');
      window.scrollTo(0, 0); // Ensure we are at the top for capture
      
      // Ensure the report is visible and styled for export
      const header = document.querySelector('.export-only-header') as HTMLElement;
      if (header) header.style.display = 'block';
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // html-to-image is generally better with modern CSS
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2, // Standard high quality
        backgroundColor: '#ffffff',
        width: 1200, // Standard width for consistent scaling
        style: {
          padding: '0px',
          margin: '0px',
          width: '1200px',
          overflow: 'hidden',
          '--tw-bg-opacity': '1',
          '--tw-text-opacity': '1',
          '--tw-border-opacity': '1',
        } as any,
      });
      
      if (header) header.style.display = '';
      console.log('Image generated successfully');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10; // 10mm margin for a clean look
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => { 
        img.onload = resolve;
        img.onerror = reject;
      });

      const imgWidth = img.width;
      const imgHeight = img.height;
      console.log(`Captured image dimensions: ${imgWidth}x${imgHeight}`);
      
      const ratio = pdfWidth / imgWidth;
      const scaledImgHeight = imgHeight * ratio;
      
      let heightLeft = scaledImgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(dataUrl, 'PNG', margin, position, pdfWidth, scaledImgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if the content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - scaledImgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', margin, position, pdfWidth, scaledImgHeight);
        heightLeft -= pdfHeight;
      }
      
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Estadisticas_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      console.log('Export completed');

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF. Intentando imprimir directamente...');
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-outfit">Reportes y Estadísticas</h1>
          <p className="text-gray-500 font-outfit">Visualización de datos para toma de decisiones</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 border transition-all shadow-sm font-outfit ${
              showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
          <button 
            onClick={() => setShowIndividualReports(!showIndividualReports)}
            className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 border transition-all shadow-sm font-outfit ${
              showIndividualReports ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Reportes Individuales
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="bg-primary text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-outfit disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden no-print"
          >
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-widest font-outfit">Sección</label>
                <div className="relative">
                  <select 
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-primary/20 transition-all font-outfit"
                  >
                    <option value="all">Todas las secciones</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-widest font-outfit">Fecha Inicio</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all font-outfit"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-widest font-outfit">Fecha Fin</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all font-outfit"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button 
                  onClick={() => {
                    setFilterSection('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-primary font-bold flex items-center gap-2 hover:underline font-outfit"
                >
                  <X className="w-4 h-4" />
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={reportRef} className="space-y-10 print-report">
        {/* Print Only Header */}
        <div className="hidden print:block export-only-header mb-10 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900 font-outfit">Reporte de Estadísticas y Asistencia</h1>
          <p className="text-gray-500 font-outfit">Generado el: {new Date().toLocaleString()}</p>
          {filterSection !== 'all' && <p className="text-gray-500 font-outfit">Sección: {filterSection}</p>}
          {(startDate || endDate) && <p className="text-gray-500 font-outfit">Periodo: {startDate || 'Inicio'} - {endDate || 'Hoy'}</p>}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Total Alumnos', value: filteredBeneficiaries.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { 
              label: 'Asistencia Promedio', 
              value: `${avgAttendance}%`, 
              icon: Calendar, 
              color: getAttendanceColor(avgAttendance).text, 
              bg: getAttendanceColor(avgAttendance).bg 
            },
            { label: 'Secciones Activas', value: filterSection === 'all' ? sections.length : 1, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
            { 
              label: 'Tasa de Retención', 
              value: '94%', 
              icon: TrendingUp, 
              color: getAttendanceColor(94).text, 
              bg: getAttendanceColor(94).bg 
            },
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
                        className={`h-full shadow-[0_0_15px_rgba(255,255,255,0.5)] ${getAttendanceColor(item.progress).solid}`}
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

        {/* Individual Beneficiary Reports */}
        {showIndividualReports && (
          <div className="space-y-10 mt-10 print:mt-0 print:pt-10 print:break-before-page">
            <div className="flex items-center gap-4 mb-6 no-print">
              <div className="h-px flex-1 bg-gray-200"></div>
              <h2 className="text-2xl font-bold text-gray-900 font-outfit">Reportes Individuales</h2>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredBeneficiaries.map((beneficiary) => {
                const stats = getBeneficiaryStats(beneficiary.id);
                return (
                  <motion.div
                    key={beneficiary.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 break-inside-avoid"
                  >
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                          {beneficiary.photoUrl ? (
                            <img 
                              src={beneficiary.photoUrl} 
                              alt={beneficiary.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${
                          getAttendanceColor(stats.avg).solid
                        }`}>
                          <span className="text-xs font-bold">{stats.avg}%</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 font-outfit mb-1">{beneficiary.name}</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                            {beneficiary.section || 'Sin Sección'}
                          </span>
                          <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                            beneficiary.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'
                          }`}>
                            {beneficiary.status === 'Active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Últimas Asistencias</p>
                          <div className="flex gap-1.5">
                            {stats.history.length > 0 ? (
                              stats.history.map((record, idx) => (
                                <div 
                                  key={idx}
                                  title={record.date}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    record.records[beneficiary.id] 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-rose-500 text-white'
                                  }`}
                                >
                                  {record.records[beneficiary.id] ? 'P' : 'A'}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-400 italic">Sin registros recientes</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Edad</p>
                        <p className="text-lg font-bold text-gray-900 font-outfit">{beneficiary.age} años</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Género</p>
                        <p className="text-lg font-bold text-gray-900 font-outfit">{beneficiary.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
