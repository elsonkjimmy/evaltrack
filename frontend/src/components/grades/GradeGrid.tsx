import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateStudentGrades, type RoundingRule } from '../../lib/calculations';
import { AddBonusMalusModal } from './AddBonusMalusModal';
import { EditStudentModal } from '../students/EditStudentModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { Trash2, Edit2 } from 'lucide-react';

import { toast } from 'sonner';

// Strict Dimensions for Airtable-like stability
const ROW_HEIGHT = 'h-14';
const HEADER_HEIGHT = 'h-20';
const GRADE_COL_WIDTH = 'w-20'; // Narrower for better density
const TOTAL_COL_WIDTH = 'w-24'; // For section totals
const MATRICULE_WIDTH = 'w-28';
const NAME_WIDTH = 'w-52';
const RESULT_COL_WIDTH = 'w-20';
const MAX_VISIBLE_COLS = 3;
const CENTER_MAX_WIDTH = `${(MAX_VISIBLE_COLS + 1) * 5.5}rem`; // Adjusted for 3 notes + 1 total

const GradeCell: React.FC<{
  value: number | null;
  max: number;
  onSave: (val: number | null) => Promise<void>;
  isLocked?: boolean;
}> = ({ value, max, onSave, isLocked }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value === null ? '' : String(value));

  const handleBlur = async () => {
    setIsEditing(false);
    if (tempVal.trim() === '') {
      if (value !== null) await onSave(null);
    } else {
      const parsed = parseFloat(tempVal.replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
        if (parsed !== value) await onSave(parsed);
      } else {
        setTempVal(value === null ? '' : String(value));
      }
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        className="w-full h-full text-center bg-navy text-white outline-none ring-1 ring-terra"
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
      />
    );
  }

  const getPercentColor = (val: number | null, max: number) => {
    if (val === null) return 'text-white/10';
    const p = val / max;
    if (p < 0.5) return 'text-rose-400 font-bold';
    if (p >= 0.75) return 'text-emerald-400 font-bold';
    return 'text-amber-400 font-bold';
  };

  return (
    <div 
      className={`w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors ${getPercentColor(value, max)}`}
      onDoubleClick={() => !isLocked && setIsEditing(true)}
    >
      {value ?? '-'}
    </div>
  );
};

