import { useEffect, useMemo, useRef, useState } from "react";
import { getLesson, WORLDS } from "../data/curriculum";
import { FINGER_META, displayKeyLabel, fingerForKey } from "../data/keyboard";
import { sounds, unlockAudio } from "../lib/audio";
import { applyKey, createSnapshot, liveStats } from "../lib/engine";
import { buildPrompt } from "../lib/prompts";
import { advanceRun, createRun, runRulesFor, trailLayout, type RunEvent } from "../lib/run";
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

function playRunEvents(events: RunEvent[], soundOn: boolean) {
  if (!soundOn) return;
  for (const event of events) {
    if (event.type === "jump" && event.ok) sounds.jump();
    if (event.type === "jump" && !event.ok) sounds.fall();
    if (event.type === "power" || (event.type === "pickup" && event.kind === "glow")) sounds.power();
    if (event.type === "dead") sounds.fall();
  }
}

export function LessonView({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId);
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const [seed] = useState(() => `${Date.now()}`);
  const [started, setStarted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [guideStep, setGuideStep] = useState(0);
  const [jumping, setJumping] = useState(false);
  const prompt = useMemo(() => (lesson ? buildPrompt(lesson, seed) : ""), [lesson, seed]);
  const rules = useMemo(() => (lesson ? runRulesFor(lesson) : null), [lesson]);
  const layout = useMemo(() => (rules ? trailLayout(rules.mode) : trailLayout("story")), [rules]);
  const [snap, setSnap] = useState(() => createSnapshot(prompt));
  const [run, setRun] = useState(() =>
    createRun({
      mode: "story",
      lives: 99,
      jumpCombo: 0,
      powerWpm: 0,
      gloomPerError: 0,
      gloomPerTick: 0,
    }),
  );
  const recorded = useRef(false);
  const jumpTimer = useRef<number | null>(null);

  useEffect(() => {
    setSnap(createSnapshot(prompt));
    recorded.current = false;
    if (rules) setRun(createRun(rules));
    setJumping(false);
  }, [prompt, rules]);

  useEffect(() => {
    if (!started || snap.finished || run.dead) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [started, snap.finished, run.dead]);

  useEffect(() => {
    if (!lesson || !rules || !started || snap.finished || run.dead) return;
    if (rules.mode !== "action") return;
    const stats = liveStats(snap, now);
    const progress = snap.prompt.length ? snap.index / snap.prompt.length : 0;
    const { run: next, events } = advanceRun(run, progress, progress, {
      combo: snap.combo,
      wpm: stats.wpm,
      justMissed: false,
      tick: true,
      rules,
      layout,
    });
    if (events.length || next.gloom !== run.gloom || next.dead) {
      playRunEvents(events, state.settings.sound);
      setRun(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick from `now` only
  }, [now]);

  useEffect(() => {
    if (!lesson || !rules || !started || snap.finished || run.dead) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "go", view: { name: "map" } });
        return;
      }
      if (e.key.length === 1 || e.key === " ") e.preventDefault();
      const nextSnap = applyKey(snap, e.key, Date.now(), lesson.lenientCase);
      if (nextSnap === snap) return;
      const from = snap.prompt.length ? snap.index / snap.prompt.length : 0;
      const to = nextSnap.prompt.length ? nextSnap.index / nextSnap.prompt.length : 0;
      const stats = liveStats(nextSnap, Date.now());
      const { run: nextRun, events } = advanceRun(run, from, to, {
        combo: nextSnap.combo,
        wpm: stats.wpm,
        justMissed: nextSnap.lastWasError,
        tick: false,
        rules,
        layout,
      });
      if (state.settings.sound) {
        if (nextSnap.lastWasError) sounds.miss();
        else if (nextSnap.combo > 0 && nextSnap.combo % 10 === 0) sounds.combo();
        else sounds.correct();
      }
      playRunEvents(events, state.settings.sound);
      if (events.some((event) => event.type === "jump" && event.ok)) {
        if (jumpTimer.current) window.clearTimeout(jumpTimer.current);
        setJumping(true);
        jumpTimer.current = window.setTimeout(() => setJumping(false), 420);
      }
      setSnap(nextSnap);
      setRun(nextRun);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, rules, layout, started, snap, run, dispatch, state.settings.sound]);

  useEffect(() => {
    if (!lesson || lesson.kind === "guide" || !started || recorded.current) return;
    const done = snap.finished || run.dead;
    if (!done) return;
    recorded.current = true;
    const delay = run.dead ? 900 : 200;
    const { durationMs } = liveStats(snap, Date.now());
    const id = window.setTimeout(() => {
      dispatch({
        type: "record-session",
        lessonId: lesson.id,
        durationMs: Math.max(durationMs, 400),
        correct: snap.correct,
        errors: snap.errors,
        keyErrors: snap.keyErrors,
        finished: snap.finished && !run.dead,
        survived: !run.dead,
      });
    }, delay);
    return () => window.clearTimeout(id);
  }, [snap.finished, run.dead, started, lesson, dispatch, snap.correct, snap.errors, snap.keyErrors, snap]);

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

  if (!lesson || !child || !rules) return null;
  const world = WORLDS.find((w) => w.id === lesson.worldId);
  const stats = liveStats(snap, now);
  const expected = snap.prompt[snap.index] ?? "";
  const finger = fingerForKey(expected);
  const typingProgress = snap.prompt.length ? snap.index / snap.prompt.length : 0;
  const guideProgress = guideStep <= 1 ? 0 : Math.min(1, (guideStep - 1) / 3);
  const progress = lesson.kind === "guide" ? guideProgress : typingProgress;

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
      survived: true,
    });
  }

  const scene = (
    <AdventureScene
      progress={progress}
      combo={snap.combo}
      stumble={snap.lastWasError && !run.dead}
      coat={child.coat}
      mood={world?.mood ?? "day"}
      finished={lesson.kind === "guide" ? guideStep >= 4 : snap.finished && !run.dead}
      run={run}
      layout={layout}
      jumping={jumping}
      mode={rules.mode}
    />
  );

  return (
    <div className="screen lesson-screen">
      <header className="lesson-top">
        <button className="text-back" onClick={() => dispatch({ type: "go", view: { name: "map" } })}>
          ← Map
        </button>
        <div>
          <p className="eyebrow">
            Lesson {lesson.number} · {world?.name}
            {rules.mode === "action" ? " · action trail" : ""}
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
              Proficiency gate: {lesson.goals.accuracy}% accuracy and {lesson.goals.wpm}+ WPM. Watch the gloom and the
              jumps.
            </p>
          ) : rules.mode === "action" ? (
            <p className="goal">
              Reach camp with lives left. Combo {rules.jumpCombo}+ or about {rules.powerWpm} WPM to jump gaps. Glow
              berries help. Finish at {lesson.goals.accuracy}% accuracy.
            </p>
          ) : lesson.starWpm[1] <= 0 ? (
            <p className="goal">
              Walk Pip to camp at {lesson.goals.accuracy}% accuracy — take your time. Finishing earns all three stars.
            </p>
          ) : lesson.starWpm[0] <= 0 ? (
            <p className="goal">
              Walk Pip to camp at {lesson.goals.accuracy}% accuracy for two stars. Three stars at {lesson.starWpm[1]}{" "}
              WPM.
            </p>
          ) : (
            <p className="goal">
              Walk Pip to camp at {lesson.goals.accuracy}% accuracy. Extra stars for {lesson.starWpm[0]} and{" "}
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
        <>
          {scene}
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
                <p>Pinkies, rings, middles, and pointers each own a home key. This stance is the whole game. Pip is at camp.</p>
                <Hands />
                <Keyboard homeOnly />
                <button className="btn primary" onClick={finishGuide}>
                  Light the first lantern
                </button>
              </>
            )}
          </div>
        </>
      )}

      {started && lesson.kind !== "guide" && (
        <>
          {scene}

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

          {finger && !run.dead && (
            <p className="finger-hint">
              <span className="swatch" style={{ background: FINGER_META[finger].color }} />
              {expected === " "
                ? "Press SPACE with a thumb"
                : `${FINGER_META[finger].label} · ${displayKeyLabel(expected)}`}
            </p>
          )}

          {state.settings.showKeyboard && !run.dead && (
            <Keyboard highlight={expected} error={snap.lastWasError} homeOnly={lesson.worldId === "home-camp"} />
          )}
        </>
      )}
    </div>
  );
}
