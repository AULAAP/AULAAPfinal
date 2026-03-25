import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Plus, Trash2, ChevronLeft, Search, Church, UserCog, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApprovedEmail, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

interface AdminPanelProps {
  user: User;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [approvedEmails, setApprovedEmails] = useState<ApprovedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    churchId: '',
    role: 'tutor' as 'admin' | 'tutor' | 'director' | 'pastor'
  });

  useEffect(() => {
    if (!['admin', 'director', 'pastor'].includes(user.role)) return;

    const q = query(collection(db, 'approved_emails'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ApprovedEmail));
      setApprovedEmails(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'approved_emails');
    });

    return () => unsubscribe();
  }, [user.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emailId = formData.email.toLowerCase().trim();
      
      // If editing and email changed, we need to delete the old one and create new
      if (editingId && editingId !== emailId) {
        await deleteDoc(doc(db, 'approved_emails', editingId));
      }

      await setDoc(doc(db, 'approved_emails', emailId), {
        email: emailId,
        name: formData.name,
        churchId: formData.churchId,
        role: formData.role
      });
      
      // Success! Close modal and reset state
      setIsAdding(false);
      setEditingId(null);
      setFormData({ email: '', name: '', churchId: '', role: 'tutor' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'approved_emails');
    }
  };

  const handleEdit = (item: ApprovedEmail) => {
    setFormData({
      email: item.email,
      name: item.name || '',
      churchId: item.churchId,
      role: item.role
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDeleteEmail = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este correo de la lista de autorizados?')) return;
    try {
      await deleteDoc(doc(db, 'approved_emails', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'approved_emails');
    }
  };

  const filteredEmails = approvedEmails.filter(e => 
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.churchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!['admin', 'director', 'pastor'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="p-6 bg-red-50 text-red-500 rounded-full">
          <Shield className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Acceso Denegado</h2>
        <p className="text-gray-500 font-bold">No tienes permisos para acceder a este panel.</p>
        <Link to="/dashboard" className="btn-primary px-8 py-3">Volver al Inicio</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-3 bg-white hover:bg-primary hover:text-white rounded-2xl shadow-md border border-gray-50 transition-all group">
            <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-800 italic tracking-tight uppercase">Panel de Administración</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Gestiona correos autorizados e iglesias</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary px-8 py-4 text-sm"
        >
          <Plus className="w-5 h-5" />
          AUTORIZAR CORREO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 card-rounded shadow-sm border border-gray-50 flex items-center gap-4">
            <Search className="w-6 h-6 text-gray-300" />
            <input 
              type="text"
              placeholder="Buscar por correo o iglesia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-gray-700 placeholder:text-gray-300"
            />
          </div>

          <div className="bg-white card-rounded overflow-hidden shadow-xl shadow-black/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Correo Electrónico</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Iglesia</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Rol</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">Cargando correos...</td>
                    </tr>
                  ) : filteredEmails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">No se encontraron correos autorizados.</td>
                    </tr>
                  ) : (
                    filteredEmails.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-6">
                          <span className="font-black text-gray-800">{item.name}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                              <Mail className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-600">{item.email}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-gray-500 font-bold">
                            <Church className="w-4 h-4" />
                            {item.churchId}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            item.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="p-3 text-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEmail(item.id!)}
                              className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-primary p-10 card-rounded text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <Shield className="w-12 h-12 mb-6 opacity-50" />
              <h3 className="text-2xl font-black italic mb-4 tracking-tight">CONTROL DE ACCESO</h3>
              <p className="text-blue-50 font-bold leading-relaxed">
                Solo los correos en esta lista podrán crear una cuenta. Al registrarse, se les asignará automáticamente su iglesia y rol correspondientes.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>

          <div className="bg-white p-8 card-rounded shadow-lg border border-gray-50">
            <h4 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight flex items-center gap-3">
              <UserCog className="w-6 h-6 text-primary" />
              Resumen del Sistema
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">Total Autorizados</span>
                <span className="text-2xl font-black text-gray-800">{approvedEmails.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">Administradores</span>
                <span className="text-2xl font-black text-purple-600">{approvedEmails.filter(e => e.role === 'admin').length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">Iglesias Únicas</span>
                <span className="text-2xl font-black text-emerald-600">{new Set(approvedEmails.map(e => e.churchId)).size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Email Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg card-rounded shadow-2xl overflow-hidden"
          >
            <div className="bg-primary p-8 text-white">
              <h3 className="text-2xl font-black italic tracking-tight uppercase">
                {editingId ? 'Editar Correo Autorizado' : 'Autorizar Nuevo Correo'}
              </h3>
              <p className="text-blue-100 font-bold text-sm mt-2">
                {editingId ? 'Modifica los permisos del usuario' : 'Define el acceso para un nuevo usuario'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Tutor o Administrador</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-primary focus:ring-0 transition-all"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-primary focus:ring-0 transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la Iglesia</label>
                <input 
                  type="text"
                  required
                  value={formData.churchId}
                  onChange={(e) => setFormData({ ...formData, churchId: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-primary focus:ring-0 transition-all"
                  placeholder="Nombre de la iglesia"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Rol del Usuario</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-primary focus:ring-0 transition-all"
                >
                  <option value="tutor">Tutor (Iglesia)</option>
                  <option value="admin">Administrador (Global)</option>
                  <option value="director">Director</option>
                  <option value="pastor">Pastor</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ email: '', name: '', churchId: '', role: 'tutor' });
                  }}
                  className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white font-black py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-xs"
                >
                  {editingId ? 'GUARDAR CAMBIOS' : 'AUTORIZAR'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
