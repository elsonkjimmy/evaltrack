import * as XLSX from 'xlsx';
import { calculateStudentGrades, type RoundingRule } from './calculations';

export const exportRoomToExcel = (
  room: any,
  students: any[],
  evaluations: any[],
  grades: any[],
  sn: any[],
  bonusMalus: any[]
) => {
  const ccEvaluations = evaluations.filter(e => e.type === 'CC');
  const tpEvaluations = evaluations.filter(e => e.type === 'TP');

  const exportData = students.map(student => {
    const studentGrades = grades.filter(g => g.student_id === student.id);
    const snGrade = sn.find(s => s.student_id === student.id)?.score ?? null;
    const studentBM = bonusMalus.filter(bm => bm.student_id === student.id);

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
      ccCoefficient: Number(room.cc_coefficient),
      tpCoefficient: Number(room.tp_coefficient),
      passThreshold: Number(room.pass_threshold),
      roundingRule: room.rounding_rule as RoundingRule
    });

    // Dynamically build the row object
    const row: any = {
      'Matricule': student.matricule,
      'Last Name': student.last_name,
      'First Name': student.first_name,
    };

    // Add CC individual grades
    ccEvaluations.forEach(e => {
      row[`CC: ${e.label}`] = studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '-';
    });
    row['Total CC (/20)'] = result.ccFinal;

    // Add TP individual grades
    tpEvaluations.forEach(e => {
      row[`TP: ${e.label}`] = studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '-';
    });
    row['Total TP (/40)'] = result.tpTotal;

    row['Session Normale (/40)'] = snGrade ?? '-';
    row['Bonus/Malus'] = result.bonusMalusSum;
    row['FINAL GRADE (/100)'] = result.finalGrade;
    row['Status'] = result.isPassing ? 'PASSED' : 'FAILED';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');

  // Fix column widths
  const wscols = [
    { wch: 15 }, // Matricule
    { wch: 20 }, // Last Name
    { wch: 20 }, // First Name
    ...evaluations.map(() => ({ wch: 15 })),
    { wch: 15 }, // Totals
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 10 },
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `EvalTrack_${room.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
