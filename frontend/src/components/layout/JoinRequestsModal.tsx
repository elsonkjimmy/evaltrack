import React, { useState } from 'react';
import { X, UserPlus, Check, Trash2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

interface JoinRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({ isOpen, onClose }) => {
  const { joinRequests, approveJoinRequest, rejectJoinRequest } = useAppStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApprove = async (request: any) => {
    setProcessingId(request.id);
    try {
      await approveJoinRequest(request);
      toast.success(`${request.first_name} added to the room`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    setProcessingId(requestId);
    try {
      await rejectJoinRequest(requestId);
      toast.info("Request rejected");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white/10 backdrop-blur-3xl w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 border border-white/10 animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-terra/20 text-terra rounded-2xl">
              <UserPlus size={24} />
           </div>
           <div>
              <h3 className="font-headline text-xl font-bold text-white">Join Requests</h3>
              <p className="text-xs text-white/50 uppercase tracking-widest font-medium">Manage pending student enrollments</p>
           </div>
        </div>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-mini">
           {joinRequests.length === 0 ? (
             <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                   <Clock size={24} />
                </div>
                <p className="text-sm text-white/30 font-medium">No pending requests at the moment.</p>
             </div>
           ) : (
             joinRequests.map(request => (
               <div key={request.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase">{request.last_name}</span>
                        <span className="text-sm text-white/70">{request.first_name}</span>
                     </div>
                     <span className="text-[10px] font-mono text-terra font-bold tracking-wider">MATRICULE: {request.matricule}</span>
                  </div>

                  <div className="flex items-center gap-2">
                     <button 
                       disabled={!!processingId}
                       onClick={() => handleApprove(request)}
                       className="p-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                       title="Approve & Add Student"
                     >
                       {processingId === request.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                     </button>
                     <button 
                       disabled={!!processingId}
                       onClick={() => handleReject(request.id)}
                       className="p-2.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                       title="Reject Request"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
           <p className="text-[10px] text-white/30 text-center italic">Approving a request will automatically create the student in this room.</p>
        </div>
      </div>
    </div>
  );
};