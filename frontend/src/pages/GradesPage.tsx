import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Lock, CheckCircle2, Plus, UserPlus, ArrowLeft, Loader2, Search, Users as UsersIcon, FolderOpen, Share2 } from 'lucide-react';
import { GradeGrid } from '../components/grades/GradeGrid';
import { AddStudentModal } from '../components/students/AddStudentModal';
import { AddEvaluationModal } from '../components/grades/AddEvaluationModal';
import { RoomStatistics } from '../components/grades/RoomStatistics';
import { RoomMembersModal } from '../components/layout/RoomMembersModal';
import { EditRoomModal } from '../components/layout/EditRoomModal';
import { useAppStore } from '../store/useAppStore';
import { exportRoomToExcel } from '../lib/exportUtils';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export const GradesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const navigate = useNavigate();
  
  const { 
    currentRoom, 
    fetchRoomData, 
    currentStudents, 
    currentEvaluations,
    currentGrades,
    currentSN,
    currentBonusMalus,
    toggleRoomLock,
    searchQuery,
    setSearchQuery
  } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);

  const handleExport = () => {
    if (!currentRoom) return;
    try {
      exportRoomToExcel(
        currentRoom,
        currentStudents,
        currentEvaluations,
        currentGrades,
        currentSN,
        currentBonusMalus
      );
      toast.success("Excel report exported successfully");
    } catch (err) {
      toast.error("Failed to export Excel report");
    }
  };

  const handleToggleLock = async () => {
    if (!currentRoom) return;
    try {
      const newStatus = !currentRoom.is_locked;
      await toggleRoomLock(currentRoom.id, newStatus);
      toast.success(newStatus ? "Grades locked successfully" : "Grades unlocked successfully");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSharePortal = () => {
    if (!currentRoom) return;
    const url = `${window.location.origin}/portal/${currentRoom.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Student portal link copied to clipboard!");
  };

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchRoomData(roomId);
      setLoading(false);
    };

    loadData();
  }, [roomId, fetchRoomData, navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-white" size={48} />
        <p className="text-white/70 font-medium">Curating your intellectual sanctuary...</p>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-white">Room not found</h2>
        <button onClick={() => navigate('/')} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AddStudentModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} />
      <AddEvaluationModal isOpen={isEvalModalOpen} onClose={() => setIsEvalModalOpen(false)} />
      <RoomMembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} />
      <EditRoomModal isOpen={isEditRoomModalOpen} onClose={() => setIsEditRoomModalOpen(false)} />
      
      {/* TopBar de la salle - Transparent */}
      <div className="bg-white/10 backdrop-blur-xl rounded-sm p-8 border border-white/10 shadow-2xl flex justify-between items-center z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-all border border-white/5">
             <ArrowLeft size={20} />
          </button>
          <div>
             <div className="flex items-center gap-4 mb-2">
               <h2 className="font-headline text-4xl font-extrabold text-white tracking-tight leading-none">{currentRoom.name}</h2>
               <button 
                 onClick={() => setIsEditRoomModalOpen(true)}
                 className="p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl transition-all border border-white/5 shadow-sm"
                 title="Room Settings"
               >
                 <Settings2 size={18} />
               </button>
             </div>
             <div className="flex items-center gap-3">
               {currentRoom.is_locked ? (
                 <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 font-sans text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   <Lock size={12} /> Locked
                 </span>
               ) : (
                 <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   <CheckCircle2 size={12} /> Active
                 </span>
               )}
               <span className="text-white/20">•</span>
               <p className="text-sm font-sans text-white/50 font-medium">{currentRoom.academic_year} • {currentRoom.description || 'Evaluation workspace'}</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSharePortal}
            className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-navy border border-white/10 px-6 py-3 rounded-full font-sans text-xs font-bold transition-all shadow-lg"
            title="Copy portal link for students"
          >
            <Share2 size={14} /> Share
          </button>
          <button 
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-navy border border-white/10 px-6 py-3 rounded-full font-sans text-xs font-bold transition-all shadow-lg"
          >
            <UserPlus size={14} /> Add Student
          </button>
          <button 
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-navy border border-white/10 px-6 py-3 rounded-full font-sans text-xs font-bold transition-all shadow-lg"
          >
            <UsersIcon size={14} /> Invite
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-navy px-6 py-3 rounded-full font-sans text-xs font-bold transition-all shadow-lg hover:bg-slate-100"
          >
            <Download size={14} /> Export Results
          </button>
          <button 
            onClick={handleToggleLock}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-sans text-xs font-bold transition-all shadow-lg ${
              currentRoom.is_locked 
              ? 'bg-terra text-white hover:bg-terra-dark shadow-terra' 
              : 'bg-white/10 hover:bg-white text-white hover:text-navy border border-white/10'
            }`}
          >
            <Lock size={14} /> {currentRoom.is_locked ? 'Unlock Room' : 'Lock Room'}
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <RoomStatistics />

      {/* Grade Grid Container - Transparent */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-sm shadow-2xl border border-white/10 overflow-hidden flex flex-col min-h-[60vh]">
         {/* Configuration Header */}
         <div className="bg-white/5 border-b border-white/10 p-6 px-8 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <span className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Evaluations Setup</span>
              
              <div className="h-4 w-[1px] bg-white/10"></div>
              
              <div className="flex gap-3 items-center text-xs font-bold">
                 <span className="bg-terra/20 text-terra-light border border-terra/30 px-3 py-1 rounded-lg">CC (Coef {currentRoom.cc_coefficient})</span>
                 <span className="text-white/20 text-lg font-light">+</span>
                 <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-lg">TP (Coef {currentRoom.tp_coefficient})</span>
                 <span className="text-white/20 text-lg font-light">+</span>
                 <span className="bg-white/10 text-white/70 border border-white/10 px-3 py-1 rounded-lg">SN</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="relative group">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-terra transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border-none rounded-full pl-10 pr-6 py-2 text-xs focus:ring-2 focus:ring-terra/20 focus:bg-white/20 transition-all w-64 font-medium text-white placeholder:text-white/30"
                  />
               </div>
               
               <button 
                  onClick={() => setIsEvalModalOpen(true)}
                  className="flex items-center gap-2 text-terra-light font-sans text-xs font-bold hover:text-white transition-colors"
               >
                  <Plus size={16} /> Add Evaluation
               </button>
            </div>
         </div>
         
         <div className="flex-1 p-0 flex flex-col">
            {currentStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 gap-6">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                    <FolderOpen size={40} />
                 </div>
                 <div className="text-center">
                    <p className="text-white text-lg font-bold">This academic space is empty</p>
                    <p className="text-white/40 text-sm mt-1 max-w-xs">Start by adding your first student to begin tracking evaluations.</p>
                 </div>
                 <button 
                    onClick={() => setIsStudentModalOpen(true)}
                    className="flex items-center gap-2 bg-white text-navy px-8 py-3 rounded-full text-xs font-bold shadow-lg hover:bg-slate-100 transition-all"
                 >
                    <Plus size={16} /> Add First Student
                 </button>
              </div>
            ) : (
              <GradeGrid />
            )}
         </div>
      </div>
    </div>
  );
};
