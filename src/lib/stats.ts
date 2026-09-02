import { LESSONS, nextLessonId, previousLessonId } from "../data/curriculum";
import type { Child, Session } from "../types";

export function isLessonUnlocked(child: Child, lessonId: string): boolean {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  if (!lesson) return false;
  if (lesson.number === 1) return true;
  const prev = previousLessonId(lessonId);
  if (!prev) return true;
  return (child.completedLessons[prev]?.stars ?? 0) >= 1;
}

export function recommendedLessonId(child: Child): string {
  for (const lesson of LESSONS) {
    const record = child.completedLessons[lesson.id];
    if (!record || record.stars < 1) return lesson.id;
  }
  return LESSONS[LESSONS.length - 1].id;
}

export function progressPercent(child: Child): number {
  const done = LESSONS.filter((lesson) => (child.completedLessons[lesson.id]?.stars ?? 0) >= 1).length;
  return Math.round((done / LESSONS.length) * 100);
}

export function totalStars(child: Child): number {
  return Object.values(child.completedLessons).reduce((sum, rec) => sum + rec.stars, 0);
}

export function maxStars(): number {
  return LESSONS.length * 3;
}

export function practiceMs(sessions: Session[], since?: number): number {
  return sessions
    .filter((session) => (since ? session.startedAt >= since : true))
    .reduce((sum, session) => sum + session.durationMs, 0);
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) {
    const secs = Math.round(ms / 1000);
    return `${secs}s`;
  }
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hours}h ${mins}m`;
}

export function startOfDay(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function recentSessions(child: Child, limit = 12): Session[] {
  return [...child.sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
}

export function wpmTrend(child: Child): { t: number; wpm: number; accuracy: number }[] {
  return [...child.sessions]
    .filter((session) => session.passed)
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((session) => ({ t: session.startedAt, wpm: session.wpm, accuracy: session.accuracy }));
}

export function weakKeys(child: Child, limit = 6): { key: string; misses: number }[] {
  const tally: Record<string, number> = {};
  for (const session of child.sessions) {
    for (const [key, n] of Object.entries(session.keyErrors)) {
      tally[key] = (tally[key] ?? 0) + n;
    }
  }
  return Object.entries(tally)
    .map(([key, misses]) => ({ key, misses }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit);
}

export function bestWpm(child: Child): number {
  return child.sessions.reduce((best, session) => Math.max(best, session.wpm), 0);
}

export function latestWpm(child: Child): number {
  const passed = [...child.sessions].reverse().find((session) => session.passed);
  return passed?.wpm ?? 0;
}

export function isProficient(child: Child): boolean {
  const exam = child.completedLessons["summit-exam"];
  return (exam?.stars ?? 0) >= 1 && (exam?.bestWpm ?? 0) >= 35 && (exam?.bestAccuracy ?? 0) >= 95;
}

export { nextLessonId };
