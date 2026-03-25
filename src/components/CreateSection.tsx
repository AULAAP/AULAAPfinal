import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, X, Plus, Layers, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateSection() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Club',
    description: '',
    schedule: '',
    capacity: '20'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to a database
    console.log('Saving section:', formData);
    alert('Clase creada exitosamente (Simulación)');
    navigate('/sections');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-outfit">Crear Nueva Clase</h1>
          <p className="text-gray-500 font-outfit">Configure un nuevo grupo de trabajo para sus alumnos</p>
        </div>
        <button 
          onClick={() => navigate('/sections')}
          className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-600"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-[3rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden"
      >
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 gap-8">
            {/* Section Name */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 ml-1 font-outfit">Nombre de la Clase</label>
              <div className="relative">
                <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder="Ej: Club de Lectura, Nivel Inicial A"
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-primary transition-all font-outfit text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Type and Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1 font-outfit">Tipo</label>
                <select
                  className="w-full px-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-primary transition-all appearance-none font-outfit text-lg"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Club">Club</option>
                  <option value="Nivel">Nivel</option>
                  <option value="Grupo">Grupo</option>
                  <option value="Taller">Taller</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1 font-outfit">Capacidad Máxima</label>
                <input
                  type="number"
                  className="w-full px-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-primary transition-all font-outfit text-lg"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 ml-1 font-outfit">Descripción (Opcional)</label>
              <textarea
                rows={3}
                placeholder="Detalles sobre los objetivos o requisitos de esta clase..."
                className="w-full px-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-primary transition-all resize-none font-outfit text-lg"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 ml-1 font-outfit">Horario</label>
              <input
                type="text"
                placeholder="Ej: Lunes y Miércoles, 2:00 PM - 4:00 PM"
                className="w-full px-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-primary transition-all font-outfit text-lg"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="p-10 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-gray-400 text-sm font-outfit">
            <Info className="w-5 h-5" />
            <span>Todos los campos marcados son obligatorios</span>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/sections')}
              className="flex-1 sm:flex-none px-8 py-4 text-gray-600 font-bold hover:bg-gray-200 rounded-[1.5rem] transition-all font-outfit"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-10 py-4 rounded-[1.5rem] font-bold hover:opacity-90 shadow-xl shadow-primary/20 transition-all font-outfit"
            >
              <Save className="w-6 h-6" />
              Guardar Clase
            </button>
          </div>
        </div>
      </motion.form>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 font-outfit">
            <Plus className="w-5 h-5" />
            Tip: Nombres Claros
          </h4>
          <p className="text-blue-600 font-outfit leading-relaxed">
            Use nombres descriptivos que ayuden a otros tutores a identificar rápidamente el propósito del grupo.
          </p>
        </div>
        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
          <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2 font-outfit">
            <Layers className="w-5 h-5" />
            Tip: Tipos de Clase
          </h4>
          <p className="text-amber-600 font-outfit leading-relaxed">
            Los 'Clubes' suelen ser extracurriculares, mientras que los 'Niveles' se refieren al grado académico.
          </p>
        </div>
      </div>
    </div>
  );
}
