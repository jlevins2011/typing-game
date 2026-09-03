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
 * 1 star: finished and met the lesson accuracy goal.
 * 2 stars: also reached the first speed mark.
 * 3 stars: high accuracy and the second speed mark.
 */
export function starsForAttempt(
  passed: boolean,
  accuracy: number,
  wpm: number,
  accuracyGoal: number,
  starWpm: [number, number],
): number {
  if (!passed) return 0;
  const speedy = wpm >= starWpm[1];
  const steady = wpm >= starWpm[0];
  const precise = accuracy >= Math.max(accuracyGoal, 92);
  if (precise && speedy) return 3;
  if (accuracy >= accuracyGoal && steady) return 2;
  return 1;
}
