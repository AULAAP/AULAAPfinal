import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Calendar, Hash, Tag, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Beneficiary } from '../types';

interface StudentProfileModalProps {
  student: Beneficiary | null;
  onClose: () => void;
}

export default function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
  if (!student) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col md:flex-row"
        >
          {/* Left Side: Photo */}
          <div className="w-full md:w-1/2 bg-gray-50 relative aspect-square md:aspect-auto">
            {student.photoUrl ? (
              <img 
                src={student.photoUrl} 
                alt={student.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-100">
                <User className="w-24 h-24 mb-4" />
                <span className="text-sm font-black uppercase tracking-widest">Sin Foto</span>
              </div>
            )}
            
            {/* Status Badge on Photo */}
            <div className={`absolute top-6 left-6 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md ${
              student.status === 'Active' 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-amber-500/90 text-white'
            }`}>
              {student.status === 'Active' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {student.status === 'Active' ? 'Activo' : 'Inactivo'}
            </div>
          </div>

          {/* Right Side: Details */}
          <div className="flex-1 p-8 md:p-10 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Perfil del Alumno</p>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{student.name}</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Edad / Género</p>
                  <p className="font-bold text-gray-800">{student.age} años • {student.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clase Asignada</p>
                  <p className="font-bold text-gray-800">{student.section || 'Sin asignar'}</p>
                </div>
              </div>

              {student.projectCode && (
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código de Proyecto</p>
                    <p className="font-bold text-gray-800">{student.projectCode}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha de Registro</p>
                  <p className="font-bold text-gray-800">{student.registrationDate}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
              >
                Cerrar Perfil
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
