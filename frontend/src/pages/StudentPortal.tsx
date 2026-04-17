import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateStudentGrades, type RoundingRule } from '../lib/calculations';
import { Search, Loader2, Award, BookOpen, GraduationCap, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { roomId } = useParams();
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);

  // Fetch Room Info on Load
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (!error) setRoom(data);
    };
    fetchRoom();
  }, [roomId]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule.trim() || !roomId) return;

    setLoading(true);
    setError(null);
    setStudentData(null);

    try {
      // 1. Find Student by Matricule in this Room
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('room_id', roomId)
        .eq('matricule', matricule.trim())
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) {
        throw new Error("Student not found. Please check your matricule.");
      }

      // 2. Fetch Grades and Evaluations
      const [evalsRes, gradesRes, snRes, bmRes] = await Promise.all([
        supabase.from('evaluations').select('*').eq('room_id', roomId).order('position'),
        supabase.from('grades').select('*').eq('student_id', student.id),
        supabase.from('session_normale').select('*').eq('student_id', student.id).eq('room_id', roomId).maybeSingle(),
        supabase.from('bonus_malus').select('*').eq('student_id', student.id).eq('room_id', roomId)
      ]);

      const result = calculateStudentGrades({
        ccInputs: (evalsRes.data || []).filter(e => e.type === 'CC').map(e => ({
          score: gradesRes.data?.find(g => g.evaluation_id === e.id)?.score ?? null,
          weight: Number(e.weight),
          absenceStatus: 'present'
        })),
        tpInputs: (evalsRes.data || []).filter(e => e.type === 'TP').map(e => ({
          score: gradesRes.data?.find(g => g.evaluation_id === e.id)?.score ?? null,
          weight: Number(e.weight),
          absenceStatus: 'present'
        })),
        sn: snRes.data?.score ?? null,
        bonusMalusList: (bmRes.data || []).map(bm => ({ value: Number(bm.value) })),
        ccCoefficient: Number(room.cc_coefficient),
        tpCoefficient: Number(room.tp_coefficient),
        passThreshold: Number(room.pass_threshold),
        roundingRule: (room.rounding_rule as RoundingRule) || 'tenth'
      });

      setStudentData({
        student,
        evaluations: evalsRes.data || [],
        grades: gradesRes.data || [],
        sn: snRes.data?.score ?? null,
        bonusMalus: bmRes.data || [],
        result
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
         <Loader2 className="animate-spin text-white/20" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex flex-col items-center p-6 sm:p-12 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-rose-500/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

      <div className="w-full max-w-4xl z-10 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
           <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-white backdrop-blur-xl border border-white/10 shadow-2xl">
              <GraduationCap size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-headline font-extrabold text-white tracking-tight leading-none mb-2">Student Portal</h1>
              <p className="text-white/50 font-medium">{room.name} • {room.academic_year}</p>
           </div>
        </div>

        {/* Search Card */}
        {!studentData ? (
          <div className="bg-white/10 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <form onSubmit={handleLookup} className="flex flex-col gap-8">
                <div className="text-center">
                   <h2 className="text-white font-bold text-lg mb-1">Check your results</h2>
                   <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Enter your matricule below</p>
                </div>

                {error && (
                   <div className="bg-rose-500/20 text-rose-300 p-4 rounded-2xl text-xs font-bold border border-rose-500/30 flex items-center gap-3">
                      <AlertCircle size={16} /> {error}
                   </div>
                )}

                <div className="relative group">
                   <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
                   <input 
                     type="text" 
                     placeholder="e.g. 23001"
                     className="w-full bg-white/5 border-2 border-white/10 rounded-full pl-16 pr-6 py-5 text-white font-mono text-lg focus:border-white/30 focus:bg-white/10 outline-none transition-all placeholder:text-white/10"
                     value={matricule}
                     onChange={e => setMatricule(e.target.value)}
                   />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-white text-slate-900 py-5 rounded-full font-extrabold shadow-xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <BookOpen size={24} />}
                  View My Grades
                </button>
             </form>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
             {/* Back Button */}
             <button onClick={() => setStudentData(null)} className="flex items-center gap-2 text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors self-start ml-4">
                <ArrowLeft size={16} /> Back to Search
             </button>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 bg-white/10 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
                   <div className="w-24 h-24 bg-gradient-to-br from-terra to-terra-dark rounded-full flex items-center justify-center text-white text-3xl font-extrabold mb-6 shadow-terra">
                      {studentData.student.first_name[0]}{studentData.student.last_name[0]}
                   </div>
                   <h2 className="text-2xl font-bold text-white leading-tight">{studentData.student.first_name} {studentData.student.last_name}</h2>
                   <p className="text-white/40 font-mono mt-1 uppercase tracking-widest text-xs">Matricule: {studentData.student.matricule}</p>
                   
                   <div className="mt-8 pt-8 border-t border-white/5 w-full flex flex-col gap-4">
                      <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Final Grade</span>
                         <span className={`text-3xl font-black ${studentData.result.isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {studentData.result.finalGrade}<span className="text-xs opacity-30 ml-1">/ 100</span>
                         </span>
                      </div>
                      <div className={`py-3 rounded-2xl font-bold text-sm shadow-inner ${studentData.result.isPassing ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                         {studentData.result.isPassing ? 'SUCCESSFUL' : 'ACADEMIC REVIEW REQUIRED'}
                      </div>
                   </div>
                </div>

                {/* Grades Detail */}
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col gap-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Evaluation Breakdown</h3>
                      <div className="flex gap-2">
                         <span className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/5">Official Report</span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4">
                      {/* CC Component */}
                      <div className="bg-white/5 p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:bg-white/[0.08] transition-colors">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 size={14} /> Contrôle Continu (CC)
                            </h4>
                            <span className="text-lg font-bold text-white">{studentData.result.ccFinal}<span className="text-[10px] opacity-30 ml-1">/ 20</span></span>
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {studentData.evaluations.filter((e: any) => e.type === 'CC').map((e: any) => (
                               <div key={e.id} className="flex flex-col gap-1">
                                  <span className="text-[9px] font-bold text-white/20 uppercase truncate">{e.label}</span>
                                  <span className="text-sm font-bold text-white/80">{studentData.grades.find((g: any) => g.evaluation_id === e.id)?.score ?? '-'}<span className="text-[9px] opacity-20 ml-0.5">/ 20</span></span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* TP Component */}
                      <div className="bg-white/5 p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:bg-white/[0.08] transition-colors">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 size={14} /> Travaux Pratiques (TP)
                            </h4>
                            <span className="text-lg font-bold text-white">{studentData.result.tpTotal}<span className="text-[10px] opacity-30 ml-1">/ 40</span></span>
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {studentData.evaluations.filter((e: any) => e.type === 'TP').map((e: any) => (
                               <div key={e.id} className="flex flex-col gap-1">
                                  <span className="text-[9px] font-bold text-white/20 uppercase truncate">{e.label}</span>
                                  <span className="text-sm font-bold text-white/80">{studentData.grades.find((g: any) => g.evaluation_id === e.id)?.score ?? '-'}<span className="text-[9px] opacity-20 ml-0.5">/ 20</span></span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* SN Component */}
                      <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/[0.08] transition-colors">
                         <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <Award size={14} /> Session Normale (SN)
                         </h4>
                         <span className="text-lg font-bold text-white">{studentData.sn ?? '-'}<span className="text-[10px] opacity-30 ml-1">/ 40</span></span>
                      </div>
                   </div>

                   {/* Footer Info */}
                   <div className="mt-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/30 italic leading-relaxed">
                         The grades presented are based on the latest evaluations confirmed by the instructor. 
                         For any discrepancy, please contact the academic staff through the official channels.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};