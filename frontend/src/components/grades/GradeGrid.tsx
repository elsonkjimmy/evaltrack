import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateStudentGrades, type RoundingRule } from '../../lib/calculations';
import { AddBonusMalusModal } from './AddBonusMalusModal';
import { EditStudentModal } from '../students/EditStudentModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const GradeCell: React.FC<{
  value: number | null;
  max: number;
  onSave: (val: number | null) => Promise<void>;
  isLocked?: boolean;
}> = ({ value, max, onSave, isLocked }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value === null ? '' : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempVal(value === null ? '' : String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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

  const getCellColor = (val: number | null, max: number) => {
    if (val === null) return 'bg-transparent text-white/20';
    const percent = val / max;
    if (percent < 0.5) return 'bg-rose-500/10 text-rose-400 font-bold';
    if (percent >= 0.75) return 'bg-emerald-500/10 text-emerald-400 font-bold';
    return 'bg-amber-500/10 text-amber-400 font-bold';
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="w-12 h-6 text-center border border-terra focus:outline-none focus:ring-2 focus:ring-terra/20 rounded font-mono text-sm bg-navy text-white z-20"
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
      />
    );
  }

  return (
    <div 
      className={`w-full h-full min-h-[2.5rem] flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5 rounded-lg ${getCellColor(value, max)}`}
      onDoubleClick={() => !isLocked && setIsEditing(true)}
    >
      {value ?? '-'}
    </div>
  );
};

