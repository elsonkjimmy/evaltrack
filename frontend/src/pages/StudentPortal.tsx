import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateStudentGrades, type RoundingRule } from '../lib/calculations';
import { Search, Loader2, Award, BookOpen, GraduationCap, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, UserPlus, Send } from 'lucide-react';
import { toast } from 'sonner';

export const StudentPortal: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinData, setJoinData] = useState({ lastName: '', firstName: '' });

  // Fetch Room Info on Load
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) {
        setError("Invalid URL: Room ID is missing.");
        setInitialLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('rooms')
          .select('id, name, academic_year, cc_coefficient, tp_coefficient, pass_threshold, rounding_rule')
          .eq('id', roomId)
          .single();

        if (fetchError) {
          console.error("Supabase Fetch Error:", fetchError);
          throw new Error(`Database Error: ${fetchError.message}`);
        }
        
        if (!data) {
          throw new Error("This academic space does not exist.");
        }
        setRoom(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMatricule = matricule.trim();
    if (!cleanMatricule || !roomId) return;

    setLoading(true);
    setError(null);
    setStudentData(null);
    setShowJoinForm(false);

    try {
      // 1. Find Student by Matricule (Case-insensitive)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('room_id', roomId)
        .ilike('matricule', cleanMatricule)
        .maybeSingle();

      if (studentError) throw studentError;
      
      if (!student) {
        setShowJoinForm(true);
        throw new Error("Matricule not found. Fill the form below to request access.");
      }

      // 2. Fetch Grades and Evaluations
      const [evalsRes, gradesRes, snRes, bmRes] = await Promise.all([
        supabase.from('evaluations').select('*').eq('room_id', roomId).order('position'),
        supabase.from('grades').select('*').eq('student_id', student.id),
        supabase.from('session_normale').select('*').eq('student_id', student.id).eq('room_id', roomId).maybeSingle(),
        supabase.from('bonus_malus').select('*').eq('student_id', student.id).eq('room_id', roomId)
      ]);

      const result = calculateStudentGrades({
        ccInputs: (evalsRes.data || []).filter(e => e.type === 'CC').map(e => {
          const g = gradesRes.data?.find(grade => grade.evaluation_id === e.id);
          return { score: g?.score ?? null, weight: Number(e.weight), absenceStatus: (g?.absence_status as any) || 'present' };
        }),
        tpInputs: (evalsRes.data || []).filter(e => e.type === 'TP').map(e => {
          const g = gradesRes.data?.find(grade => grade.evaluation_id === e.id);
          return { score: g?.score ?? null, weight: Number(e.weight), absenceStatus: (g?.absence_status as any) || 'present' };
        }),
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

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: reqError } = await supabase.from('join_requests').insert({
        room_id: roomId,
        matricule: matricule.trim(),
        last_name: joinData.lastName.trim(),
        first_name: joinData.firstName.trim()
      });
      if (reqError) throw reqError;
      setJoinSuccess(true);
      setShowJoinForm(false);
      setError(null);
    } catch (err: any) {
      setError("Failed to send request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0d1b2a]">
         <Loader2 className="animate-spin text-white/20 mb-4" size={48} />
         <p className="text-white/40 font-medium animate-pulse">Establishing secure connection...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0d1b2a] text-center">
         <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6">
            <AlertCircle size={40} />
         </div>
         <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
         <p className="text-white/50 max-w-md mb-8">{error}</p>
         <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold transition-all">
            <RefreshCw size={18} /> Retry
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex flex-col items-center p-6 sm:p-12 relative overflow-hidden font-sans text-white">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-rose-500/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

      <div className="w-full max-w-4xl z-10 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
           <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-white backdrop-blur-xl border border-white/10 shadow-2xl">
              <GraduationCap size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight leading-none mb-2">Student Portal</h1>
              <p className="text-white/50 font-medium">{room?.name} • {room?.academic_year}</p>
           </div>
        </div>

        {joinSuccess && (
           <div className="bg-emerald-500/20 text-emerald-300 p-8 rounded-[3rem] border border-emerald-500/30 text-center animate-in fade-in zoom-in duration-500">
              <CheckCircle2 size={48} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Request Sent Successfully!</h2>
              <p className="text-sm opacity-80">Your instructor has been notified. Please check back later once they have added you to the room.</p>
              <button onClick={() => setJoinSuccess(false)} className="mt-6 text-xs font-bold uppercase tracking-widest bg-white text-emerald-900 px-6 py-2 rounded-full">Back</button>
           </div>
        )}

        {!studentData && !joinSuccess && (
          <div className="flex flex-col gap-8 max-w-md mx-auto w-full">
            <div className="bg-white/10 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <form onSubmit={handleLookup} className="flex flex-col gap-8">
                  <div className="text-center">
                     <h2 className="text-white font-bold text-lg mb-1">Check your results</h2>
                     <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Enter your matricule below</p>
                  </div>

                  {error && !showJoinForm && (
                     <div className="bg-rose-500/20 text-rose-300 p-4 rounded-2xl text-[11px] font-bold border border-rose-500/30 flex items-center gap-3">
                        <AlertCircle size={16} className="shrink-0" /> {error}
                     </div>
                  )}

                  <div className="relative group">
                     <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
                     <input 
                       type="text" 
                       autoFocus
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

            {showJoinForm && (
               <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-6">
                     <UserPlus className="text-terra" size={24} />
                     <h3 className="font-bold text-lg">Not in the list?</h3>
                  </div>
                  <p className="text-xs text-white/50 mb-8 leading-relaxed">If you haven't been registered yet, provide your name to send a request to the professor.</p>
                  
                  <form onSubmit={handleJoinRequest} className="flex flex-col gap-6">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">Last Name</label>
                        <input 
                          type="text" 
                          required
                          className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-white/30 outline-none transition-all text-sm font-bold"
                          value={joinData.lastName}
                          onChange={e => setJoinData({ ...joinData, lastName: e.target.value })}
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">First Name</label>
                        <input 
                          type="text" 
                          required
                          className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-white/30 outline-none transition-all text-sm font-bold"
                          value={joinData.firstName}
                          onChange={e => setJoinData({ ...joinData, firstName: e.target.value })}
                        />
                     </div>
                     <button 
                        type="submit"
                        disabled={loading}
                        className="bg-terra text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-terra-dark transition-all flex items-center justify-center gap-2 active:scale-95"
                     >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        Send Request
                     </button>
                  </form>
               </div>
            )}
          </div>
        )}

        {studentData && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
             <button onClick={() => setStudentData(null)} className="flex items-center gap-2 text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors self-start ml-4">
                <ArrowLeft size={16} /> Back to Search
             </button>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/10 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
                   <div className="w-24 h-24 bg-gradient-to-br from-terra to-terra-dark rounded-full flex items-center justify-center text-white text-3xl font-extrabold mb-6 shadow-terra">
                      {studentData.student.first_name[0]}{studentData.student.last_name[0]}
                   </div>
                   <h2 className="text-2xl font-bold text-white leading-tight uppercase">{studentData.student.last_name}</h2>
                   <h3 className="text-lg text-white/70 font-medium">{studentData.student.first_name}</h3>
                   <p className="text-white/40 font-mono mt-2 uppercase tracking-widest text-xs">Matricule: {studentData.student.matricule}</p>
                   <div className="mt-8 pt-8 border-t border-white/5 w-full flex flex-col gap-4">
                      <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Final Grade</span>
                         <span className={`text-3xl font-black ${studentData.result.isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {studentData.result.finalGrade}<span className="text-xs opacity-30 ml-1">/ 100</span>
                         </span>
                      </div>
                      <div className={`py-3 rounded-2xl font-bold text-xs shadow-inner ${studentData.result.isPassing ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                         {studentData.result.isPassing ? 'SUCCESSFUL' : 'ACADEMIC REVIEW REQUIRED'}
                      </div>
                   </div>
                </div>
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col gap-8">
                   <h3 className="text-xl font-bold text-white">Evaluation Breakdown</h3>
                   <div className="flex flex-col gap-4">
                      <div className="bg-white/5 p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14} className="text-terra" /> Contrôle Continu (CC)</h4>
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
                      <div className="bg-white/5 p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-400" /> Travaux Pratiques (TP)</h4>
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
                      <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between border border-white/5">
                         <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><Award size={14} className="text-emerald-400" /> Session Normale (SN)</h4>
                         <span className="text-lg font-bold text-white">{studentData.sn ?? '-'}<span className="text-[10px] opacity-30 ml-1">/ 40</span></span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};