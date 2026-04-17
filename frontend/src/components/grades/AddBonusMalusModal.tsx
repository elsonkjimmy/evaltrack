import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Award, AlertCircle, Loader2, MessageSquare, Plus, Minus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface AddBonusMalusModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export const AddBonusMalusModal: React.FC<AddBonusMalusModalProps> = ({ isOpen, onClose, studentId, studentName }) => {
  const { currentRoom, user, addBonusMalus } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<'bonus' | 'malus'>('bonus');
  const [value, setValue] = useState('1');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !user) return;
    if (!reason.trim()) {
      setError("A reason is mandatory for any adjustment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalValue = type === 'bonus' ? Number(value) : -Number(value);
      
      await addBonusMalus({
        student_id: studentId,
        room_id: currentRoom.id,
        value: finalValue,
        reason: reason.trim(),
        created_by: user.id
      });

      onClose();
      setReason('');
      setValue('1');
    } catch (err: any) {
      setError(err.message || "Failed to record adjustment.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass-modal relative w-full max-w-md rounded-[2.5rem] p-10 animate-in fade-in zoom-in duration-300 text-white">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-white/55 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className={`p-3 rounded-2xl ${type === 'bonus' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <Award size={32} />
           </div>
           <div>
              <h3 className="font-headline text-2xl font-extrabold text-white leading-tight">Grade Adjustment</h3>
              <p className="text-sm font-medium text-white/65">For {studentName}</p>
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
              onClick={() => setType('bonus')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${type === 'bonus' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
            >
              <Plus size={14} /> Bonus
            </button>
            <button 
              type="button"
              onClick={() => setType('malus')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${type === 'malus' ? 'bg-white text-rose-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
            >
              <Minus size={14} /> Malus
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">Adjustment Value</label>
            <input 
              type="number" 
              required
              step="0.25"
              min="0.25"
              max="20"
              className="px-6 py-4 bg-white/90 rounded-2xl border border-white/15 text-sm text-slate-900 font-mono font-bold focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all"
              value={value}
              onChange={e => setValue(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">Reason / Justification</label>
            <div className="relative">
              <MessageSquare size={18} className="absolute left-6 top-6 text-slate-400" />
              <textarea 
                required
                className="w-full px-6 py-4 pl-14 bg-white/90 rounded-2xl border border-white/15 text-sm text-slate-900 font-medium min-h-[100px] focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                placeholder="e.g. Excellent classroom participation"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`mt-4 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${type === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            Confirm Adjustment
          </button>
        </form>
      </div>
    </div>
    ,
    document.body
  );
};

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
