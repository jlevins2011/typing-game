import { unlockAudio } from "../lib/audio";
import { useStore } from "../store/StoreContext";
import { Pip } from "./Pip";

export function TitleScreen() {
  const { state, dispatch } = useStore();
  return (
    <div className="screen title-screen">
      <div className="fireflies" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="firefly" style={{ ["--i" as string]: i }} />
        ))}
      </div>
      <header className="title-hero">
        <Pip coat="ember" pose="sit" size={140} />
        <p className="eyebrow">An original typing adventure</p>
        <h1>Keytrail</h1>
        <p className="lede">Type to light the path. Pip the lantern fox needs your hands — one finger, one key, all the way to Night Summit.</p>
        <div className="title-actions">
          <button
            className="btn primary"
            onClick={() => {
              unlockAudio();
              dispatch({ type: "go", view: { name: "profiles" } });
            }}
          >
            {state.children.length ? "Play" : "Start adventure"}
          </button>
          <button className="btn ghost" onClick={() => dispatch({ type: "go", view: { name: "parent-gate" } })}>
            Parent reports
          </button>
        </div>
      </header>
      <ul className="title-points">
        <li>Begins with home-row hand position</li>
        <li>Speed moves Pip; misses make Pip stumble</li>
        <li>Words per minute and accuracy on every run</li>
        <li>PIN-protected reports for grown-ups</li>
      </ul>
    </div>
  );
}
