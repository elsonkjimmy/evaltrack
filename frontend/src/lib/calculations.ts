export type RoundingRule = 'tenth' | 'hundredth' | 'integer';

export interface EvaluationInput {
  score: number | null;
  weight: number; 
  absenceStatus: 'present' | 'absent_justified' | 'absent_unjustified';
}

export interface BonusMalus {
  value: number; 
}

export interface GradeCalculationResult {
  ccBrut: number;         
  ccTotal: number;        
  ccBeforeAdjust: number; 
  bonusMalusSum: number;  
  ccFinal: number;        
  tpBrut: number;         
  tpTotal: number;        
  sn: number;             
  finalGrade: number;     
  isPassing: boolean;     
}

export function applyRounding(value: number, rule: RoundingRule): number {
  switch (rule) {
    case 'integer':    return Math.round(value);
    case 'hundredth':  return Math.round(value * 100) / 100;
    case 'tenth':
    default:           return Math.round(value * 10) / 10;
  }
}

export function calculateStudentGrades(params: {
  ccInputs: EvaluationInput[];
  tpInputs: EvaluationInput[];
  sn: number | null;
  bonusMalusList: BonusMalus[];
  ccCoefficient: number;
  tpCoefficient: number;
  passThreshold: number;
  roundingRule: RoundingRule;
}): GradeCalculationResult {
  const {
    ccInputs, tpInputs, sn,
    bonusMalusList, ccCoefficient, tpCoefficient,
    passThreshold, roundingRule
  } = params;

  const ccBrut = computeWeightedScore(ccInputs);
  const ccTotalRaw = ccBrut * ccCoefficient;
  const ccTotal = applyRounding(Math.min(ccTotalRaw, 20), roundingRule);

  const bonusMalusSum = bonusMalusList.reduce((acc, bm) => acc + bm.value, 0);

  const ccFinal = applyRounding(
    Math.min(Math.max(ccTotal + bonusMalusSum, 0), 20),
    roundingRule
  );

  const tpBrut = computeWeightedScore(tpInputs);
  const tpTotalRaw = tpBrut * tpCoefficient;
  const tpTotal = applyRounding(Math.min(tpTotalRaw, 40), roundingRule);

  const snScore = applyRounding(Math.min(sn ?? 0, 40), roundingRule);

  const finalGrade = applyRounding(
    Math.min(ccFinal + tpTotal + snScore, 100),
    roundingRule
  );

  return {
    ccBrut:         applyRounding(ccBrut, roundingRule),
    ccTotal,
    ccBeforeAdjust: ccTotal,
    bonusMalusSum:  applyRounding(bonusMalusSum, roundingRule),
    ccFinal,
    tpBrut:         applyRounding(tpBrut, roundingRule),
    tpTotal,
    sn:             snScore,
    finalGrade,
    isPassing:      finalGrade >= passThreshold,
  };
}

function computeWeightedScore(inputs: EvaluationInput[]): number {
  const active = inputs.filter(i => i.absenceStatus !== 'absent_justified');
  if (active.length === 0) return 0;

  const totalWeight = active.reduce((acc, i) => acc + i.weight, 0);
  if (totalWeight === 0) return 0;

  const weighted = active.reduce((acc, i) => {
    const score = i.absenceStatus === 'absent_unjustified' ? 0 : (i.score ?? 0);
    return acc + (score * i.weight);
  }, 0);

  return weighted / totalWeight;
}
