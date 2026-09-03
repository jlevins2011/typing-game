import { getLesson, nextLessonId, WORLDS } from "../data/curriculum";
import { displayKeyLabel } from "../data/keyboard";
import { sounds } from "../lib/audio";
import { formatAccuracy, formatWpm, round0 } from "../lib/wpm";
import { useActiveChild, useStore } from "../store/StoreContext";
import { Pip } from "./Pip";
import { useEffect } from "react";

export function Results({ lessonId, sessionId }: { lessonId: string; sessionId: string }) {
  const { dispatch } = useStore();
  const child = useActiveChild();
  const lesson = getLesson(lessonId);
  const session = child?.sessions.find((item) => item.id === sessionId);
  const next = nextLessonId(lessonId);

  useEffect(() => {
    if (session?.passed) sounds.star();
  }, [session?.passed]);

  if (!child || !lesson || !session) return null;
  const world = WORLDS.find((w) => w.id === lesson.worldId);
  const weak = Object.entries(session.keyErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  let headline = "Pip is proud of that practice.";
  let body = "Every run lights a little more of the map.";
  if (session.passed && session.stars >= 3) {
    headline = "Lanterns blazing!";
    body = "Smooth, quick, and kind to the keys. That is real typing.";
  } else if (session.passed && session.stars === 2) {
    headline = "The trail is bright.";
    body = "Great accuracy. A little more flow and the third star is yours.";
  } else if (session.passed) {
    headline = "Path unlocked.";
    body = "You finished with the accuracy Pip needed. Speed stars come with relaxed hands.";
  } else if (lesson.kind === "exam") {
    headline = "Summit still waiting.";
    body = `Aim for ${lesson.goals.wpm} WPM and ${lesson.goals.accuracy}% accuracy. Warm up, then try again — no rush.`;
  } else {
    headline = "Pip stumbled, not you.";
    body = `Try to land ${lesson.goals.accuracy}% accuracy. Slow down on the red keys. The trail does not go anywhere.`;
  }

  return (
    <div className="screen results">
      <p className="eyebrow">
        {world?.name} · Lesson {lesson.number}
      </p>
      <Pip coat={child.coat} pose={session.passed ? "celebrate" : "sit"} size={120} />
      <h1>{headline}</h1>
      <p className="lede">{body}</p>
      <div className="star-row" aria-label={`${session.stars} stars`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= session.stars ? "star on" : "star"}>
            ★
          </span>
        ))}
      </div>
      <div className="stat-grid">
        <div>
          <b>{formatWpm(session.wpm)}</b>
          <span>words / min</span>
        </div>
        <div>
          <b>{formatAccuracy(session.accuracy)}</b>
          <span>accuracy</span>
        </div>
        <div>
          <b>{session.correct}</b>
          <span>correct keys</span>
        </div>
        <div>
          <b>{round0(session.durationMs / 1000)}s</b>
          <span>time</span>
        </div>
      </div>
      {weak.length > 0 && (
        <p className="weak">
          Practice next:{" "}
          {weak.map(([k, n]) => `${displayKeyLabel(k)} (${n})`).join(" · ")}
        </p>
      )}
      <div className="row-actions">
        <button className="btn ghost" onClick={() => dispatch({ type: "go", view: { name: "map" } })}>
          Map
        </button>
        <button className="btn ghost" onClick={() => dispatch({ type: "go", view: { name: "lesson", lessonId } })}>
          Try again
        </button>
        {session.passed && next && (
          <button className="btn primary" onClick={() => dispatch({ type: "go", view: { name: "lesson", lessonId: next } })}>
            Next trail
          </button>
        )}
        {session.passed && !next && (
          <button className="btn primary" onClick={() => dispatch({ type: "go", view: { name: "map" } })}>
            You finished Keytrail
          </button>
        )}
      </div>
    </div>
  );
}
