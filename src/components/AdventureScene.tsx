import type { Coat, World } from "../types";
import type { RunSnapshot, TrailLayout, TrailMode } from "../lib/run";
import { Pip } from "./Pip";

const TREES = [8, 14, 22, 31, 39, 48, 56, 64, 73, 81, 90];
const WORLD = 2400;

export function AdventureScene({
  progress,
  combo,
  stumble,
  coat,
  mood,
  finished,
  run,
  layout,
  jumping,
  mode,
}: {
  progress: number;
  combo: number;
  stumble: boolean;
  coat: Coat;
  mood: World["mood"];
  finished: boolean;
  run: RunSnapshot;
  layout: TrailLayout;
  jumping: boolean;
  mode: TrailMode;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const pipX = 80 + p * (WORLD - 280);
  const gloomX = 80 + Math.max(-0.12, run.gloom) * (WORLD - 280);
  const camera = Math.min(Math.max(pipX - 180, 0), WORLD - 720);
  const pose = run.dead
    ? "fall"
    : finished
      ? "celebrate"
      : jumping
        ? "jump"
        : stumble
          ? "stumble"
          : p > 0
            ? "run"
            : "idle";
  const gloomWash = mode === "action" ? Math.max(0, 0.2 + run.gloom * 0.35 - p * 0.15) : Math.max(0, 0.28 - combo * 0.015 - p * 0.18);

  return (
    <div
      className={`trail mood-${mood} ${stumble ? "is-stumble" : ""} ${run.powered ? "is-powered" : ""} ${run.dead ? "is-ko" : ""}`}
    >
      <div className="trail-sky" />
      <div className="gloom" style={{ opacity: finished || run.dead ? 0.15 : gloomWash }} />
      {mode === "action" && (
        <div className="lives" aria-label={`${run.lives} lives`}>
          {Array.from({ length: run.maxLives }).map((_, i) => (
            <span key={i} className={i < run.lives ? "heart on" : "heart"}>
              ♥
            </span>
          ))}
          {run.powered && <span className="power-chip">glow</span>}
        </div>
      )}
      <div className="trail-world" style={{ width: WORLD, transform: `translateX(${-camera}px)` }}>
        <div className="hills" />
        {TREES.map((t, i) => (
          <span key={i} className={`tree t${i % 3}`} style={{ left: `${t}%` }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const at = (i + 1) / 9;
          const lit = p >= at;
          return <span key={i} className={`ground-lantern ${lit ? "is-lit" : ""}`} style={{ left: `${12 + at * 76}%` }} />;
        })}
        <div className="path" />
        {layout.gaps.map((gap) => (
          <span
            key={gap.id}
            className={`gap-pit ${run.clearedGaps.includes(gap.id) ? "is-cleared" : ""} ${run.failedGaps.includes(gap.id) ? "is-failed" : ""}`}
            style={{ left: `${gap.at * 100}%`, width: `${Math.max(2.4, gap.width * 100)}%` }}
          />
        ))}
        {layout.pickups.map((item) => {
          const got = run.collected.includes(item.id);
          const missed = !got && p > item.at + 0.02;
          return (
            <span
              key={item.id}
              className={`pickup pickup-${item.kind} ${got ? "is-got" : ""} ${missed ? "is-missed" : ""}`}
              style={{ left: `${item.at * 100}%` }}
            />
          );
        })}
        {mode === "action" && (
          <div className="gloom-chaser" style={{ left: gloomX }} aria-hidden="true">
            <span />
          </div>
        )}
        <div className={`pip-slot ${jumping ? "is-jumping" : ""} ${run.dead ? "is-falling" : ""}`} style={{ left: pipX }}>
          <Pip coat={coat} pose={pose} size={108} />
        </div>
        <div className="camp" />
      </div>
      {run.dead && (
        <p className="ko-banner">{run.deadReason === "gap" ? "Pip missed a jump!" : "The gloom caught Pip!"}</p>
      )}
    </div>
  );
}
