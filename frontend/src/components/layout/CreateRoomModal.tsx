import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { X, Loader2, PlusCircle, GraduationCap, AlertCircle } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  
  const { user, fetchRooms, fetchGlobalStats } = useAppStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Check if room already exists (using limit to avoid technical single-row errors)
      const { data: existingRooms, error: checkError } = await supabase
        .from('rooms')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', name.trim())
        .limit(1);

      if (checkError) throw checkError;

      if (existingRooms && existingRooms.length > 0) {
        throw new Error(`Oups ! Vous avez déjà une salle nommée "${name}". Chaque espace doit avoir un nom unique pour éviter les confusions.`);
      }

      const { error: insertError } = await supabase.from('rooms').insert({
        owner_id: user.id,
        name: name.trim(),
        description,
        academic_year: academicYear,
        cc_coefficient: 1.0, 
        tp_coefficient: 2.0,
      });

      if (insertError) throw insertError;
      
      await Promise.all([
        fetchRooms(),
        fetchGlobalStats()
      ]);
      
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="glass-modal rounded-[2.5rem] p-10 w-full max-w-lg relative animate-in fade-in zoom-in duration-300 text-white">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/55 hover:text-white">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-white/10 rounded-2xl text-white">
              <PlusCircle size={32} />
           </div>
           <div>
              <h2 className="font-headline text-2xl font-extrabold text-white leading-tight">New Academic Space</h2>
              <p className="text-sm text-white/65 font-medium">Create a new room for your evaluations.</p>
           </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-500/20 text-rose-100 rounded-2xl text-xs border border-rose-500/30">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-4">Room Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. INF301 - Algorithmics"
              className="bg-white/90 border border-white/15 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-4">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. B.Sc Computer Science - Semester 1"
              className="bg-white/90 border border-white/15 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-4">Academic Year</label>
            <div className="relative">
              <GraduationCap size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-white/90 border border-white/15 rounded-2xl pl-14 pr-6 py-4 text-sm text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-terra hover:bg-terra-dark text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
};
