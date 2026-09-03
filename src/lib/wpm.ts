/** Standard typing metric: a "word" is five characters. */

export function elapsedMinutes(durationMs: number): number {
  return Math.max(durationMs, 0) / 60000;
}

export function wordsFromChars(charCount: number): number {
  return charCount / 5;
}

export function computeWpm(correctChars: number, durationMs: number): number {
  const minutes = elapsedMinutes(durationMs);
  if (minutes <= 0) return 0;
  const wpm = wordsFromChars(correctChars) / minutes;
  if (!Number.isFinite(wpm)) return 0;
  return Math.max(0, wpm);
}

export function computeAccuracy(correct: number, errors: number): number {
  const total = correct + errors;
  if (total <= 0) return 100;
  return (correct / total) * 100;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round0(n: number): number {
  return Math.round(n);
}

export function formatWpm(wpm: number): string {
  return `${round0(wpm)}`;
}

export function formatAccuracy(accuracy: number): string {
  return `${round0(accuracy)}%`;
}

/**
 * 1 star: passed the lesson.
 * 2 stars: also hit the first speed mark, or accuracy well above the goal.
 * 3 stars: hit the second speed mark. If that mark is 0 (early Home Camp),
 * finishing is enough — kids should leave the first trails proud.
 */
export function starsForAttempt(
  passed: boolean,
  accuracy: number,
  wpm: number,
  accuracyGoal: number,
  starWpm: [number, number],
): number {
  if (!passed) return 0;
  const [wpmTwo, wpmThree] = starWpm;
  if (wpmThree <= 0) return 3;
  if (wpm >= wpmThree) return 3;
  const generousAccuracy = accuracy >= Math.min(100, accuracyGoal + 10);
  if (wpmTwo <= 0 || wpm >= wpmTwo || generousAccuracy) return 2;
  return 1;
}
