import React, { useState, useEffect } from 'react';
import { X, UserRound, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, student }) => {
  const { updateStudent } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    matricule: '',
    lastName: '',
    firstName: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        matricule: student.matricule,
        lastName: student.last_name,
        firstName: student.first_name
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateStudent(student.id, {
        matricule: formData.matricule,
        last_name: formData.lastName,
        first_name: formData.firstName
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-navy border border-white/10 relative w-full max-w-md rounded-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200 text-white">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white"><X size={20} /></button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-white/5 rounded-lg text-terra-light"><UserRound size={24} /></div>
           <h3 className="text-xl font-bold">Edit Student</h3>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-500/10 text-rose-300 rounded-lg text-sm border border-rose-500/20">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Matricule</label>
            <input 
              type="text" required
              className="px-4 py-3 bg-white/5 rounded border border-white/10 text-white focus:border-terra focus:ring-1 focus:ring-terra outline-none transition-all font-mono"
              value={formData.matricule}
              onChange={e => setFormData({ ...formData, matricule: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Last Name</label>
            <input 
              type="text" required
              className="px-4 py-3 bg-white/5 rounded border border-white/10 text-white focus:border-terra focus:ring-1 focus:ring-terra outline-none transition-all"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">First Name</label>
            <input 
              type="text" required
              className="px-4 py-3 bg-white/5 rounded border border-white/10 text-white focus:border-terra focus:ring-1 focus:ring-terra outline-none transition-all"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="mt-2 w-full bg-terra text-white py-4 rounded font-bold hover:bg-terra-dark transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};