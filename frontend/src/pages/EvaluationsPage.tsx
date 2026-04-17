import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, ArrowRight, Plus, FolderOpen, Calendar, Users } from 'lucide-react';

export const EvaluationsPage: React.FC = () => {
  const { rooms, setIsCreateRoomModalOpen } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2">Your Academic Spaces</h2>
          <p className="text-white/65 font-medium">Select a room to manage student grades and evaluations.</p>
        </div>
        <button 
          onClick={() => setIsCreateRoomModalOpen(true)}
          className="bg-white text-navy px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:bg-slate-100 transition-all active:scale-95"
        >
          <Plus size={18} /> New Space
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-20 flex flex-col items-center text-center gap-6 border-2 border-dashed border-white/10">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-white/30">
             <FolderOpen size={48} />
          </div>
          <div>
            <h3 className="font-headline text-2xl font-bold text-white">No rooms available</h3>
            <p className="text-white/60 max-w-sm mx-auto mt-2">Create your first academic space to start tracking evaluations.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => navigate(`/evaluations/room?room=${room.id}`)}
              className="group bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-lg hover:bg-white/15 transition-all cursor-pointer flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="flex justify-between items-start relative z-10">
                 <div className="p-3 bg-white/10 rounded-2xl text-white/70 group-hover:bg-white group-hover:text-navy transition-colors">
                    <LayoutGrid size={24} />
                 </div>
                 <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                   room.is_locked
                     ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                     : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                 }`}>
                   {room.is_locked ? 'Locked' : 'Active'}
                 </span>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-headline text-2xl font-extrabold text-white group-hover:text-terra-light transition-colors line-clamp-1">{room.name}</h3>
                <p className="text-sm text-white/60 font-medium mt-1 line-clamp-2 min-h-[2.5rem]">
                  {room.description || 'Academic evaluation workspace.'}
                </p>
              </div>
              
              <div className="flex items-center gap-6 mt-2 pt-6 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-2 text-white/50">
                  <Calendar size={16} />
                  <span className="text-xs font-bold">{room.academic_year}</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Users size={16} />
                  <span className="text-xs font-bold">Coef. CC {room.cc_coefficient}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 relative z-10">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Open Dashboard</span>
                 <div className="p-2 bg-white text-navy rounded-full group-hover:translate-x-2 transition-transform shadow-lg">
                    <ArrowRight size={16} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
