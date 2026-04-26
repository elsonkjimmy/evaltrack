import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateStudentGrades, type RoundingRule } from './calculations';

/**
 * EXCEL EXPORT
 * Professional formatting with sections for CC, TP, and Final Results
 */
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

    const row: any = {
      'Matricule': student.matricule,
      'Last Name': student.last_name.toUpperCase(),
      'First Name': student.first_name,
    };

    // CC Section
    ccEvaluations.forEach(e => {
      row[`[CC] ${e.label} (${e.weight}%)`] = studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '';
    });
    row['CC TOTAL (/20)'] = result.ccFinal;

    // TP Section
    tpEvaluations.forEach(e => {
      row[`[TP] ${e.label} (${e.weight}%)`] = studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '';
    });
    row['TP TOTAL (/40)'] = result.tpTotal;

    row['SN (/40)'] = snGrade ?? '';
    row['B/M'] = result.bonusMalusSum !== 0 ? result.bonusMalusSum : '';
    row['FINAL GRADE (/100)'] = result.finalGrade;
    row['STATUS'] = result.isPassing ? 'PASSED' : 'FAILED';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gradebook');

  // Add metadata and basic styling via column widths
  const maxEvalCount = evaluations.length;
  const wscols = [
    { wch: 12 }, // Matricule
    { wch: 20 }, // Last Name
    { wch: 20 }, // First Name
    ...Array(maxEvalCount + 2).fill({ wch: 10 }), // CC/TP individual and totals
    { wch: 8 },  // SN
    { wch: 8 },  // B/M
    { wch: 15 }, // Final
    { wch: 12 }, // Status
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `EvalTrack_${room.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * PDF EXPORT
 * High-end design with headers, logos, and colored sections
 */
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

  // 1. HEADER DESIGN
  // Top decorative bar
  doc.setFillColor(15, 23, 42); // Navy
  doc.rect(0, 0, 297, 15, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('EVALTRACK ACADEMIC SOLUTIONS', 14, 10);

  // Main Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(room.name.toUpperCase(), 14, 35);
  
  // Subtitle / Metadata
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, 283, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Academic Year: ${room.academic_year || 'N/A'}`, 14, 47);
  doc.text(`CC Coeff: ${room.cc_coefficient}  |  TP Coeff: ${room.tp_coefficient}  |  Threshold: ${room.pass_threshold}/100`, 14, 52);
  
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 283, 52, { align: 'right' });

  // 2. DATA PREPARATION
  const tableHeaders = [
    [
      { content: 'ID', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'STUDENT NAME', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      { content: 'CONTRÔLE CONTINU (CC)', colSpan: ccEvaluations.length + 1, styles: { halign: 'center', fillColor: [217, 119, 6] } }, // Terra color
      { content: 'TRAVAUX PRATIQUES (TP)', colSpan: tpEvaluations.length + 1, styles: { halign: 'center', fillColor: [37, 99, 235] } }, // Blue color
      { content: 'EXAM', colSpan: 1, styles: { halign: 'center' } },
      { content: 'ADJ', colSpan: 1, styles: { halign: 'center' } },
      { content: 'FINAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [15, 23, 42] } },
      { content: 'ST', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [15, 23, 42] } },
    ],
    [
      ...ccEvaluations.map(e => ({ content: e.label, styles: { halign: 'center', fontSize: 7 } })),
      { content: 'TOTAL', styles: { halign: 'center', fontStyle: 'bold', fillColor: [254, 243, 199] } },
      ...tpEvaluations.map(e => ({ content: e.label, styles: { halign: 'center', fontSize: 7 } })),
      { content: 'TOTAL', styles: { halign: 'center', fontStyle: 'bold', fillColor: [219, 234, 254] } },
      { content: 'SN', styles: { halign: 'center' } },
      { content: 'B/M', styles: { halign: 'center' } },
    ]
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
      `${student.last_name.toUpperCase()} ${student.first_name}`,
      ...ccEvaluations.map(e => studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '-'),
      result.ccFinal,
      ...tpEvaluations.map(e => studentGrades.find(g => g.evaluation_id === e.id)?.score ?? '-'),
      result.tpTotal,
      snGrade ?? '-',
      result.bonusMalusSum !== 0 ? (result.bonusMalusSum > 0 ? `+${result.bonusMalusSum}` : result.bonusMalusSum) : '0',
      result.finalGrade,
      result.isPassing ? 'PASS' : 'FAIL'
    ];
  });

  // 3. TABLE EXECUTION
  autoTable(doc, {
    startY: 60,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 2, 
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 45 },
      // The last few columns
      [tableRows[0].length - 2]: { halign: 'center', fontStyle: 'bold', fontSize: 9 },
      [tableRows[0].length - 1]: { halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight final status
      if (data.section === 'body' && data.column.index === tableRows[0].length - 1) {
        if (data.cell.text[0] === 'PASS') {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald-600
        } else {
          data.cell.styles.textColor = [220, 38, 38]; // Red-600
        }
      }
      // Bold section totals
      if (data.section === 'body') {
        const ccTotalIdx = ccEvaluations.length + 2;
        const tpTotalIdx = ccTotalIdx + tpEvaluations.length + 1;
        if (data.column.index === ccTotalIdx || data.column.index === tpTotalIdx) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // 4. FOOTER
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`EvalTrack Management System - Page ${i} of ${pageCount}`, 148, 200, { align: 'center' });
  }

  doc.save(`EvalTrack_${room.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
