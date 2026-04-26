import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateStudentGrades, type RoundingRule } from './calculations';

export const exportRoomToExcel = (
  room: any,
  students: any[],
  evaluations: any[],
  grades: any[],
  sn: any[],
  bonusMalus: any[]
) => {
  // ... (existing implementation)
};

export const exportRoomToPDF = (
  room: any,
  students: any[],
  evaluations: any[],
  grades: any[],
  sn: any[],
  bonusMalus: any[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const ccEvaluations = evaluations.filter(e => e.type === 'CC');
  const tpEvaluations = evaluations.filter(e => e.type === 'TP');

  // Title & Header Info
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Navy
  doc.text(`Academic Report: ${room.name}`, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Academic Year: ${room.academic_year || 'N/A'}`, 14, 27);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 32);

  // Table Data
  const tableHeaders = [
    ['Matricule', 'Student Name', ...ccEvaluations.map(e => e.label), 'CC/20', ...tpEvaluations.map(e => e.label), 'TP/40', 'SN/40', 'B/M', 'FINAL', 'ST']
  ];

  const tableRows = students.map(student => {
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

    return [
      student.matricule,
      `${student.last_name} ${student.first_name}`,
      ...ccEvaluations.map(e => studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '-'),
      result.ccFinal,
      ...tpEvaluations.map(e => studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '-'),
      result.tpTotal,
      snGrade ?? '-',
      result.bonusMalusSum !== 0 ? (result.bonusMalusSum > 0 ? `+${result.bonusMalusSum}` : result.bonusMalusSum) : '0',
      result.finalGrade,
      result.isPassing ? 'P' : 'F'
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 }, // Matricule
      1: { cellWidth: 'auto' }, // Name
      [tableHeaders[0].length - 2]: { fontStyle: 'bold' }, // Final Grade
      [tableHeaders[0].length - 1]: { fontStyle: 'bold' }, // Status
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === tableHeaders[0].length - 1) {
        if (data.cell.text[0] === 'P') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
        } else {
          data.cell.styles.textColor = [244, 63, 94]; // Rose
        }
      }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`EvalTrack - Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`EvalTrack_${room.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
