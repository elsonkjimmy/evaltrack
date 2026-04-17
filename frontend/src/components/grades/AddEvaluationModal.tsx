import React, { useState } from 'react';
import { X, PlusCircle, Loader2, AlertCircle, Percent } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface AddEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEvaluationModal: React.FC<AddEvaluationModalProps> = ({ isOpen, onClose }) => {
  const { currentRoom, currentEvaluations, addEvaluation } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<'CC' | 'TP'>('CC');
  const [label, setLabel] = useState('');
  const [weight, setWeight] = useState('50');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;

    setLoading(true);
    setError(null);

    try {
      // Check total weight for the type
      const sameTypeEvals = currentEvaluations.filter(e => e.type === type);
      const currentTotalWeight = sameTypeEvals.reduce((acc, ev) => acc + Number(ev.weight), 0);
      
      if (currentTotalWeight + Number(weight) > 100) {
        throw new Error(`Total weight for ${type} cannot exceed 100%. Current: ${currentTotalWeight}%`);
      }

      await addEvaluation({
        room_id: currentRoom.id,
        type,
        label,
        weight: Number(weight),
        position: sameTypeEvals.length
      });

      onClose();
      setLabel('');
      setWeight('50');
    } catch (err: any) {
      setError(err.message || "Failed to add evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass-modal relative w-full max-w-md rounded-[2.5rem] p-10 animate-in fade-in zoom-in duration-300 text-white">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-white/55 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-white/10 rounded-2xl text-white">
              <PlusCircle size={32} />
           </div>
           <div>
              <h3 className="font-headline text-2xl font-extrabold text-white leading-tight">Add Evaluation</h3>
              <p className="text-sm font-medium text-white/65">Define a new CC or TP component.</p>
           </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-500/15 text-rose-100 rounded-2xl text-sm border border-rose-300/15">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10">
            <button 
              type="button"
              onClick={() => setType('CC')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${type === 'CC' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'}`}
            >
              CC (Contrôle Continu)
            </button>
            <button 
              type="button"
              onClick={() => setType('TP')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${type === 'TP' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'}`}
            >
              TP (Travaux Pratiques)
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">Label / Name</label>
            <input 
              type="text" 
              required
              className="px-6 py-4 bg-white/90 rounded-2xl border border-white/15 text-sm text-slate-900 font-medium focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all"
              placeholder={type === 'CC' ? "e.g. Midterm Exam" : "e.g. Lab Project 1"}
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">Weight (%)</label>
            <div className="relative">
              <Percent size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number" 
                required
                min="1"
                max="100"
              className="w-full px-6 py-4 pl-14 bg-white/90 rounded-2xl border border-white/15 text-sm text-slate-900 font-mono font-bold focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-terra text-white py-5 rounded-[2rem] font-bold hover:bg-terra-dark shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
            Create Evaluation
          </button>
        </form>
      </div>
    </div>
  );
};
