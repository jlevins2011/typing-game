import type { Coat, World } from "../types";
import { Pip } from "./Pip";

const TREES = [8, 14, 22, 31, 39, 48, 56, 64, 73, 81, 90];

export function AdventureScene({
  progress,
  combo,
  stumble,
  coat,
  mood,
  finished,
}: {
  progress: number;
  combo: number;
  stumble: boolean;
  coat: Coat;
  mood: World["mood"];
  finished: boolean;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const world = 2400;
  const pipX = 80 + p * (world - 280);
  const camera = Math.min(Math.max(pipX - 160, 0), world - 720);
  const pose = finished ? "celebrate" : stumble ? "stumble" : p > 0 ? "run" : "idle";
  const gloom = Math.max(0, 0.45 - combo * 0.02 - p * 0.2);

  return (
    <div className={`trail mood-${mood} ${stumble ? "is-stumble" : ""}`}>
      <div className="trail-sky" />
      <div className="gloom" style={{ opacity: finished ? 0 : gloom }} />
      <div className="trail-world" style={{ width: world, transform: `translateX(${-camera}px)` }}>
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
        <div className="pip-slot" style={{ left: pipX }}>
          <Pip coat={coat} pose={pose} size={108} />
        </div>
        <div className="camp" />
      </div>
    </div>
  );
}
