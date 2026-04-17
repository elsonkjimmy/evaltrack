import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, loading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Global Backdrop - Strong Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Box - Transparent Glass Style */}
      <div className="relative w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 rounded-md p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200 text-white">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-5 mb-8">
           <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 shadow-inner">
              <AlertTriangle size={32} />
           </div>
           <div>
             <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
             <p className="text-white/60 text-sm leading-relaxed px-2">{message}</p>
           </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-sm font-bold bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-sm font-bold bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};