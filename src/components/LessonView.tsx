import { useEffect, useMemo, useRef, useState } from "react";
import { getLesson, WORLDS } from "../data/curriculum";
import { FINGER_META, displayKeyLabel, fingerForKey } from "../data/keyboard";
import { sounds, unlockAudio } from "../lib/audio";
import { applyKey, createSnapshot, liveStats } from "../lib/engine";
import { buildPrompt } from "../lib/prompts";
import { formatAccuracy, formatWpm } from "../lib/wpm";
import { useActiveChild, useStore } from "../store/StoreContext";
import { AdventureScene } from "./AdventureScene";
import { Hands } from "./Hands";
import { Keyboard } from "./Keyboard";
import { Pip } from "./Pip";

function PromptChars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) =>
        ch === " " ? (
          <span key={i} className="gap">
            ·
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}

export function LessonView({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId);
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const [seed] = useState(() => `${Date.now()}`);
  const [started, setStarted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [guideStep, setGuideStep] = useState(0);
  const prompt = useMemo(() => (lesson ? buildPrompt(lesson, seed) : ""), [lesson, seed]);
  const [snap, setSnap] = useState(() => createSnapshot(prompt));
  const recorded = useRef(false);

  useEffect(() => {
    setSnap(createSnapshot(prompt));
    recorded.current = false;
  }, [prompt]);

  useEffect(() => {
    if (!started || snap.finished) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [started, snap.finished]);

  useEffect(() => {
    if (!lesson || !started || snap.finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "go", view: { name: "map" } });
        return;
      }
      if (e.key.length === 1 || e.key === " ") e.preventDefault();
      const next = applyKey(snap, e.key, Date.now(), lesson.lenientCase);
      if (next === snap) return;
      if (state.settings.sound) {
        if (next.lastWasError) sounds.miss();
        else if (next.combo > 0 && next.combo % 10 === 0) sounds.combo();
        else sounds.correct();
      }
      setSnap(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, started, snap, dispatch, state.settings.sound]);

  useEffect(() => {
    if (!lesson || lesson.kind === "guide" || !snap.finished || !started) return;
    if (recorded.current) return;
    recorded.current = true;
    const { durationMs } = liveStats(snap, Date.now());
    dispatch({
      type: "record-session",
      lessonId: lesson.id,
      durationMs: Math.max(durationMs, 400),
      correct: snap.correct,
      errors: snap.errors,
      keyErrors: snap.keyErrors,
      finished: true,
    });
  }, [snap.finished, started, lesson, dispatch, snap.correct, snap.errors, snap.keyErrors]);

  useEffect(() => {
    if (lesson?.kind !== "guide" || !started) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (guideStep === 1 && k.toLowerCase() === "f") {
        e.preventDefault();
        setGuideStep(2);
        if (state.settings.sound) sounds.correct();
      } else if (guideStep === 2 && k.toLowerCase() === "j") {
        e.preventDefault();
        setGuideStep(3);
        if (state.settings.sound) sounds.correct();
      } else if (guideStep === 3 && k === " ") {
        e.preventDefault();
        setGuideStep(4);
        if (state.settings.sound) sounds.star();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, started, guideStep, state.settings.sound]);

  if (!lesson || !child) return null;
  const world = WORLDS.find((w) => w.id === lesson.worldId);
  const stats = liveStats(snap, now);
  const expected = snap.prompt[snap.index] ?? "";
  const finger = fingerForKey(expected);
  const progress = snap.prompt.length ? snap.index / snap.prompt.length : 0;
  const showAdventure = lesson.kind === "adventure" || lesson.kind === "exam";

  function begin() {
    unlockAudio();
    if (state.settings.sound) sounds.start();
    setStarted(true);
    if (lesson?.kind === "guide") setGuideStep(1);
  }

  function finishGuide() {
    if (!lesson) return;
    dispatch({
      type: "record-session",
      lessonId: lesson.id,
      durationMs: 8000,
      correct: 3,
      errors: 0,
      keyErrors: {},
      finished: true,
    });
  }

  return (
    <div className="screen lesson-screen">
      <header className="lesson-top">
        <button className="text-back" onClick={() => dispatch({ type: "go", view: { name: "map" } })}>
          ← Map
        </button>
        <div>
          <p className="eyebrow">
            Lesson {lesson.number} · {world?.name}
          </p>
          <h1>{lesson.title}</h1>
        </div>
        {started && lesson.kind !== "guide" && (
          <div className="hud">
            <span>
              <b>{formatWpm(stats.wpm)}</b> WPM
            </span>
            <span>
              <b>{formatAccuracy(stats.accuracy)}</b>
            </span>
            <span>
              combo <b>{snap.combo}</b>
            </span>
          </div>
        )}
      </header>

      {!started && (
        <div className="panel intro">
          <Pip coat={child.coat} pose="sit" size={110} />
          <p>{lesson.intro}</p>
          <p className="tip">{lesson.tip}</p>
          {lesson.kind === "exam" ? (
            <p className="goal">
              Proficiency gate: {lesson.goals.accuracy}% accuracy and {lesson.goals.wpm}+ WPM.
            </p>
          ) : (
            <p className="goal">
              Open the next trail at {lesson.goals.accuracy}% accuracy. Extra stars for {lesson.starWpm[0]} and{" "}
              {lesson.starWpm[1]} WPM.
            </p>
          )}
          <Hands focus={lesson.fingerFocus} />
          <button className="btn primary" onClick={begin}>
            {lesson.kind === "guide" ? "Place my hands" : "I’m ready"}
          </button>
        </div>
      )}

      {started && lesson.kind === "guide" && (
        <div className="panel intro">
          {guideStep === 1 && (
            <>
              <h2>Find the bumps</h2>
              <p>Curl both hands over the keyboard. Left pointer on F, right pointer on J. Press F.</p>
              <Hands focus={["li"]} />
              <Keyboard highlight="f" homeOnly error={false} />
            </>
          )}
          {guideStep === 2 && (
            <>
              <h2>Nice. Now J.</h2>
              <p>Right pointer stays on its bump. Press J.</p>
              <Hands focus={["ri"]} />
              <Keyboard highlight="j" homeOnly />
            </>
          )}
          {guideStep === 3 && (
            <>
              <h2>Thumbs on the big key</h2>
              <p>Let your thumbs rest on the space bar. Press space.</p>
              <Hands focus={["thumbs"]} />
              <Keyboard highlight=" " homeOnly />
            </>
          )}
          {guideStep === 4 && (
            <>
              <h2>Home row is yours</h2>
              <p>Pinkies, rings, middles, and pointers each own a home key. This stance is the whole game.</p>
              <Hands />
              <Keyboard homeOnly />
              <button className="btn primary" onClick={finishGuide}>
                Light the first lantern
              </button>
            </>
          )}
        </div>
      )}

      {started && lesson.kind !== "guide" && (
        <>
          {showAdventure ? (
            <AdventureScene
              progress={progress}
              combo={snap.combo}
              stumble={snap.lastWasError}
              coat={child.coat}
              mood={world?.mood ?? "day"}
              finished={snap.finished}
            />
          ) : (
            <div className="mini-trail">
              <Pip coat={child.coat} pose={snap.lastWasError ? "stumble" : snap.index ? "run" : "idle"} size={100} />
              <div className="mini-bar">
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}

          <div className={`prompt ${snap.lastWasError ? "is-miss" : ""}`}>
            <span className="done">
              <PromptChars text={snap.prompt.slice(0, snap.index)} />
            </span>
            <span className={`caret ${expected === " " ? "space-caret" : ""}`}>
              {expected === " " ? "SPACE" : expected}
            </span>
            <span className="todo">
              <PromptChars text={snap.prompt.slice(snap.index + 1)} />
            </span>
          </div>

          {finger && (
            <p className="finger-hint">
              <span className="swatch" style={{ background: FINGER_META[finger].color }} />
              {expected === " "
                ? "Press SPACE with a thumb"
                : `${FINGER_META[finger].label} · ${displayKeyLabel(expected)}`}
            </p>
          )}

          {state.settings.showKeyboard && (
            <Keyboard highlight={expected} error={snap.lastWasError} homeOnly={lesson.worldId === "home-camp"} />
          )}
        </>
      )}
    </div>
  );
}
