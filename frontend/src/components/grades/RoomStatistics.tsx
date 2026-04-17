import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateStudentGrades, type RoundingRule } from '../../lib/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, CheckCircle } from 'lucide-react';

export const RoomStatistics: React.FC = () => {
  const { 
    currentRoom, 
    currentStudents, 
    currentEvaluations, 
    currentGrades, 
    currentSN, 
    currentBonusMalus 
  } = useAppStore();

  if (!currentRoom || currentStudents.length === 0) return null;

  const ccEvaluations = currentEvaluations.filter(e => e.type === 'CC');
  const tpEvaluations = currentEvaluations.filter(e => e.type === 'TP');

  // Calculate all results
  const results = currentStudents.map(student => {
    const studentGrades = currentGrades.filter(g => g.student_id === student.id);
    const snGrade = currentSN.find(sn => sn.student_id === student.id)?.score ?? null;
    const studentBM = currentBonusMalus.filter(bm => bm.student_id === student.id);

    return calculateStudentGrades({
      ccInputs: ccEvaluations.map(e => ({
        score: studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null,
        weight: Number(e.weight),
        absenceStatus: 'present'
      })),
      tpInputs: tpEvaluations.map(e => ({
        score: studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null,
        weight: Number(e.weight),
        absenceStatus: 'present'
      })),
      sn: snGrade,
      bonusMalusList: studentBM.map(bm => ({ value: Number(bm.value) })),
      ccCoefficient: Number(currentRoom.cc_coefficient),
      tpCoefficient: Number(currentRoom.tp_coefficient),
      passThreshold: Number(currentRoom.pass_threshold),
      roundingRule: (currentRoom.rounding_rule as RoundingRule) || 'tenth'
    });
  });

  const totalGrades = results.map(r => Number(r.finalGrade));
  const avgGrade = totalGrades.reduce((a, b) => a + b, 0) / totalGrades.length;
  const passCount = results.filter(r => r.isPassing).length;
  const passRate = (passCount / results.length) * 100;

  // Distribution data
  const distribution = [
    { range: '0-20', count: 0, color: '#f43f5e' },
    { range: '20-40', count: 0, color: '#fb923c' },
    { range: '40-50', count: 0, color: '#facc15' },
    { range: '50-60', count: 0, color: '#94a3b8' },
    { range: '60-80', count: 0, color: '#4ade80' },
    { range: '80-100', count: 0, color: '#10b981' },
  ];

  totalGrades.forEach(grade => {
    if (grade < 20) distribution[0].count++;
    else if (grade < 40) distribution[1].count++;
    else if (grade < 50) distribution[2].count++;
    else if (grade < 60) distribution[3].count++;
    else if (grade < 80) distribution[4].count++;
    else distribution[5].count++;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      {/* Stats Cards */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-500/20 text-blue-300 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <TrendingUp size={24} />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Class Average</p>
              <p className="text-2xl font-extrabold text-white">{avgGrade.toFixed(2)} <span className="text-xs text-white/20">/ 100</span></p>
           </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <CheckCircle size={24} />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Success Rate</p>
              <p className="text-2xl font-extrabold text-white">{passRate.toFixed(1)}%</p>
           </div>
        </div>
      </div>

      {/* Chart */}
      <div className="lg:col-span-3 bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-4">
         <div className="flex justify-between items-center px-2">
            <h4 className="font-headline text-lg font-bold text-white tracking-tight leading-none">Grade Distribution</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Class performance analysis</span>
         </div>
         
         <div className="h-40 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="range" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.4)' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
