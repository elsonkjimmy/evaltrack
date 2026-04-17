import React, { useState, useEffect } from 'react';
import { X, Settings2, Loader2, AlertCircle, CheckCircle2, Calculator, Save, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({ isOpen, onClose }) => {
  const { currentRoom, currentEvaluations, updateRoom, updateEvaluation, deleteEvaluation } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academic_year: '',
    cc_coefficient: 1.0,
    tp_coefficient: 2.0,
    pass_threshold: 50.0
  });

  useEffect(() => {
    if (currentRoom && isOpen) {
      setFormData({
        name: currentRoom.name || '',
        description: currentRoom.description || '',
        academic_year: currentRoom.academic_year || '',
        cc_coefficient: currentRoom.cc_coefficient ? Number(currentRoom.cc_coefficient) : 1.0,
        tp_coefficient: currentRoom.tp_coefficient ? Number(currentRoom.tp_coefficient) : 2.0,
        pass_threshold: currentRoom.pass_threshold ? Number(currentRoom.pass_threshold) : 50.0
      });
    }
  }, [currentRoom, isOpen]);

  if (!isOpen || !currentRoom) return null;

  const handleRoomUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateRoom(currentRoom.id, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvalWeightChange = async (evalId: string, newWeight: number) => {
    try {
      await updateEvaluation(evalId, { weight: newWeight });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEvalDelete = async (evalId: string) => {
    if (window.confirm("Are you sure you want to delete this evaluation? All grades for this component will be lost.")) {
      try {
        await deleteEvaluation(evalId);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white/10 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 border border-white/10 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-10">
           <div className="p-4 bg-white/10 rounded-[1.5rem] text-white shadow-xl">
              <Settings2 size={32} />
           </div>
           <div>
              <h3 className="font-headline text-3xl font-extrabold text-white leading-tight tracking-tight">Space Settings</h3>
              <p className="text-sm font-medium text-white/50 uppercase tracking-widest">Configure your academic sanctuary</p>
           </div>
        </div>

        {error && (
          <div className="mb-8 flex items-center gap-3 p-4 bg-rose-500/20 text-rose-200 rounded-2xl text-xs font-bold border border-rose-500/30">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div className="mb-8 flex items-center gap-3 p-4 bg-emerald-500/20 text-emerald-200 rounded-2xl text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 size={18} /> Room configuration saved!
          </div>
        )}

        <div className="flex flex-col gap-12">
          {/* Section 1: General Info */}
          <form onSubmit={handleRoomUpdate} className="flex flex-col gap-8 pb-12 border-b border-white/5">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">Room Name</label>
                    <input 
                      type="text" 
                      required
                      className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-terra/40 focus:bg-white/10 outline-none transition-all text-sm font-bold text-white shadow-inner"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">Academic Year</label>
                    <input 
                      type="text" 
                      required
                      className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-terra/40 focus:bg-white/10 outline-none transition-all text-sm font-bold text-white shadow-inner"
                      value={formData.academic_year}
                      onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-terra ml-4">CC Coefficient</label>
                    <div className="relative">
                       <Calculator size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-terra/40" />
                       <input 
                         type="number" 
                         step="0.1"
                         className="w-full pl-14 pr-6 py-4 bg-terra/10 border border-terra/20 rounded-2xl focus:border-terra outline-none text-sm font-mono font-black text-white"
                         value={formData.cc_coefficient}
                         onChange={e => setFormData({ ...formData, cc_coefficient: parseFloat(e.target.value) })}
                       />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400 ml-4">TP Coefficient</label>
                    <div className="relative">
                       <Calculator size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400/40" />
                       <input 
                         type="number" 
                         step="0.1"
                         className="w-full pl-14 pr-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl focus:border-blue-400 outline-none text-sm font-mono font-black text-white"
                         value={formData.tp_coefficient}
                         onChange={e => setFormData({ ...formData, tp_coefficient: parseFloat(e.target.value) })}
                       />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">Threshold</label>
                    <input 
                      type="number" 
                      className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-white/30 outline-none text-sm font-mono font-black text-white"
                      value={formData.pass_threshold}
                      onChange={e => setFormData({ ...formData, pass_threshold: parseFloat(e.target.value) })}
                    />
                </div>
             </div>

             <button 
               type="submit"
               disabled={loading}
               className="bg-white text-slate-900 py-4 rounded-2xl font-bold shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
             >
               {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
               Save General Settings
             </button>
          </form>

          {/* Section 2: Individual Evaluations Weighting */}
          <div className="flex flex-col gap-8">
             <div className="flex flex-col">
                <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Components Weighting</h4>
                <p className="text-xs text-white/30 mt-1 font-medium italic">Adjust the percentage of each specific evaluation within its category.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* CC List */}
                <div className="flex flex-col gap-4">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-terra flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-terra rounded-full"></div>
                      Contrôle Continu (CC)
                   </h5>
                   <div className="flex flex-col gap-3">
                      {currentEvaluations.filter(e => e.type === 'CC').map(ev => (
                        <div key={ev.id} className="bg-white/5 p-4 px-6 rounded-2xl border border-white/5 flex items-center justify-between group">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-white line-clamp-1">{ev.label}</span>
                              <span className="text-[9px] text-white/30 font-bold uppercase">Weight</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="relative">
                                 <input 
                                   type="number"
                                   className="w-16 bg-white/10 border-none rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-center focus:ring-1 focus:ring-terra"
                                   value={ev.weight}
                                   onChange={(e) => handleEvalWeightChange(ev.id, parseFloat(e.target.value))}
                                 />
                                 <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">%</span>
                              </div>
                              <button onClick={() => handleEvalDelete(ev.id)} className="p-2 text-white/10 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* TP List */}
                <div className="flex flex-col gap-4">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      Travaux Pratiques (TP)
                   </h5>
                   <div className="flex flex-col gap-3">
                      {currentEvaluations.filter(e => e.type === 'TP').map(ev => (
                        <div key={ev.id} className="bg-white/5 p-4 px-6 rounded-2xl border border-white/5 flex items-center justify-between group">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-white line-clamp-1">{ev.label}</span>
                              <span className="text-[9px] text-white/30 font-bold uppercase">Weight</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="relative">
                                 <input 
                                   type="number"
                                   className="w-16 bg-white/10 border-none rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-center focus:ring-1 focus:ring-blue-400"
                                   value={ev.weight}
                                   onChange={(e) => handleEvalWeightChange(ev.id, parseFloat(e.target.value))}
                                 />
                                 <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">%</span>
                              </div>
                              <button onClick={() => handleEvalDelete(ev.id)} className="p-2 text-white/10 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
