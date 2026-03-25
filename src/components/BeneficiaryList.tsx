import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, MoreVertical, UserCheck, UserMinus, Download, UserPlus, Save, X, Info, Trash2, ArrowLeftRight, Edit2, Camera, Sparkles, RefreshCw, User as UserIcon, Upload } from 'lucide-react';
import { Beneficiary, Section, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Webcam from 'react-webcam';
import { GoogleGenAI } from "@google/genai";
import StudentProfileModal from './StudentProfileModal';

interface BeneficiaryListProps {
  user: User;
}

export default function BeneficiaryList({ user }: BeneficiaryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<{id: string, name: string} | null>(null);
  const [beneficiaryToToggle, setBeneficiaryToToggle] = useState<{id: string, name: string, currentStatus: string} | null>(null);
  const [beneficiaryToEdit, setBeneficiaryToEdit] = useState<Beneficiary | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState<Beneficiary | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    section: '',
    photoUrl: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    section: '',
    notes: ''
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'register' | 'edit'>('register');
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const artify = async (imageToProcess: string, callback: (result: string) => void) => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      console.warn('GEMINI_API_KEY not found. Skipping artification.');
      callback(imageToProcess);
      return;
    }

    setIsProcessingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = imageToProcess.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: 'Transform this person into a high-quality 2D hand-drawn animated character style, similar to the epic animation movie "The Prince of Egypt". Use strong, expressive lines, a classic hand-drawn aesthetic, and an epic illustrative feel. Keep the same pose and features but make it look like a professional 2D animation illustration. Return only the image.',
            },
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const comicBase64 = part.inlineData.data;
            const fullBase64 = `data:image/png;base64,${comicBase64}`;
            const compressed = await compressImage(fullBase64);
            callback(compressed);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error artifying:', error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const compressed = await compressImage(imageSrc);
      if (cameraMode === 'register') {
        setCapturedImage(compressed);
        artify(compressed, (res) => setCapturedImage(res));
      } else {
        setEditFormData(prev => ({ ...prev, photoUrl: compressed }));
        artify(compressed, (res) => setEditFormData(prev => ({ ...prev, photoUrl: res })));
      }
      setShowCamera(false);
    }
  }, [webcamRef, cameraMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'register' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressImage(base64);
        if (mode === 'register') {
          setCapturedImage(compressed);
          artify(compressed, (res) => setCapturedImage(res));
        } else {
          setEditFormData(prev => ({ ...prev, photoUrl: compressed }));
          artify(compressed, (res) => setEditFormData(prev => ({ ...prev, photoUrl: res })));
        }
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (user.role !== 'admin' && user.churchId === undefined) {
      setLoading(false);
      return;
    }

    const q = user.role === 'admin' 
      ? query(collection(db, 'beneficiaries'))
      : query(collection(db, 'beneficiaries'), where('churchId', '==', user.churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Beneficiary));
      setBeneficiaries(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'beneficiaries');
    });

    const sQ = user.role === 'admin'
      ? query(collection(db, 'classes'))
      : query(collection(db, 'classes'), where('churchId', '==', user.churchId));
    const sUnsubscribe = onSnapshot(sQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Section));
      setSections(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });

    return () => {
      unsubscribe();
      sUnsubscribe();
    };
  }, [user.uid, user.churchId, user.role]);

  const updateBeneficiaries = (newList: Beneficiary[]) => {
    setBeneficiaries(newList);
    localStorage.setItem('tutor_beneficiaries', JSON.stringify(newList));
  };

  const filtered = beneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newBeneficiary = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender as 'M' | 'F',
        section: formData.section || undefined,
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0],
        photoUrl: capturedImage || undefined,
        ownerId: user.uid,
        churchId: user.churchId || ''
      };
      await addDoc(collection(db, 'beneficiaries'), newBeneficiary);
      setFormData({ name: '', age: '', gender: 'M', section: '', notes: '' });
      setCapturedImage(null);
      setShowRegisterForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'beneficiaries');
    }
  };

  const confirmDelete = async () => {
    if (beneficiaryToDelete) {
      try {
        await deleteDoc(doc(db, 'beneficiaries', beneficiaryToDelete.id));
        setBeneficiaryToDelete(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `beneficiaries/${beneficiaryToDelete.id}`);
      }
    }
  };

  const toggleStatus = (id: string, name: string, currentStatus: string) => {
    setBeneficiaryToToggle({ id, name, currentStatus });
  };

  const handleEditClick = (beneficiary: Beneficiary) => {
    setBeneficiaryToEdit(beneficiary);
    setEditFormData({
      name: beneficiary.name,
      age: beneficiary.age.toString(),
      gender: beneficiary.gender,
      section: beneficiary.section || '',
      photoUrl: beneficiary.photoUrl || ''
    });
  };

  const confirmToggleStatus = async () => {
    if (beneficiaryToToggle) {
      try {
        const newStatus = beneficiaryToToggle.currentStatus === 'Active' ? 'Inactive' : 'Active';
        await updateDoc(doc(db, 'beneficiaries', beneficiaryToToggle.id), { status: newStatus });
        setBeneficiaryToToggle(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `beneficiaries/${beneficiaryToToggle.id}`);
      }
    }
  };

  const confirmEdit = async () => {
    if (beneficiaryToEdit && editFormData.name.trim()) {
      try {
        await updateDoc(doc(db, 'beneficiaries', beneficiaryToEdit.id), {
          name: editFormData.name.toUpperCase(),
          age: parseInt(editFormData.age),
          gender: editFormData.gender as 'M' | 'F',
          section: editFormData.section || undefined,
          photoUrl: editFormData.photoUrl || undefined
        });
        setBeneficiaryToEdit(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `beneficiaries/${beneficiaryToEdit.id}`);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 font-outfit text-gray-500">Cargando alumnos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Listado de Alumnos</h1>
          <p className="text-gray-500 font-outfit">Gestione y visualice la información de sus alumnos</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="bg-primary text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-outfit"
          >
            <UserPlus className="w-5 h-5" />
            {showRegisterForm ? 'Cerrar Formulario' : 'Registrar Nuevo'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showRegisterForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden mb-8">
              <div className="bg-primary/5 p-6 border-b border-primary/10">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2 font-outfit">
                  <UserPlus className="w-6 h-6" />
                  Nuevo Registro de Alumno
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-full aspect-square bg-gray-100 rounded-[2rem] overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                      {capturedImage ? (
                        <div className="relative w-full h-full">
                          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                          {isProcessingImage && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                              <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Creando Estilo Épico...</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCameraMode('register');
                                setShowCamera(true);
                              }}
                              className="flex-1 bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                            >
                              <RefreshCw className="w-3 h-3" /> Reintentar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCameraMode('register');
                            setShowCamera(true);
                          }}
                          className="flex flex-col items-center gap-2 text-gray-400 hover:text-primary transition-colors"
                        >
                          <Camera className="w-10 h-10" />
                          <span className="text-xs font-bold uppercase tracking-widest">Tomar Foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600 uppercase font-outfit">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all uppercase font-outfit bg-gray-50/50"
                        placeholder="NOMBRE DEL ALUMNO"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600 uppercase font-outfit">Edad</label>
                      <input
                        type="number"
                        required
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-outfit bg-gray-50/50"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600 uppercase font-outfit">Clase / Club</label>
                      <select
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all bg-gray-50/50 font-outfit"
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                      >
                        <option value="">Seleccionar clase...</option>
                        {sections.map(section => (
                          <option key={section.id} value={section.name}>{section.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600 uppercase font-outfit">Género</label>
                      <select
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all bg-gray-50/50 font-outfit"
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 font-outfit"
                      >
                        <Save className="w-5 h-5" />
                        Guardar Alumno
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-outfit bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest font-outfit">Alumno</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest font-outfit">Edad / Género</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest font-outfit">Clase</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest font-outfit">Estado</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest font-outfit text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <motion.tr 
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-primary/[0.02] transition-colors"
                >
                  <td className="px-8 py-5">
                    <div 
                      className="flex items-center gap-4 cursor-pointer group/profile"
                      onClick={() => setSelectedStudentProfile(b)}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0 group-hover/profile:scale-110 transition-transform">
                        {b.photoUrl ? (
                          <img src={b.photoUrl} alt={b.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UserIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 font-outfit group-hover/profile:text-primary transition-colors">{b.name}</p>
                        <p className="text-xs text-gray-400 font-outfit">Registrado: {b.registrationDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-gray-700 font-outfit">{b.age} años</p>
                    <p className="text-xs text-gray-400 font-outfit">{b.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-secondary/10 text-secondary border border-secondary/20 font-outfit">
                      {b.section || 'Sin clase'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => toggleStatus(b.id, b.name, b.status)}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 font-outfit ${
                        b.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                      title="Cambiar estado"
                    >
                      {b.status === 'Active' ? <UserCheck className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                      {b.status === 'Active' ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setShowEditConfirm(b)}
                        className="p-2.5 hover:bg-primary/10 rounded-xl transition-colors text-gray-400 hover:text-primary"
                        title="Editar alumno"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setBeneficiaryToDelete({ id: b.id, name: b.name })}
                        className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-600"
                        title="Eliminar alumno"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-gray-500 font-bold font-outfit text-lg">No se encontraron alumnos con esos criterios.</p>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      <StudentProfileModal 
        student={selectedStudentProfile} 
        onClose={() => setSelectedStudentProfile(null)} 
      />

      {/* Status Change Confirmation Modal */}
      <AnimatePresence>
        {beneficiaryToToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${
                beneficiaryToToggle.currentStatus === 'Active' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {beneficiaryToToggle.currentStatus === 'Active' ? <UserMinus className="w-10 h-10" /> : <UserCheck className="w-10 h-10" />}
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-3 font-outfit">¿Cambiar estado?</h2>
              <p className="text-center text-gray-500 mb-10 font-outfit leading-relaxed">
                ¿Desea cambiar el estado de <span className="font-bold text-gray-800">{beneficiaryToToggle.name}</span> a 
                <span className={`font-bold ml-1 ${beneficiaryToToggle.currentStatus === 'Active' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {beneficiaryToToggle.currentStatus === 'Active' ? 'Inactivo' : 'Activo' }
                </span>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setBeneficiaryToToggle(null)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all font-outfit"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmToggleStatus}
                  className={`flex-1 px-6 py-4 text-white font-bold rounded-2xl transition-all shadow-xl font-outfit ${
                    beneficiaryToToggle.currentStatus === 'Active' 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Confirmation Modal */}
      <AnimatePresence>
        {showEditConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-8">
                <Edit2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4 font-outfit">¿Editar participante?</h2>
              <p className="text-center text-gray-500 mb-10 font-outfit leading-relaxed">
                ¿Desea editar los datos de <span className="font-bold text-gray-900">{showEditConfirm.name}</span>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditConfirm(null)}
                  className="flex-1 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all font-outfit"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleEditClick(showEditConfirm);
                    setShowEditConfirm(null);
                  }}
                  className="flex-1 px-8 py-4 bg-primary text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/20 font-outfit"
                >
                  Sí, editar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {beneficiaryToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                <Edit2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-3 font-outfit">Editar Alumno</h2>
              <p className="text-center text-gray-500 mb-8 font-outfit">
                Modifique la información de <span className="font-bold text-gray-800">{beneficiaryToEdit.name}</span>.
              </p>
              
              <div className="space-y-5 mb-10">
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-100 border-4 border-gray-50 shadow-xl group">
                    {editFormData.photoUrl ? (
                      <img src={editFormData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <UserIcon className="w-12 h-12" />
                      </div>
                    )}
                    {isProcessingImage && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCameraMode('edit');
                        setShowCamera(true);
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Cambiar Foto</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 uppercase block font-outfit">Nombre Completo</label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all uppercase font-bold text-gray-800 font-outfit bg-gray-50/50"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 uppercase block font-outfit">Edad</label>
                    <input
                      type="number"
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-gray-800 font-outfit bg-gray-50/50"
                      value={editFormData.age}
                      onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 uppercase block font-outfit">Género</label>
                    <select
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all bg-gray-50/50 font-bold text-gray-800 font-outfit"
                      value={editFormData.gender}
                      onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 uppercase block font-outfit">Clase / Club</label>
                  <select
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all bg-gray-50/50 font-bold text-gray-800 font-outfit"
                    value={editFormData.section}
                    onChange={(e) => setEditFormData({...editFormData, section: e.target.value})}
                  >
                    <option value="">Seleccionar clase...</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.name}>{section.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setBeneficiaryToEdit(null)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all font-outfit"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmEdit}
                  disabled={!editFormData.name.trim() || !editFormData.age}
                  className="flex-1 px-6 py-4 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/20 font-outfit"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowCamera(false)}
                className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 font-outfit uppercase italic tracking-tight">Capturar Foto</h3>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Sonríe para el perfil épico</p>
              </div>

              <div className="rounded-[2.5rem] overflow-hidden bg-black aspect-square mb-8 shadow-2xl border-4 border-gray-50 relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ facingMode: "user" }}
                  disablePictureInPicture={false}
                  forceScreenshotSourceSize={false}
                  imageSmoothing={true}
                  mirrored={false}
                  onUserMedia={() => {}}
                  onUserMediaError={() => {}}
                  screenshotQuality={0.92}
                />
                <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
              </div>

              <div className="flex gap-4">
                <input 
                  type="file" 
                  ref={cameraMode === 'register' ? fileInputRef : editFileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, cameraMode)}
                />
                <button
                  type="button"
                  onClick={() => (cameraMode === 'register' ? fileInputRef : editFileInputRef).current?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-5 rounded-2xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 font-outfit"
                >
                  <Upload className="w-6 h-6" />
                  Subir
                </button>
                <button
                  type="button"
                  onClick={capture}
                  className="flex-1 bg-primary hover:opacity-90 text-white font-bold py-5 rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 font-outfit"
                >
                  <Camera className="w-6 h-6" />
                  Capturar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {beneficiaryToDelete && (
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
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-3 font-outfit">¿Confirmar eliminación?</h2>
              <p className="text-center text-gray-500 mb-10 font-outfit leading-relaxed">
                Está a punto de eliminar a <span className="font-bold text-gray-800">{beneficiaryToDelete.name}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setBeneficiaryToDelete(null)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all font-outfit"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-100 font-outfit"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