export const GradeGrid: React.FC = () => {
  const { 
    currentRoom, 
    currentStudents, 
    currentEvaluations, 
    currentGrades, 
    currentSN, 
    currentBonusMalus,
    updateGrade,
    updateSN,
    deleteStudent,
    searchQuery
  } = useAppStore();

  const [adjustmentModal, setAdjustmentModal] = useState<{ isOpen: boolean, studentId: string, studentName: string }>({
    isOpen: false,
    studentId: '',
    studentName: ''
  });

  const [editModal, setEditModal] = useState<{ isOpen: boolean, student: any }>({
    isOpen: false,
    student: null
  });

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, studentId: string, studentName: string }>({
    isOpen: false,
    studentId: '',
    studentName: ''
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const ccEvaluations = currentEvaluations.filter(e => e.type === 'CC');
  const tpEvaluations = currentEvaluations.filter(e => e.type === 'TP');
  const isLocked = currentRoom?.is_locked;

  const ccMaxDisplay = 20 * (currentRoom?.cc_coefficient || 1.5);
  const tpMaxDisplay = 20 * (currentRoom?.tp_coefficient || 2);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteStudent(deleteModal.studentId);
      toast.success(`Student ${deleteModal.studentName} deleted successfully`);
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = currentStudents.filter(student => {
    const search = searchQuery.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(search) ||
      student.last_name.toLowerCase().includes(search) ||
      student.matricule.toLowerCase().includes(search)
    );
  });

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden relative">
      <AddBonusMalusModal 
        isOpen={adjustmentModal.isOpen}
        onClose={() => setAdjustmentModal(prev => ({ ...prev, isOpen: false }))}
        studentId={adjustmentModal.studentId}
        studentName={adjustmentModal.studentName}
      />

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0 table-auto min-w-max">
          <thead className="sticky top-0 z-30">
            <tr className="bg-navy text-white font-sans text-[10px] uppercase tracking-widest font-bold">
              <th className="p-4 sticky left-0 z-40 bg-navy border-b border-white/10 min-w-[120px] shadow-[2px_0_10px_rgba(0,0,0,0.3)]" rowSpan={2}>Matricule</th>
              <th className="p-4 sticky left-[120px] z-40 bg-navy border-b border-white/10 border-r border-white/5 min-w-[200px] shadow-[2px_0_10px_rgba(0,0,0,0.3)]" rowSpan={2}>Student Name</th>
              
              {ccEvaluations.length > 0 && (
                <th className="p-2 text-center border-b border-white/10 border-l border-white/5 bg-terra/20 text-terra-light" colSpan={ccEvaluations.length + 1}>
                  Contrôle Continu (Max {ccMaxDisplay})
                </th>
              )}
              
              {tpEvaluations.length > 0 && (
                <th className="p-2 text-center border-b border-white/10 border-l border-white/5 bg-blue-500/20 text-blue-300" colSpan={tpEvaluations.length + 1}>
                  Travaux Pratiques (Max {tpMaxDisplay})
                </th>
              )}
              
              <th className="p-4 text-center border-b border-white/10 border-l border-white/5 min-w-[100px]" rowSpan={2}>SN /40</th>
              <th className="p-4 text-center border-b border-white/10 border-l border-white/5 min-w-[100px]" rowSpan={2}>B/M</th>
              <th className="p-4 text-center border-b border-white/10 border-l border-white/10 bg-terra min-w-[120px]" rowSpan={2}>Final /100</th>
            </tr>
            <tr className="bg-navy/95 backdrop-blur-md text-white/50 font-sans text-[9px] uppercase tracking-wider font-bold">
              {ccEvaluations.map(e => (
                <th key={e.id} className="p-2 text-center border-b border-white/5 border-l border-white/5 min-w-[80px]">
                  {e.label} <span className="text-terra-light/60 ml-1">{e.weight}%</span>
                </th>
              ))}
              {ccEvaluations.length > 0 && (
                <th className="p-2 text-center border-b border-white/5 border-l border-white/10 bg-white/5 text-white/80 font-bold">Total CC</th>
              )}

              {tpEvaluations.map(e => (
                <th key={e.id} className="p-2 text-center border-b border-white/5 border-l border-white/5 min-w-[80px]">
                  {e.label} <span className="text-blue-300/60 ml-1">{e.weight}%</span>
                </th>
              ))}
              {tpEvaluations.length > 0 && (
                <th className="p-2 text-center border-b border-white/5 border-l border-white/10 bg-white/5 text-white/80 font-bold">Total TP</th>
              )}
            </tr>
          </thead>
          <tbody className="font-mono text-sm text-white/80">
            {filteredStudents.map((student) => {
              const studentGrades = currentGrades.filter(g => g.student_id === student.id);
              const snGrade = currentSN.find(sn => sn.student_id === student.id)?.score ?? null;
              const studentBM = currentBonusMalus.filter(bm => bm.student_id === student.id);

              const result = calculateStudentGrades({
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

              return (
                <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-3 px-4 border-b border-white/5 sticky left-0 z-20 bg-navy text-white/40 font-sans text-xs group-hover:text-white transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.3)]">{student.matricule}</td>
                  <td className="p-3 border-b border-white/5 border-r border-white/5 sticky left-[120px] z-20 bg-navy text-white group-hover:bg-navy transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{student.last_name}</span>
                        <span className="text-white/40 text-[11px] leading-tight">{student.first_name}</span>
                      </div>
                      {!isLocked && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => setEditModal({ isOpen: true, student })}
                             className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-terra-light transition-colors"
                             title="Edit Student Info"
                           >
                             <Edit2 size={12} />
                           </button>
                           <button 
                             onClick={() => setDeleteModal({ isOpen: true, studentId: student.id, studentName: `${student.first_name} ${student.last_name}` })}
                             className="p-1.5 hover:bg-rose-500/20 rounded text-white/40 hover:text-rose-400 transition-colors"
                             title="Delete Student"
                           >
                             <Trash2 size={12} />
                           </button>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* CC Cells */}
                  {ccEvaluations.map(e => (
                    <td key={e.id} className="p-2 text-center border-b border-white/5 border-l border-white/5">
                      <GradeCell 
                        value={studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null} 
                        max={20} 
                        onSave={(v) => updateGrade(student.id, e.id, v)} 
                        isLocked={isLocked}
                      />
                    </td>
                  ))}
                  {ccEvaluations.length > 0 && (
                    <td className="p-3 text-center font-bold bg-white/5 border-b border-white/5 border-l border-white/10 text-terra-light">
                      {result.ccFinal}
                    </td>
                  )}

                  {/* TP Cells */}
                  {tpEvaluations.map(e => (
                    <td key={e.id} className="p-2 text-center border-b border-white/5 border-l border-white/5">
                      <GradeCell 
                        value={studentGrades.find(g => g.evaluation_id === e.id)?.score ?? null} 
                        max={20} 
                        onSave={(v) => updateGrade(student.id, e.id, v)} 
                        isLocked={isLocked}
                      />
                    </td>
                  ))}
                  {tpEvaluations.length > 0 && (
                    <td className="p-3 text-center font-bold bg-white/5 border-b border-white/5 border-l border-white/10 text-blue-300">
                      {result.tpTotal}
                    </td>
                  )}

                  <td className="p-2 text-center border-b border-white/5 border-l border-white/5">
                    <GradeCell 
                      value={snGrade} 
                      max={40} 
                      onSave={(v) => updateSN(student.id, currentRoom.id, v)} 
                      isLocked={isLocked}
                    />
                  </td>

                  <td className="p-3 text-center border-b border-white/5 border-l border-white/5 group/bm relative">
                     <div 
                       className={`${isLocked ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform flex flex-col items-center gap-1`}
                       onClick={() => !isLocked && setAdjustmentModal({ 
                         isOpen: true, 
                         studentId: student.id, 
                         studentName: `${student.first_name} ${student.last_name}` 
                       })}
                     >
                       {result.bonusMalusSum !== 0 ? (
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${result.bonusMalusSum > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {result.bonusMalusSum > 0 ? '+' : ''}{result.bonusMalusSum}
                          </span>
                       ) : (
                          <span className={`text-white/20 transition-opacity ${isLocked ? 'opacity-0' : 'opacity-0 group-hover/bm:opacity-100'}`}>
                            <Plus size={14} />
                          </span>
                       )}
                     </div>

                     {studentBM.length > 0 && (
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-navy border border-white/10 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover/bm:opacity-100 pointer-events-none transition-all z-50 transform scale-95 group-hover/bm:scale-100">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-terra-light mb-2 border-b border-white/10 pb-1">Adjustment History</p>
                          <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                            {studentBM.map((bm, idx) => (
                              <div key={idx} className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[10px] font-bold ${bm.value > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {bm.value > 0 ? '+' : ''}{bm.value}
                                  </span>
                                  <span className="text-[8px] text-white/30">{new Date(bm.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[9px] text-white/60 leading-tight italic">"{bm.reason}"</p>
                              </div>
                            ))}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-navy"></div>
                       </div>
                     )}
                  </td>

                  <td className={`p-3 text-center border-b border-white/5 border-l border-white/10 font-bold text-base ${result.isPassing ? 'text-emerald-400 bg-emerald-400/5' : 'text-rose-400 bg-rose-400/5'}`}>
                    {result.finalGrade}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditStudentModal 
        isOpen={editModal.isOpen} 
        onClose={() => setEditModal({ ...editModal, isOpen: false })} 
        student={editModal.student} 
      />

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Delete Student?"
        message={`Are you sure you want to delete ${deleteModal.studentName}? This will remove all their grades permanentely.`}
      />
    </div>
  );
};