export const GradeGrid: React.FC = () => {
  const { 
    currentRoom, currentStudents, currentEvaluations, 
    currentGrades, currentSN, currentBonusMalus,
    updateGrade, updateSN, deleteStudent, searchQuery
  } = useAppStore();

  const [adjustmentModal, setAdjustmentModal] = useState({ isOpen: false, studentId: '', studentName: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, student: null as any });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: '', studentName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const ccEvals = currentEvaluations.filter(e => e.type === 'CC');
  const tpEvals = currentEvaluations.filter(e => e.type === 'TP');
  const isLocked = currentRoom?.is_locked;

  const filteredStudents = currentStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.matricule.toLowerCase().includes(q);
  });

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteStudent(deleteModal.studentId);
      toast.success("Student deleted");
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-navy/20 border border-white/10 overflow-hidden rounded-sm shadow-2xl">
      <AddBonusMalusModal {...adjustmentModal} onClose={() => setAdjustmentModal({ ...adjustmentModal, isOpen: false })} />
      <EditStudentModal {...editModal} onClose={() => setEditModal({ ...editModal, isOpen: false })} />
      <DeleteConfirmModal 
        {...deleteModal} 
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteModal.studentName}? This will permanently remove all their grades from this room.`}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
        onConfirm={handleDeleteConfirm} 
        loading={isDeleting} 
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* 1. LEFT PANE: Identity (Fixed) */}
        <div className="flex-none flex flex-col border-r border-white/10 bg-navy z-30 shadow-xl">
           <div className={`${HEADER_HEIGHT} flex border-b border-white/10`}>
              <div className={`${MATRICULE_WIDTH} p-4 flex items-end text-[9px] uppercase font-bold text-white/30 tracking-widest`}>ID</div>
              <div className={`${NAME_WIDTH} p-4 flex items-end text-[9px] uppercase font-bold text-white/30 tracking-widest`}>Student Name</div>
           </div>
           <div className="flex-1 overflow-hidden">
              {filteredStudents.map(student => (
                <div key={student.id} className={`${ROW_HEIGHT} flex border-b border-white/5 hover:bg-white/5 transition-colors group`}>
                   <div className={`${MATRICULE_WIDTH} p-4 flex items-center text-[11px] font-mono text-white/50`}>{student.matricule}</div>
                   <div className={`${NAME_WIDTH} p-4 flex items-center justify-between gap-2`}>
                      <div className="truncate flex flex-col">
                        <span className="text-xs font-bold text-white truncate uppercase">{student.last_name}</span>
                        <span className="text-[10px] text-white/30 truncate">{student.first_name}</span>
                      </div>
                      {!isLocked && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setEditModal({ isOpen: true, student })} className="p-1 hover:text-terra"><Edit2 size={10} /></button>
                           <button onClick={() => setDeleteModal({ isOpen: true, studentId: student.id, studentName: `${student.first_name} ${student.last_name}` })} className="p-1 hover:text-rose-400"><Trash2 size={10} /></button>
                        </div>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* 2. CC PANE: Scrollable Section */}
        <div className="flex-none flex flex-col border-r border-white/10 bg-white/5">
           <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-mini" style={{ maxWidth: CENTER_MAX_WIDTH }}>
              <div style={{ width: `${(ccEvals.length * 5) + 6}rem` }} className="flex flex-col min-w-full">
                 <div className={`${HEADER_HEIGHT} flex border-b border-white/10 bg-navy/30 backdrop-blur-md`}>
                    {ccEvals.map(e => (
                      <div key={e.id} className={`${GRADE_COL_WIDTH} flex-none border-r border-white/5 p-2 flex flex-col justify-end items-center text-center overflow-hidden`}>
                         <span className="text-[7px] text-white/40 uppercase font-black tracking-tighter">SECTION CC</span>
                         <span className="text-[8px] font-black text-terra uppercase truncate w-full">{e.label}</span>
                         <span className="text-[7px] text-white/20">{e.weight}%</span>
                      </div>
                    ))}
                    <div className={`${TOTAL_COL_WIDTH} flex-none p-2 flex items-end justify-center text-[10px] font-black bg-terra/10 text-terra-light tracking-widest`}>CC TOTAL</div>
                 </div>
                 <div className="flex-1">
                    {filteredStudents.map(student => {
                      const studentGrades = currentGrades.filter(g => g.student_id === student.id);
                      const result = calculateStudentGrades({
                        ccInputs: ccEvals.map(e => ({ score: studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null, weight: Number(e.weight), absenceStatus: 'present' })),
                        tpInputs: [], sn: null, bonusMalusList: [],
                        ccCoefficient: Number(currentRoom.cc_coefficient), tpCoefficient: 0,
                        passThreshold: 0, roundingRule: (currentRoom.rounding_rule as RoundingRule) || 'tenth'
                      });
                      return (
                        <div key={student.id} className={`${ROW_HEIGHT} flex border-b border-white/5 hover:bg-white/5`}>
                          {ccEvals.map(e => (
                            <div key={e.id} className={`${GRADE_COL_WIDTH} flex-none border-r border-white/5`}>
                               <GradeCell value={studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null} max={20} onSave={(v) => updateGrade(student.id, e.id, v)} isLocked={isLocked} />
                            </div>
                          ))}
                          <div className={`${TOTAL_COL_WIDTH} flex-none flex items-center justify-center font-bold text-xs bg-terra/5 text-terra-light`}>{result.ccFinal}</div>
                        </div>
                      );
                    })}
                 </div>
              </div>
           </div>
        </div>

        {/* 3. TP PANE: Scrollable Section */}
        <div className="flex-none flex flex-col border-r border-white/10 bg-blue-500/5">
           <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-mini" style={{ maxWidth: CENTER_MAX_WIDTH }}>
              <div style={{ width: `${(tpEvals.length * 5) + 6}rem` }} className="flex flex-col min-w-full">
                 <div className={`${HEADER_HEIGHT} flex border-b border-white/10 bg-blue-900/20 backdrop-blur-md`}>
                    {tpEvals.map(e => (
                      <div key={e.id} className={`${GRADE_COL_WIDTH} flex-none border-r border-white/5 p-2 flex flex-col justify-end items-center text-center overflow-hidden`}>
                         <span className="text-[7px] text-blue-300/40 uppercase font-black tracking-tighter">SECTION TP</span>
                         <span className="text-[8px] font-black text-blue-300 uppercase truncate w-full">{e.label}</span>
                         <span className="text-[7px] text-white/20">{e.weight}%</span>
                      </div>
                    ))}
                    <div className={`${TOTAL_COL_WIDTH} flex-none p-2 flex items-end justify-center text-[10px] font-black bg-blue-400/10 text-blue-300 tracking-widest`}>TP TOTAL</div>
                 </div>
                 <div className="flex-1">
                    {filteredStudents.map(student => {
                      const studentGrades = currentGrades.filter(g => g.student_id === student.id);
                      const result = calculateStudentGrades({
                        ccInputs: [], tpInputs: tpEvals.map(e => ({ score: studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null, weight: Number(e.weight), absenceStatus: 'present' })),
                        sn: null, bonusMalusList: [],
                        ccCoefficient: 0, tpCoefficient: Number(currentRoom.tp_coefficient),
                        passThreshold: 0, roundingRule: (currentRoom.rounding_rule as RoundingRule) || 'tenth'
                      });
                      return (
                        <div key={student.id} className={`${ROW_HEIGHT} flex border-b border-white/5 hover:bg-white/5`}>
                          {tpEvals.map(e => (
                            <div key={e.id} className={`${GRADE_COL_WIDTH} flex-none border-r border-white/5`}>
                               <GradeCell value={studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null} max={20} onSave={(v) => updateGrade(student.id, e.id, v)} isLocked={isLocked} />
                            </div>
                          ))}
                          <div className={`${TOTAL_COL_WIDTH} flex-none flex items-center justify-center font-bold text-xs bg-blue-400/5 text-blue-300`}>{result.tpTotal}</div>
                        </div>
                      );
                    })}
                 </div>
              </div>
           </div>
        </div>

        {/* 4. RIGHT PANE: Results (Fixed) */}
        <div className="flex-1 flex flex-col bg-navy z-30 shadow-2xl border-l border-white/10">
           <div className={`${HEADER_HEIGHT} flex border-b border-white/10`}>
              <div className={`${RESULT_COL_WIDTH} flex-none p-2 flex items-end justify-center text-[9px] uppercase font-bold text-white/30`}>SN /40</div>
              <div className={`${RESULT_COL_WIDTH} flex-none p-2 flex items-end justify-center text-[9px] uppercase font-bold text-white/30`}>B/M</div>
              <div className="flex-1 p-2 flex items-end justify-center text-[10px] uppercase font-black bg-terra text-white tracking-widest text-center leading-tight">FINAL<br/><span className="text-[7px] opacity-60">/ 100</span></div>
           </div>
           <div className="flex-1 overflow-hidden">
              {filteredStudents.map(student => {
                const studentGrades = currentGrades.filter(g => g.student_id === student.id);
                const snGrade = currentSN.find(sn => sn.student_id === student.id)?.score ?? null;
                const studentBM = currentBonusMalus.filter(bm => bm.student_id === student.id);

                const result = calculateStudentGrades({
                  ccInputs: ccEvals.map(e => ({ score: studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null, weight: Number(e.weight), absenceStatus: 'present' })),
                  tpInputs: tpEvals.map(e => ({ score: studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null, weight: Number(e.weight), absenceStatus: 'present' })),
                  sn: snGrade,
                  bonusMalusList: studentBM.map(bm => ({ value: Number(bm.value) })),
                  ccCoefficient: Number(currentRoom.cc_coefficient),
                  tpCoefficient: Number(currentRoom.tp_coefficient),
                  passThreshold: Number(currentRoom.pass_threshold),
                  roundingRule: (currentRoom.rounding_rule as RoundingRule) || 'tenth'
                });

                return (
                  <div key={student.id} className={`${ROW_HEIGHT} flex border-b border-white/5 hover:bg-white/5 transition-colors`}>
                    <div className={`${RESULT_COL_WIDTH} flex-none border-r border-white/5`}>
                       <GradeCell value={snGrade} max={40} onSave={(v) => updateSN(student.id, currentRoom.id, v)} isLocked={isLocked} />
                    </div>
                    <div 
                      className={`${RESULT_COL_WIDTH} flex-none border-r border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10`}
                      onClick={() => !isLocked && setAdjustmentModal({ isOpen: true, studentId: student.id, studentName: `${student.first_name} ${student.last_name}` })}
                    >
                       <span className={`text-[11px] font-bold ${result.bonusMalusSum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {result.bonusMalusSum > 0 ? '+' : ''}{result.bonusMalusSum}
                       </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-white/5">
                       <span className={`text-xs font-black ${result.isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {result.finalGrade}
                       </span>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

      </div>
    </div>
  );
};