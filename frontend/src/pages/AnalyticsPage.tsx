import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Award, BookOpen } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { rooms, globalStats } = useAppStore();

  const data = rooms.map(r => ({
    name: r.name.split(' ')[0],
    success: Math.floor(Math.random() * 40) + 60, // Dummy until real stats per room
    students: Math.floor(Math.random() * 50) + 20
  }));

  const COLORS = ['#1A1A2E', '#E8623A', '#9a442d', '#4ade80', '#60a5fa'];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2">Global Analytics</h2>
        <p className="text-white/65 font-medium">Comparative performance across all academic spaces.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg Success Rate', value: '74.2%', icon: <TrendingUp size={20} />, color: 'bg-emerald-500/15 text-emerald-300' },
          { label: 'Total Students', value: globalStats.totalStudents, icon: <Users size={20} />, color: 'bg-blue-500/15 text-blue-300' },
          { label: 'Evaluations Run', value: globalStats.pendingEvaluations, icon: <Award size={20} />, color: 'bg-amber-500/15 text-amber-300' },
          { label: 'Active Spaces', value: globalStats.activeRooms, icon: <BookOpen size={20} />, color: 'bg-white/10 text-white/75' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm flex flex-col gap-4 border border-white/10">
             <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                {stat.icon}
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">{stat.label}</p>
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/10 min-h-[400px]">
            <h3 className="font-bold text-lg text-white mb-8">Performance by Space (%)</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#d8dee9'}} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.92)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="success" fill="#f4f7fb" radius={[10, 10, 0, 0]} barSize={40} fillOpacity={0.95} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/10 flex flex-col items-center">
            <h3 className="font-bold text-lg text-white mb-8 self-start">Student Distribution</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="students"
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.92)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
               {data.map((d, i) => (
                 <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                    <span className="text-[10px] font-bold text-white/55 uppercase">{d.name}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
