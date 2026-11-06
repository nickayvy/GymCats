export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return round1((feet * 12 + inches) * CM_PER_INCH);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function lbToKg(lb: number): number {
  return round1(lb * KG_PER_LB);
}

export function kgToLb(kg: number): number {
  return round1(kg / KG_PER_LB);
}
