import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Loader2, AlertCircle, Trash2, Check, Mail } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export const RoomMembersModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentRoom, currentMembers, fetchMembers, addMember, user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    can_add_students: true,
    can_edit_notes: true,
    can_view_stats: true,
    can_view_exports: false
  });

  useEffect(() => {
    if (isOpen && currentRoom) {
      fetchMembers(currentRoom.id);
    }
  }, [isOpen, currentRoom, fetchMembers]);

  if (!isOpen || !currentRoom) return null;

  const isOwner = user?.id === currentRoom.owner_id;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addMember(currentRoom.id, email, permissions);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('room_members').delete().eq('id', memberId);
    if (!error) fetchMembers(currentRoom.id);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass-modal relative w-full max-w-2xl rounded-[2.5rem] p-10 overflow-hidden animate-in fade-in zoom-in duration-300 text-white">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-white/55 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-white/10 rounded-2xl text-white">
              <Shield size={32} />
           </div>
           <div>
              <h3 className="font-headline text-2xl font-extrabold text-white leading-tight">Collaborators & Roles</h3>
              <p className="text-sm font-medium text-white/65">Manage who can access and edit this sanctuary.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {/* Invite Section */}
           {isOwner && (
             <div className="flex flex-col gap-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Invite New Delegate</h4>
                
                {error && (
                  <div className="flex items-center gap-3 p-3 bg-rose-500/15 text-rose-100 rounded-xl text-[10px] font-bold border border-rose-300/15">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                   <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="colleague@university.edu"
                        className="w-full pl-11 pr-4 py-3 bg-white/90 rounded-xl border border-white/15 text-sm text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                   </div>

                   <div className="bg-white/8 rounded-2xl p-4 flex flex-col gap-3 border border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Permissions</p>
                      {Object.keys(permissions).map((key) => (
                        <label key={key} className="flex items-center justify-between cursor-pointer group">
                           <span className="text-xs font-medium text-white/75 group-hover:text-white transition-colors">
                             {key.replace(/_/g, ' ').replace('can ', '')}
                           </span>
                           <input 
                             type="checkbox" 
                             checked={(permissions as any)[key]}
                             onChange={e => setPermissions({...permissions, [key]: e.target.checked})}
                             className="w-4 h-4 rounded text-surface-tint focus:ring-surface-tint"
                           />
                        </label>
                      ))}
                   </div>

                   <button 
                     type="submit"
                     disabled={loading}
                     className="bg-terra text-white py-3 rounded-xl font-bold text-sm hover:bg-terra-dark transition-all flex items-center justify-center gap-2"
                   >
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                     Send Invitation
                   </button>
                </form>
             </div>
           )}

           {/* Members List */}
           <div className="flex flex-col gap-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Current Members ({currentMembers.length + 1})</h4>
              
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                 {/* Owner */}
                 <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                       <img src={`https://ui-avatars.com/api/?name=Owner&background=random`} className="w-8 h-8 rounded-full" alt="Owner" />
                       <div>
                          <p className="text-xs font-bold text-white">Room Owner</p>
                          <p className="text-[10px] text-white/55">Full Control</p>
                       </div>
                    </div>
                    <span className="bg-white/15 text-white/80 p-1 px-2 rounded-lg text-[8px] font-bold uppercase">Admin</span>
                 </div>

                 {/* Delegates */}
                 {currentMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10 shadow-sm group">
                       <div className="flex items-center gap-3">
                          <img 
                            src={member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${member.profiles?.full_name}&background=random`} 
                            className="w-8 h-8 rounded-full" 
                            alt="Avatar" 
                          />
                          <div>
                             <p className="text-xs font-bold text-white line-clamp-1">{member.profiles?.full_name}</p>
                             <p className="text-[10px] text-white/55 line-clamp-1">{member.profiles?.email}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <div className="hidden group-hover:flex gap-1">
                             {member.can_edit_notes && <Check size={12} className="text-emerald-500" />}
                          </div>
                          {isOwner && (
                            <button 
                              onClick={() => removeMember(member.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                               <Trash2 size={14} />
                            </button>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
