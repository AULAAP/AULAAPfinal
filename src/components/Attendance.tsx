import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Users, CheckCircle2, Save, Calendar, ChevronDown, Clock, XCircle, TrendingUp, TrendingDown, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Beneficiary, AttendanceRecord, Section, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import StudentProfileModal from './StudentProfileModal';

interface AttendanceProps {
  user: User;
}

export default function Attendance({ user }: AttendanceProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Beneficiary | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, boolean>>>({});
  const [currentDate] = useState(new Date());

  useEffect(() => {
    if (user.role !== 'admin' && user.churchId === undefined) {
      setLoading(false);
      return;
    }

    const sQ = user.role === 'admin'
      ? query(collection(db, 'classes'))
      : query(collection(db, 'classes'), where('churchId', '==', user.churchId));
    const sUnsubscribe = onSnapshot(sQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Section));
      setSections(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });

    const bQ = user.role === 'admin'
      ? query(collection(db, 'beneficiaries'))
      : query(collection(db, 'beneficiaries'), where('churchId', '==', user.churchId));
    const bUnsubscribe = onSnapshot(bQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Beneficiary));
      setBeneficiaries(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'beneficiaries');
    });

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
      setAttendanceData(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
    });

    return () => {
      sUnsubscribe();
      bUnsubscribe();
      aUnsubscribe();
    };
  }, [user.uid, user.churchId, user.role]);

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Adjust startDay to Monday (0 = Mon, 6 = Sun)
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
    
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const isDateInCurrentWeek = (date: Date) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return date >= monday && date <= sunday;
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getSectionStats = () => {
    if (!selectedSection) return { percentage: 0, trend: 'up' };

    const sectionBeneficiaries = beneficiaries.filter(b => b.section === selectedSection.name && b.status === 'Active');
    if (sectionBeneficiaries.length === 0) return { percentage: 0, trend: 'up' };

    const now = new Date();
    const todayStr = formatDate(now);
    
    // Current week
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    // Previous week
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevWeekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(prevMonday);
      d.setDate(prevMonday.getDate() + i);
      return d;
    });

    const calculateForDates = (dates: Date[]) => {
      let totalPossible = 0;
      let totalPresent = 0;

      sectionBeneficiaries.forEach(child => {
        const childAttendance = attendanceData[child.id] || {};
        dates.forEach(date => {
          const dateStr = formatDate(date);
          const dayNum = date.getDay();
          if (selectedSection.schedule.days.includes(dayNum) && dateStr <= todayStr) {
            totalPossible++;
            if (childAttendance[dateStr] === undefined || childAttendance[dateStr] === true) {
              totalPresent++;
            }
          }
        });
      });
      return totalPossible === 0 ? 100 : (totalPresent / totalPossible) * 100;
    };

    const currentPercentage = calculateForDates(currentWeekDates);
    const prevPercentage = calculateForDates(prevWeekDates);

    return {
      percentage: Math.round(currentPercentage),
      trend: currentPercentage >= prevPercentage ? 'up' : 'down'
    };
  };

  const getChildStats = (childId: string) => {
    if (!selectedSection) return { percentage: 0, trend: 'up' };

    const now = new Date();
    const todayStr = formatDate(now);
    
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevWeekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(prevMonday);
      d.setDate(prevMonday.getDate() + i);
      return d;
    });

    const calculateForDates = (dates: Date[]) => {
      let totalPossible = 0;
      let totalPresent = 0;
      const childAttendance = attendanceData[childId] || {};

      dates.forEach(date => {
        const dateStr = formatDate(date);
        const dayNum = date.getDay();
        if (selectedSection.schedule.days.includes(dayNum) && dateStr <= todayStr) {
          totalPossible++;
          if (childAttendance[dateStr] === undefined || childAttendance[dateStr] === true) {
            totalPresent++;
          }
        }
      });
      return totalPossible === 0 ? 100 : (totalPresent / totalPossible) * 100;
    };

    const currentPercentage = calculateForDates(currentWeekDates);
    const prevPercentage = calculateForDates(prevWeekDates);

    return {
      percentage: Math.round(currentPercentage),
      trend: currentPercentage >= prevPercentage ? 'up' : 'down'
    };
  };

  const getSectionStatsForCard = (sectionName: string) => {
    const section = sections.find(s => s.name === sectionName);
    if (!section) return { percentage: 0, trend: 'up' };

    const sectionBeneficiaries = beneficiaries.filter(b => b.section === sectionName && b.status === 'Active');
    if (sectionBeneficiaries.length === 0) return { percentage: 0, trend: 'up' };

    const now = new Date();
    const todayStr = formatDate(now);
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevWeekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(prevMonday);
      d.setDate(prevMonday.getDate() + i);
      return d;
    });

    const calculateForDates = (dates: Date[]) => {
      let totalPossible = 0;
      let totalPresent = 0;

      sectionBeneficiaries.forEach(child => {
        const childAttendance = attendanceData[child.id] || {};
        dates.forEach(date => {
          const dateStr = formatDate(date);
          const dayNum = date.getDay();
          if (section.schedule.days.includes(dayNum) && dateStr <= todayStr) {
            totalPossible++;
            if (childAttendance[dateStr] === undefined || childAttendance[dateStr] === true) {
              totalPresent++;
            }
          }
        });
      });
      return totalPossible === 0 ? 100 : (totalPresent / totalPossible) * 100;
    };

    const currentPercentage = calculateForDates(currentWeekDates);
    const prevPercentage = calculateForDates(prevWeekDates);

    return {
      percentage: Math.round(currentPercentage),
      trend: currentPercentage >= prevPercentage ? 'up' : 'down'
    };
  };

  const stats = getSectionStats();

  const monthDays = getMonthDays(currentDate);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const filteredBeneficiaries = beneficiaries
    .filter(b => b.section === selectedSection?.name && b.status === 'Active')
    .sort((a, b) => {
      const getLastName = (name: string) => {
        const parts = name.trim().split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
      };
      return getLastName(a.name).localeCompare(getLastName(b.name));
    });

  const handleToggle = async (childId: string, dateStr: string) => {
    if (!selectedSection) return;

    const childData = attendanceData[childId] || {};
    const currentVal = childData[dateStr] === undefined ? true : childData[dateStr];
    const newVal = !currentVal;

    const nextChildData = { ...childData, [dateStr]: newVal };
    const nextAttendanceData = { ...attendanceData, [childId]: nextChildData };
    setAttendanceData(nextAttendanceData);

    try {
      const docId = `${selectedSection.id}_${dateStr}`;
      const classBeneficiaries = beneficiaries.filter(b => b.section === selectedSection.name);
      const records: Record<string, boolean> = {};
      
      classBeneficiaries.forEach(b => {
        const bData = nextAttendanceData[b.id] || {};
        records[b.id] = bData[dateStr] === undefined ? true : bData[dateStr];
      });

      await setDoc(doc(db, 'attendance', docId), {
        classId: selectedSection.id,
        date: dateStr,
        records,
        ownerId: user.uid,
        churchId: user.churchId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    }
  };

  const isPresent = (childId: string, dateStr: string) => {
    const childData = attendanceData[childId] || {};
    return childData[dateStr] === undefined ? true : childData[dateStr];
  };

  const getMonthNumber = (date: Date) => {
    return String(date.getMonth() + 1).padStart(2, '0');
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString('es-DO', { month: 'long' }).toUpperCase();
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="p-3 bg-white hover:bg-primary hover:text-white rounded-2xl shadow-md border border-gray-50 transition-all group">
          <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-800 italic tracking-tight">REGISTRO DE ASISTENCIA</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Gestiona la participación de tus alumnos</p>
        </div>
      </div>

      {!selectedSection ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedSection(section)}
              className="bg-white p-10 card-rounded hover:scale-105 transition-all text-left group relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-blue-50 group-hover:shadow-blue-200">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2 italic tracking-tight">{section.name}</h3>
              {section.tutorName && (
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">Tutor: {section.tutorName}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-6">
                {section.schedule.days.map(d => (
                  <span key={d} className="text-[10px] font-black bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                    {dayNamesShort[d]}
                  </span>
                ))}
                <span className="text-[10px] font-black bg-blue-50 text-primary px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-tighter">
                  <Clock className="w-3 h-3" />
                  {(() => {
                    const [h, m] = section.schedule.time.split(':');
                    const hour = parseInt(h);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    return `${hour12}:${m} ${ampm}`;
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                  {beneficiaries.filter(b => b.section === section.name && b.status === 'Active').length} Alumnos
                </p>
                {(() => {
                  const s = getSectionStatsForCard(section.name);
                  return (
                    <div className={`flex items-center gap-1 text-xs font-black ${s.trend === 'up' ? 'text-accent' : 'text-red-500'}`}>
                      {s.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{s.percentage}%</span>
                    </div>
                  );
                })()}
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedSection(null)}
                className="btn-primary py-3 px-6 text-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                VOLVER
              </button>
              <div className="h-10 w-px bg-gray-200 hidden md:block" />
              <div>
                <h2 className="text-2xl font-black text-gray-800 italic tracking-tight leading-none">{selectedSection.name}</h2>
                {selectedSection.tutorName && (
                  <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">Tutor: {selectedSection.tutorName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-accent bg-accent/10 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-accent/20">
                <CheckCircle2 className="w-5 h-5" />
                Auto-guardado activo
              </div>
            </div>
          </div>

          <div className="bg-secondary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-amber-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
              <div className="p-6 bg-white/20 rounded-[2rem] backdrop-blur-md shadow-inner">
                <Users className="w-10 h-10" />
              </div>
              <div className={`flex flex-col ${stats.trend === 'down' ? 'animate-pulse' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black tracking-tighter">{stats.percentage}%</span>
                  {stats.trend === 'up' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/70">Asistencia Grupal</span>
              </div>
            </div>
            <div className="h-16 w-px bg-white/20 hidden md:block relative z-10" />
            <div className="flex-1 relative z-10">
              <p className="text-xl font-black uppercase tracking-tight mb-1">Modo Simplificado</p>
              <p className="text-amber-50 font-bold">Todos están <span className="text-white underline decoration-white/50 underline-offset-4">Presentes</span> por defecto. Solo marca a los ausentes.</p>
            </div>
            
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 -translate-y-1/4" />
          </div>

          <div className="bg-white card-rounded overflow-hidden">
            <div className="bg-primary text-white p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                  <span className="text-5xl font-black leading-none tracking-tighter">{getMonthNumber(currentDate)}</span>
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70 mt-1">{currentDate.getFullYear()}</span>
                </div>
                <div className="h-16 w-px bg-white/20 hidden md:block" />
                <h4 className="text-4xl font-black uppercase tracking-widest italic">
                  {getMonthName(currentDate)}
                </h4>
              </div>
              
              <div className="flex gap-8 text-xs font-black uppercase tracking-widest bg-white/10 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-accent rounded-full shadow-lg shadow-green-200" />
                  <span>Presente</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-4 border-red-500 rounded-full" />
                  <span>Ausente</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px] p-10">
                <div className="space-y-8">
                  {filteredBeneficiaries.map((child) => (
                    <div key={child.id} className="flex items-center gap-8 group hover:bg-blue-50/30 p-4 rounded-[2rem] transition-all">
                      {/* Child Info */}
                      <div 
                        className="flex items-center gap-6 w-72 flex-shrink-0 cursor-pointer group/profile"
                        onClick={() => setSelectedStudentProfile(child)}
                      >
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-100 group-hover/profile:scale-110 transition-transform overflow-hidden">
                          {child.photoUrl ? (
                            <img 
                              src={child.photoUrl} 
                              alt={child.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            child.name[0]
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-xl font-black text-gray-800 truncate uppercase tracking-tight leading-none mb-1 group-hover/profile:text-primary transition-colors">{child.name}</h3>
                        </div>
                      </div>

                      {/* Attendance Days */}
                      <div className="flex-1 bg-blue-50/30 border border-blue-50 rounded-[2.5rem] p-6 flex items-center gap-8">
                        <div className="flex flex-wrap gap-4 flex-1">
                          {monthDays
                            .filter(({ isCurrentMonth, date }) => isCurrentMonth && selectedSection.schedule.days.includes(date.getDay()))
                            .map(({ date }) => {
                              const dateStr = formatDate(date);
                              const active = isPresent(child.id, dateStr);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const isPast = date < today;
                              const isToday = formatDate(new Date()) === dateStr;
                              const inCurrentWeek = isDateInCurrentWeek(date);
                              const dayOfWeek = date.getDay();
                              const isScheduled = selectedSection.schedule.days.includes(dayOfWeek);
                              const isEnabled = inCurrentWeek && isScheduled;
                              const dayName = date.toLocaleString('es-DO', { weekday: 'short' }).toUpperCase();

                              return (
                                <div key={dateStr} className="flex flex-col items-center">
                                  <span className={`text-[8px] font-black uppercase tracking-widest mb-2 ${isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                                    {dayName}
                                  </span>
                                  <button
                                    disabled={!isEnabled}
                                    onClick={() => handleToggle(child.id, dateStr)}
                                    className={`w-12 h-12 flex items-center justify-center transition-all relative rounded-2xl border-4 ${
                                      !isEnabled
                                        ? 'text-gray-300 cursor-not-allowed border-gray-100 bg-gray-50/50'
                                        : active
                                          ? 'bg-accent border-accent text-white font-black shadow-lg shadow-green-100 scale-110'
                                          : isPast
                                            ? 'bg-gray-100 border-gray-300 text-gray-500 font-black'
                                            : 'bg-white border-primary text-primary font-black hover:bg-blue-50 shadow-md'
                                    }`}
                                  >
                                    <span className="text-sm relative z-10">
                                      {date.getDate()}
                                    </span>
                                    
                                    {isEnabled && !active && (
                                      <div className="absolute inset-0 border-4 border-red-500 rounded-2xl animate-pulse" />
                                    )}
                                    
                                    {isToday && (
                                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-secondary shadow-[0_0_12px_rgba(251,191,36,0.8)] border-2 border-white" />
                                    )}
                                  </button>
                                  
                                  {isEnabled && (
                                    <span className={`text-[8px] font-black mt-2 uppercase tracking-widest leading-none ${active ? 'text-accent' : 'text-red-500'}`}>
                                      {active ? 'PRES' : 'AUS'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                        {/* Individual Stats */}
                        <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-8 min-w-[100px]">
                          {(() => {
                            const s = getChildStats(child.id);
                            return (
                              <Fragment>
                                <div className={`p-3 rounded-2xl mb-2 shadow-sm ${s.trend === 'up' ? 'bg-blue-100 text-primary' : 'bg-red-100 text-red-500'}`}>
                                  {s.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </div>
                                <span className={`text-2xl font-black leading-none tracking-tighter ${s.trend === 'up' ? 'text-primary' : 'text-red-500'}`}>
                                  {s.percentage}%
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Asist.</span>
                              </Fragment>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {filteredBeneficiaries.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto mb-6">
                  <Users className="w-12 h-12" />
                </div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No hay alumnos activos en esta clase.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Student Profile Modal */}
      <StudentProfileModal 
        student={selectedStudentProfile} 
        onClose={() => setSelectedStudentProfile(null)} 
      />
    </div>
  );
}
