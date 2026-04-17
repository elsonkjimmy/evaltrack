import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { User, Mail, Shield, Save, Loader2, Camera, Bell, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resolveAvatarUrl } from '../lib/avatar';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'notifications'>('info');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Info Form
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarPath, setAvatarPath] = useState(user?.user_metadata?.avatar_url || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Security Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || '');
    setAvatarPath(user?.user_metadata?.avatar_url || '');
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadAvatar = async () => {
      const nextUrl = await resolveAvatarUrl(avatarPath);
      if (!cancelled) {
        setAvatarUrl(nextUrl);
      }
    };

    void loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarPath });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setAvatarPath(filePath);
      await updateProfile({ full_name: fullName, avatar_url: filePath });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-10">
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2">Sanctuary Settings</h2>
        <p className="text-white/65 font-medium">Manage your academic profile and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         <div className="md:col-span-1 flex flex-col gap-4">
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-white/10 flex flex-col items-center text-center">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="relative group cursor-pointer mb-4"
               >
                  <img 
                    key={avatarUrl}
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName}&background=1A1A2E&color=fff&size=128`} 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-xl transition-transform group-hover:scale-105 object-cover" 
                    alt="Avatar" 
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={20} className="text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={uploadAvatar} />
               </div>
               <h3 className="font-bold text-white text-lg line-clamp-1">{fullName}</h3>
               <p className="text-xs text-white/45 font-bold uppercase tracking-widest mt-1">Academic Staff</p>
            </div>

            <nav className="bg-white/10 backdrop-blur-xl p-2 rounded-[2rem] flex flex-col gap-1 border border-white/10">
               <button 
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-4 px-6 py-3 rounded-full text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-white text-navy shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
               >
                  <User size={16} /> Personal Info
               </button>
               <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-4 px-6 py-3 rounded-full text-xs font-bold transition-all ${activeTab === 'security' ? 'bg-white text-navy shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
               >
                  <Shield size={16} /> Security
               </button>
               <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-4 px-6 py-3 rounded-full text-xs font-bold transition-all ${activeTab === 'notifications' ? 'bg-white text-navy shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
               >
                  <Bell size={16} /> Notifications
               </button>
            </nav>
         </div>

         <div className="md:col-span-2 bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/10 flex flex-col gap-8 relative overflow-hidden">
            {success && (
              <div className="absolute top-4 right-10 flex items-center gap-2 text-emerald-200 font-bold text-xs animate-in slide-in-from-top-2">
                 <CheckCircle2 size={14} /> Changes saved successfully
              </div>
            )}

            {activeTab === 'info' && (
              <form onSubmit={handleSaveInfo} className="flex flex-col gap-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Personal Information</h4>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-4">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-14 pr-6 py-4 bg-white/90 rounded-2xl border border-white/15 focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-medium text-sm text-slate-900"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 opacity-60">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-4">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        disabled
                        className="w-full pl-14 pr-6 py-4 bg-white/80 rounded-2xl border border-white/10 font-medium text-sm text-slate-700 cursor-not-allowed"
                        value={user?.email || ''}
                      />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="mt-4 flex items-center justify-center gap-2 bg-terra text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-terra-dark transition-all active:scale-95 disabled:opacity-50">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Save Info
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Security & Password</h4>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-4">New Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full pl-14 pr-12 py-4 bg-white/90 rounded-2xl border border-white/15 focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-medium text-sm text-slate-900"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-4">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full pl-14 pr-12 py-4 bg-white/90 rounded-2xl border border-white/15 focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-medium text-sm text-slate-900"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="mt-4 flex items-center justify-center gap-2 bg-rose-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50">
                   {loading ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />} Update Password
                </button>
              </form>
            )}

            {activeTab === 'notifications' && (
               <div className="flex flex-col gap-6 items-center py-20 text-center">
                  <div className="p-6 bg-white/10 rounded-full text-white/35">
                     <Bell size={48} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Notification Preferences</h4>
                    <p className="text-sm text-white/60 mt-2 max-w-xs">You currently have no active notification channels. Push alerts are coming soon.</p>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
