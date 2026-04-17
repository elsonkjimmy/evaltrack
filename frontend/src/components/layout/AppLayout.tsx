import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { School, LayoutDashboard, BarChart2, PieChart, FolderArchive, Settings, Search, Bell, Moon, HelpCircle, LogOut, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { CreateRoomModal } from './CreateRoomModal';
import { resolveAvatarUrl } from '../../lib/avatar';

export const AppLayout: React.FC = () => {
  const { user, signOut, isCreateRoomModalOpen, setIsCreateRoomModalOpen, toggleTheme, sidebarOpen, toggleSidebar } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);
  const location = useLocation();
  const currentPath = location.pathname;

  const fullName = user?.user_metadata?.full_name || 'Professor';
  const avatarPath = user?.user_metadata?.avatar_url;

  useEffect(() => {
    let cancelled = false;

    const loadAvatar = async () => {
      const nextUrl = await resolveAvatarUrl(avatarPath);
      if (!cancelled) {
        setResolvedAvatarUrl(nextUrl);
      }
    };

    void loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = currentPath === to || (to !== '/' && currentPath.startsWith(to));
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-4 p-4 font-sans tracking-tight rounded-2xl transition-all duration-300 ${
          isActive 
            ? 'bg-terra text-white shadow-lg shadow-terra/20' 
            : 'text-white/60 hover:text-white hover:bg-white/10 font-bold'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-white/40'} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex w-full min-h-screen transition-colors duration-500">
      <CreateRoomModal isOpen={isCreateRoomModalOpen} onClose={() => setIsCreateRoomModalOpen(false)} />
      
      {/* Sidebar Shell - Original Rounded Design */}
      <aside className={`fixed left-0 top-0 m-8 w-72 h-[calc(100vh-4rem)] flex flex-col p-6 bg-navy rounded-[2.5rem] z-50 border border-white/5 shadow-2xl transition-all duration-500 ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4 mb-10">
          <div className="w-10 h-10 rounded-xl bg-terra flex items-center justify-center text-white shadow-xl shadow-terra/20">
             <School size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold tracking-tight text-2xl text-white leading-none">EvalTrack</h1>
            <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-terra-light font-bold mt-1">Academic Hub</p>
          </div>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/evaluations" icon={BarChart2} label="Evaluations" />
          <NavItem to="/analytics" icon={PieChart} label="Analytics" />
          <NavItem to="/archives" icon={FolderArchive} label="Archives" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button 
            onClick={() => setIsCreateRoomModalOpen(true)}
            className="w-full bg-primary text-white py-4 px-6 rounded-full font-headline font-bold shadow-lg shadow-primary/20 hover:bg-surface-tint transition-all duration-300 mb-6"
          >
            New Evaluation
          </button>
          
          <div className="flex flex-col gap-1">
             <Link to="/support" className="text-white/45 hover:text-white flex items-center gap-4 px-4 py-2 text-sm font-medium transition-colors">
               <HelpCircle size={18} />
               <span>Support</span>
             </Link>
             <button 
               onClick={signOut}
               className="text-white/45 hover:text-rose-300 flex items-center gap-4 px-4 py-2 text-sm font-medium transition-colors"
             >
               <LogOut size={18} />
               <span>Logout</span>
             </button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ${sidebarOpen ? 'ml-[320px]' : 'ml-0'}`}>
        {/* Top Navigation - Original Rounded Design */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-8 h-20 bg-[linear-gradient(135deg,rgba(248,247,244,0.88),rgba(244,160,122,0.26))] backdrop-blur-xl shadow-[0_16px_40px_rgba(26,26,46,0.14)] border border-white/35 mt-6 mr-8 ml-8 rounded-2xl transition-all duration-300">
           <div className="flex items-center gap-6 flex-1">
             <button 
                onClick={toggleSidebar}
                className="p-3 bg-white/45 hover:bg-white/70 text-navy rounded-2xl transition-all shadow-sm border border-white/40"
             >
                <Menu size={20} />
             </button>

             <div className="relative group flex items-center bg-white/40 rounded-xl px-4 py-2 w-72 focus-within:ring-2 focus-within:ring-terra/20 focus-within:bg-white/75 transition-all border border-white/35 focus-within:border-terra/30">
                <Search size={18} className="text-terra/55 group-focus-within:text-terra transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search students, evaluations..." 
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-medium w-full placeholder:text-navy/35 pl-3 text-navy" 
                />
             </div>
             
             <nav className="hidden lg:flex gap-8 font-sans text-sm font-bold">
                <Link to="/" className={`pb-1 transition-colors ${currentPath === '/' ? 'text-terra border-b-2 border-terra' : 'text-navy/55 hover:text-navy'}`}>Overview</Link>
                <Link to="/evaluations" className={`pb-1 transition-colors ${currentPath.includes('/evaluations') ? 'text-terra border-b-2 border-terra' : 'text-navy/55 hover:text-navy'}`}>Analytics</Link>
             </nav>
           </div>
           
           <div className="flex items-center gap-4 relative">
              <div className="flex items-center gap-2 pr-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors relative border border-white/30 ${showNotifications ? 'bg-terra text-white' : 'text-navy/60 hover:bg-white/70 hover:text-terra'}`}
                  >
                     <Bell size={20} />
                     {!showNotifications && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-terra rounded-full border-2 border-white"></span>}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute top-14 right-0 w-80 bg-white/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/20 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                       <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                          <h4 className="font-bold text-slate-900">Notifications</h4>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className="text-[10px] font-bold text-terra uppercase hover:underline"
                          >
                            Clear All
                          </button>
                       </div>
                       <div className="flex flex-col items-center py-10 text-center gap-4">
                          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                             <Bell size={28} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">All caught up!</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">No new academic alerts or system updates for now.</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-navy/60 hover:bg-white/70 hover:text-terra transition-colors border border-white/30"
                >
                   <Moon size={20} />
                </button>
              </div>

              <div className="h-8 w-[1px] bg-navy/10 mx-1"></div>
              
              <div className="flex items-center gap-3 pl-2">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-navy leading-none mb-1">{fullName}</p>
                    <p className="text-xs font-medium text-navy/45 lowercase tracking-normal leading-none">
                      {user?.email}
                    </p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-md border-2 border-white overflow-hidden">
                    <img 
                      src={resolvedAvatarUrl || `https://ui-avatars.com/api/?name=${fullName}&background=1A1A2E&color=fff`}
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                 </div>
              </div>
           </div>
        </header>

        {/* Main Content Render Area */}
        <main className="p-8 pb-32 flex flex-col gap-8">
           <Outlet />
        </main>
      </div>
    </div>
  );
};
