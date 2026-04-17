import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { FileSpreadsheet, Download, Clock, Search, FolderArchive } from 'lucide-react';

export const ArchivesPage: React.FC = () => {
  const { rooms } = useAppStore();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2">Academic Archives</h2>
        <p className="text-white/65 font-medium">Access your exported gradebooks and historical data.</p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
           <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
              <input 
                type="text" 
                placeholder="Search archives..." 
                className="w-full pl-12 pr-6 py-3 bg-white/10 border border-white/10 rounded-full text-sm text-white placeholder:text-white/45 focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all"
              />
           </div>
           <div className="flex gap-4">
              <button className="px-6 py-2 bg-white text-navy rounded-full text-xs font-bold shadow-lg">All Files</button>
              <button className="px-6 py-2 bg-white/10 text-white/70 rounded-full text-xs font-bold hover:bg-white/15 transition-all border border-white/10">Excel Only</button>
           </div>
        </div>

        <div className="flex flex-col gap-2">
          {rooms.length === 0 ? (
             <div className="py-20 flex flex-col items-center text-white/35 gap-4">
                <FolderArchive size={64} opacity={0.5} />
                <p className="font-bold text-sm text-white/60">No archives found.</p>
             </div>
          ) : (
            rooms.map((room, i) => (
              <div key={room.id} className="flex items-center justify-between p-4 px-6 hover:bg-white/8 rounded-2xl transition-all group border border-transparent hover:border-white/8">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-emerald-500/15 text-emerald-300 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-white group-hover:text-terra-light transition-colors">Gradebook_{room.name.replace(/\s+/g, '_')}.xlsx</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                         <span className="text-[10px] font-bold text-white/45 uppercase tracking-widest">{room.academic_year}</span>
                         <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                         <span className="text-[10px] font-bold text-white/45 flex items-center gap-1"><Clock size={10} /> {new Date(room.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>
                <button className="p-3 bg-white/10 border border-white/10 rounded-full text-white/55 hover:text-white hover:bg-white/15 transition-all">
                   <Download size={18} />
                </button>
              </div>
            ))
          )}
        </div>
        </div>
        </div>
        );
        };

