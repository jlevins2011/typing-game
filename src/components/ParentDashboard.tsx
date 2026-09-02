import { useMemo, useState } from "react";
import { getLesson, LESSONS } from "../data/curriculum";
import { displayKeyLabel } from "../data/keyboard";
import {
  average,
  bestWpm,
  formatDuration,
  isProficient,
  practiceMs,
  progressPercent,
  recentSessions,
  startOfDay,
  startOfWeek,
  totalStars,
  weakKeys,
  wpmTrend,
} from "../lib/stats";
import { formatAccuracy, formatWpm, round0 } from "../lib/wpm";
import { useStore } from "../store/StoreContext";
import { Pip } from "./Pip";

function Sparkline({ points }: { points: { wpm: number }[] }) {
  if (points.length < 2) return <p className="muted">More runs will draw a speed trend here.</p>;
  const max = Math.max(20, ...points.map((p) => p.wpm));
  const w = 320;
  const h = 72;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p.wpm / max) * (h - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Words per minute over time">
      <path d={d} fill="none" stroke="#f4c14e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ParentDashboard() {
  const { state, dispatch } = useStore();
  const [childId, setChildId] = useState(state.activeChildId ?? state.children[0]?.id ?? "");
  const child = state.children.find((c) => c.id === childId) ?? state.children[0];
  const trend = useMemo(() => (child ? wpmTrend(child) : []), [child]);
  const recent = child ? recentSessions(child, 10) : [];
  const weak = child ? weakKeys(child) : [];
  const avgAcc = child ? average(child.sessions.map((s) => s.accuracy)) : 0;
  const avgWpm = child ? average(child.sessions.filter((s) => s.passed).map((s) => s.wpm)) : 0;

  return (
    <div className="screen parent">
      <header className="map-top">
        <button className="text-back" onClick={() => dispatch({ type: "go", view: { name: "title" } })}>
          ← Home
        </button>
        <h1>Parent reports</h1>
        <button className="btn ghost print-hide" onClick={() => window.print()}>
          Print
        </button>
      </header>

      {state.children.length === 0 && <p className="lede">No explorers yet. Start an adventure from the home screen.</p>}

      {child && (
        <>
          <div className="parent-pick print-hide">
            {state.children.map((c) => (
              <button key={c.id} className={c.id === child.id ? "chip on" : "chip"} onClick={() => setChildId(c.id)}>
                {c.name}
              </button>
            ))}
          </div>

          <section className="parent-hero panel">
            <Pip coat={child.coat} pose="sit" size={88} />
            <div>
              <h2>{child.name}</h2>
              <p>
                {progressPercent(child)}% of Keytrail complete
                {isProficient(child) ? " · proficient typist" : ""}
              </p>
            </div>
          </section>

          <div className="stat-grid">
            <div>
              <b>{formatDuration(practiceMs(child.sessions, startOfDay()))}</b>
              <span>today</span>
            </div>
            <div>
              <b>{formatDuration(practiceMs(child.sessions, startOfWeek()))}</b>
              <span>this week</span>
            </div>
            <div>
              <b>{formatDuration(practiceMs(child.sessions))}</b>
              <span>all time</span>
            </div>
            <div>
              <b>{formatWpm(avgWpm || latestFallback(child))}</b>
              <span>avg WPM</span>
            </div>
            <div>
              <b>{formatWpm(bestWpm(child))}</b>
              <span>best WPM</span>
            </div>
            <div>
              <b>{formatAccuracy(avgAcc)}</b>
              <span>avg accuracy</span>
            </div>
            <div>
              <b>{totalStars(child)}</b>
              <span>stars</span>
            </div>
            <div>
              <b>{child.sessions.length}</b>
              <span>runs</span>
            </div>
          </div>

          <section className="panel">
            <h3>Speed over time</h3>
            <Sparkline points={trend} />
            <p className="muted">WPM uses the standard five-character word. Accuracy is correct keys ÷ all keystrokes.</p>
          </section>

          <section className="panel">
            <h3>Keys that need love</h3>
            {weak.length === 0 ? (
              <p className="muted">Not enough misses to pick on anyone yet.</p>
            ) : (
              <ul className="weak-list">
                {weak.map((item) => (
                  <li key={item.key}>
                    <b>{displayKeyLabel(item.key)}</b> {item.misses} misses
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h3>Lessons</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lesson</th>
                  <th>Stars</th>
                  <th>Best WPM</th>
                  <th>Best accuracy</th>
                  <th>Tries</th>
                </tr>
              </thead>
              <tbody>
                {LESSONS.map((lesson) => {
                  const rec = child.completedLessons[lesson.id];
                  return (
                    <tr key={lesson.id}>
                      <td>{lesson.number}</td>
                      <td>{lesson.title}</td>
                      <td>{rec ? "★".repeat(rec.stars) : "—"}</td>
                      <td>{rec ? round0(rec.bestWpm) : "—"}</td>
                      <td>{rec ? formatAccuracy(rec.bestAccuracy) : "—"}</td>
                      <td>{rec?.attempts ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h3>Recent runs</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Lesson</th>
                  <th>WPM</th>
                  <th>Accuracy</th>
                  <th>Stars</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((session) => (
                  <tr key={session.id}>
                    <td>{new Date(session.startedAt).toLocaleString()}</td>
                    <td>{getLesson(session.lessonId)?.title ?? session.lessonId}</td>
                    <td>{round0(session.wpm)}</td>
                    <td>{formatAccuracy(session.accuracy)}</td>
                    <td>{session.passed ? "★".repeat(session.stars) : "retry"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="fine">
            Keytrail stores progress only in this browser. There is no account, no cloud, and no ads. That is on purpose for a kids’ product.
          </p>
        </>
      )}
    </div>
  );
}

function latestFallback(child: { sessions: { wpm: number }[] }): number {
  return child.sessions.at(-1)?.wpm ?? 0;
}
