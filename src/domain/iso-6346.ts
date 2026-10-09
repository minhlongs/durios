const LETTER_VALUES: Readonly<Record<string, number>> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
  K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
  U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

export interface Iso6346ValidationResult {
  readonly isValid: boolean;
  readonly normalized: string;
  readonly expectedCheckDigit: number | null;
  readonly actualCheckDigit: number | null;
  readonly reason?: string | undefined;
}

export function validateIso6346Container(containerNumber: string): Iso6346ValidationResult {
  const clean = containerNumber.trim().toUpperCase().replace(/[\s-]/g, "");

  if (!/^[A-Z]{4}\d{7}$/.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      expectedCheckDigit: null,
      actualCheckDigit: null,
      reason: "Container identifier must consist of 4 capital letters and 7 digits",
    };
  }

  let totalSum = 0;
  for (let i = 0; i < 10; i++) {
    const char = clean[i]!;
    let val: number;
    if (char >= "A" && char <= "Z") {
      val = LETTER_VALUES[char] ?? 0;
    } else {
      val = Number.parseInt(char, 10);
    }
    const weight = 2 ** i;
    totalSum += val * weight;
  }

  const remainder = totalSum % 11;
  const expectedCheckDigit = remainder === 10 ? 0 : remainder;
  const actualCheckDigit = Number.parseInt(clean[10]!, 10);

  const isValid = expectedCheckDigit === actualCheckDigit;

  return {
    isValid,
    normalized: clean,
    expectedCheckDigit,
    actualCheckDigit,
    reason: isValid ? undefined : `Check digit mismatch: expected ${expectedCheckDigit}, found ${actualCheckDigit}`,
  };
}
