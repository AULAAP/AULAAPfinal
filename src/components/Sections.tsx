import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Plus, Clock, Calendar, Trash2, X, ChevronLeft, Users, User as UserIcon } from 'lucide-react';
import { Section, Beneficiary, User } from '../types';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import StudentProfileModal from './StudentProfileModal';

interface SectionsProps {
  user: User;
}

export default function Sections({ user }: SectionsProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionToDelete, setSectionToDelete] = useState<{id: string, name: string} | null>(null);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Beneficiary | null>(null);

  useEffect(() => {
    if (user.role !== 'admin' && user.churchId === undefined) {
      setLoading(false);
      return;
    }

    const q = user.role === 'admin'
      ? query(collection(db, 'classes'))
      : query(collection(db, 'classes'), where('churchId', '==', user.churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => {
      unsubscribe();
      bUnsubscribe();
    };
  }, [user.uid, user.churchId, user.role]);

  const [newSection, setNewSection] = useState<{name: string, tutorName: string, days: number[], time: string}>({
    name: '',
    tutorName: user.username,
    days: [],
    time: '08:00'
  });

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleAddSection = async () => {
    if (!newSection.name || newSection.days.length === 0) return;
    
    try {
      if (isEditing && sectionToEdit) {
        const sectionRef = doc(db, 'classes', sectionToEdit.id);
        await updateDoc(sectionRef, {
          name: newSection.name,
          tutorName: newSection.tutorName,
          schedule: { days: newSection.days, time: newSection.time }
        });
        setIsEditing(false);
        setSectionToEdit(null);
      } else {
        await addDoc(collection(db, 'classes'), {
          name: newSection.name,
          tutorName: newSection.tutorName,
          schedule: {
            days: newSection.days,
            time: newSection.time
          },
          ownerId: user.uid,
          churchId: user.churchId || ''
        });
      }
      setNewSection({ name: '', tutorName: user.username, days: [], time: '08:00' });
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'classes');
    }
  };

  const startEditing = (section: Section) => {
    setSectionToEdit(section);
    setShowEditConfirm(true);
  };

  const confirmEdit = () => {
    if (sectionToEdit) {
      setNewSection({
        name: sectionToEdit.name,
        tutorName: sectionToEdit.tutorName || '',
        days: sectionToEdit.schedule.days,
        time: sectionToEdit.schedule.time
      });
      setIsEditing(true);
      setShowEditConfirm(false);
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSectionToEdit(null);
    setNewSection({ name: '', tutorName: '', days: [], time: '08:00' });
  };

  const confirmDelete = async () => {
    if (sectionToDelete) {
      try {
        await deleteDoc(doc(db, 'classes', sectionToDelete.id));
        setSectionToDelete(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `classes/${sectionToDelete.id}`);
      }
    }
  };

  const toggleDay = (day: number) => {
    setNewSection(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day].sort()
    }));
  };

  const getParticipantCount = (sectionName: string) => {
    return beneficiaries.filter(b => b.section === sectionName).length;
  };

  if (loading) return <div className="flex items-center justify-center h-64 font-outfit text-gray-500">Cargando clases...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Gestión de Clases</h1>
          <p className="text-gray-500 font-outfit">Configure los horarios y días de sus clubes y clases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-gray-100 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center justify-between font-outfit">
              <div className="flex items-center gap-3">
                {isEditing ? <Settings className="w-6 h-6 text-amber-600" /> : <Plus className="w-6 h-6 text-primary" />}
                {isEditing ? 'Editar Clase' : 'Nueva Clase'}
              </div>
              {isEditing && (
                <button 
                  onClick={cancelEdit}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest font-outfit"
                >
                  Cancelar
                </button>
              )}
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider font-outfit">Nombre de la Clase</label>
                <input 
                  type="text" 
                  placeholder="EJ: CLUB DE ARTE"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all uppercase font-outfit bg-gray-50/50"
                  value={newSection.name}
                  onChange={e => setNewSection({...newSection, name: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider font-outfit">Nombre del Tutor</label>
                <input 
                  type="text" 
                  placeholder="EJ: JUAN PÉREZ"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all uppercase font-outfit bg-gray-50/50"
                  value={newSection.tutorName}
                  onChange={e => setNewSection({...newSection, tutorName: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider font-outfit">Horario de Inicio</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="time" 
                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-outfit bg-gray-50/50"
                    value={newSection.time}
                    onChange={e => setNewSection({...newSection, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider font-outfit">Días Programados</label>
                <div className="grid grid-cols-4 gap-2.5">
                  {dayNames.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`px-2 py-3 rounded-2xl text-xs font-bold transition-all font-outfit ${
                        newSection.days.includes(i)
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleAddSection}
                disabled={!newSection.name || newSection.days.length === 0}
                className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6 font-outfit ${
                  isEditing 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                    : 'bg-primary hover:opacity-90 shadow-primary/20'
                }`}
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Clase'}
              </button>
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {sections.map((section) => (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 flex flex-col justify-between group hover:shadow-2xl hover:shadow-black/10 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditing(section)}
                          className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary hover:bg-primary/20 transition-all"
                          title="Configurar clase"
                        >
                          <Settings className="w-7 h-7" />
                        </button>
                        <button 
                          onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                          className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all ${
                            expandedSection === section.id 
                              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                              : 'bg-blue-50 text-primary hover:bg-blue-100'
                          }`}
                          title="Ver alumnos"
                        >
                          <Users className="w-7 h-7" />
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          const count = getParticipantCount(section.name);
                          setSectionToDelete({ id: section.id, name: section.name });
                        }}
                        className={`p-3 rounded-xl transition-all shadow-sm ${
                          getParticipantCount(section.name) > 0 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-red-600 hover:text-white hover:border-red-600'
                        }`}
                        title={getParticipantCount(section.name) > 0 ? "No se puede eliminar una clase con participantes" : "Eliminar clase"}
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 font-outfit">{section.name}</h3>
                    {section.tutorName && (
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 font-outfit">Tutor: {section.tutorName}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-2 font-outfit font-medium">
                        <Clock className="w-5 h-5 text-gray-400" />
                        {(() => {
                          const [h, m] = section.schedule.time.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const hour12 = hour % 12 || 12;
                          return `${hour12}:${m} ${ampm}`;
                        })()}
                      </div>
                      <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-xl font-bold font-outfit">
                        {getParticipantCount(section.name)} {getParticipantCount(section.name) === 1 ? 'Alumno' : 'Alumnos'}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSection === section.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-6"
                        >
                          <div className="pt-4 border-t border-gray-50 space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lista de Alumnos</p>
                            {beneficiaries
                              .filter(b => b.section === section.name)
                              .map(child => (
                                <div 
                                  key={child.id} 
                                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group/profile"
                                  onClick={() => setSelectedStudentProfile(child)}
                                >
                                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden flex-shrink-0 group-hover/profile:scale-110 transition-transform">
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
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate uppercase tracking-tight group-hover/profile:text-primary transition-colors">{child.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{child.status === 'Active' ? 'Activo' : 'Inactivo'}</p>
                                  </div>
                                </div>
                              ))}
                            {getParticipantCount(section.name) === 0 && (
                              <p className="text-xs text-gray-400 italic py-2">No hay alumnos asignados.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {dayNames.map((day, i) => (
                      <span
                        key={day}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest font-outfit ${
                          section.schedule.days.includes(i)
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-50 text-gray-300'
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {sections.length === 0 && (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold font-outfit text-xl mb-2">No hay clases configuradas.</p>
              <p className="text-gray-400 font-outfit">Utilice el formulario de la izquierda para añadir una.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEditConfirm && sectionToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-8">
                <Settings className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-3 font-outfit">¿Editar clase?</h2>
              <p className="text-center text-gray-500 mb-10 font-outfit leading-relaxed">
                ¿Desea editar los elementos de la clase <span className="font-bold text-gray-800">{sectionToEdit.name}</span>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditConfirm(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all font-outfit"
                >
                  No, Cancelar
                </button>
                <button
                  onClick={confirmEdit}
                  className="flex-1 px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-amber-100 font-outfit"
                >
                  Sí, Editar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {sectionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-3 font-outfit">
                {getParticipantCount(sectionToDelete.name) > 0 ? 'No se puede eliminar' : '¿Eliminar clase?'}
              </h2>
              <p className="text-center text-gray-500 mb-10 font-outfit leading-relaxed">
                {getParticipantCount(sectionToDelete.name) > 0 
                  ? <>La clase <span className="font-bold text-gray-800">{sectionToDelete.name}</span> tiene <span className="font-bold text-red-600">{getParticipantCount(sectionToDelete.name)} alumnos</span>. Debe estar vacía para poder eliminarla.</>
                  : <>¿Está seguro de que desea eliminar la clase <span className="font-bold text-gray-800">{sectionToDelete.name}</span>? Esta acción no se puede deshacer.</>
                }
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setSectionToDelete(null)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all font-outfit"
                >
                  {getParticipantCount(sectionToDelete.name) > 0 ? 'Entendido' : 'Cancelar'}
                </button>
                {getParticipantCount(sectionToDelete.name) === 0 && (
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-100 font-outfit"
                  >
                    Sí, Eliminar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Student Profile Modal */}
      <StudentProfileModal 
        student={selectedStudentProfile} 
        onClose={() => setSelectedStudentProfile(null)} 
      />
    </div>
  );
}
