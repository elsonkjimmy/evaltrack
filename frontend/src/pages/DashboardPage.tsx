import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CreateRoomModal } from '../components/layout/CreateRoomModal';
import { Plus, FolderOpen, Users, Calendar, ArrowRight, LayoutGrid, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, rooms, fetchRooms, globalStats, fetchGlobalStats, setIsCreateRoomModalOpen } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    fetchGlobalStats();
  }, [fetchRooms, fetchGlobalStats]);

  return (
    <>
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-white tracking-tight mb-2">Academic Sanctuary</h2>
          <p className="text-white/70 font-medium">Welcome back, {user?.user_metadata?.full_name || 'Professor'}. You have {rooms.length} active academic spaces.</p>
        </div>
        <button 
          onClick={() => setIsCreateRoomModalOpen(true)}
          className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-[2rem] font-bold flex items-center gap-2 shadow-xl transition-all active:scale-95"
        >
          <Plus size={20} /> New Academic Space
        </button>
      </section>

      {/* Global Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {[
          { title: 'Total Students', value: globalStats.totalStudents, icon: <Users size={20} />, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { title: 'Pending Evals', value: globalStats.pendingEvaluations, icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { title: 'Active Rooms', value: globalStats.activeRooms, icon: <BookOpen size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
             <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                {stat.icon}
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{stat.title}</p>
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Room Grid Header */}
      <div className="flex items-center justify-between mt-12 mb-6 px-4">
         <h3 className="font-headline text-2xl font-bold text-white">Your Academic Spaces</h3>
         <div className="flex gap-2">
            <span className="text-xs font-bold text-white/50 bg-white/10 px-3 py-1 rounded-full">{rooms.length} Rooms Total</span>
         </div>
      </div>

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {rooms.length === 0 ? (
          <div className="lg:col-span-3 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-20 flex flex-col items-center text-center gap-6 border-2 border-dashed border-white/10">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-white/30">
               <FolderOpen size={48} />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-bold text-white">No rooms found</h3>
              <p className="text-white/60 max-w-sm mx-auto mt-2">Start by creating your first academic space to manage students and grades.</p>
            </div>
            <button 
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="mt-4 bg-white text-navy px-8 py-4 rounded-full font-bold shadow-lg hover:bg-slate-100 transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => navigate(`/evaluations/room?room=${room.id}`)}
              className="group bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-lg hover:bg-white/15 transition-all cursor-pointer flex flex-col gap-6 relative overflow-hidden"
            >
              {/* Hover highlight */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-white/10 rounded-2xl text-white/70 group-hover:bg-white group-hover:text-navy transition-colors">
                  <LayoutGrid size={24} />
                </div>
                <div className="flex gap-2">
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                     room.is_locked 
                     ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                     : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                   }`}>
                     {room.is_locked ? 'Locked' : 'Active'}
                   </span>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="font-headline text-2xl font-extrabold text-white group-hover:text-terra-light transition-colors line-clamp-1">{room.name}</h3>
                <p className="text-sm text-white/60 font-medium mt-1 line-clamp-2 min-h-[2.5rem]">{room.description || 'Academic evaluation workspace.'}</p>
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
          ))
        )}
      </section>

      <CreateRoomModal />
    </>
  );
};
