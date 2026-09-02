import { FINGER_META } from "../data/keyboard";
import type { FingerId } from "../types";

function Finger({ id, active }: { id: FingerId; active: boolean }) {
  const color = FINGER_META[id].color;
  return (
    <span className={`finger ${active ? "is-active" : ""}`} style={{ background: color }} />
  );
}

export function Hands({ focus = [] }: { focus?: FingerId[] }) {
  const on = (id: FingerId) => !focus.length || focus.includes(id);
  return (
    <div className="hands" aria-hidden="true">
      <div className="hand">
        <div className="palm left-palm">
          <Finger id="lp" active={on("lp")} />
          <Finger id="lr" active={on("lr")} />
          <Finger id="lm" active={on("lm")} />
          <Finger id="li" active={on("li")} />
          <span className="thumb-wrap">
            <Finger id="thumbs" active={on("thumbs")} />
          </span>
        </div>
        <p>Left</p>
      </div>
      <div className="hand">
        <div className="palm right-palm">
          <span className="thumb-wrap">
            <Finger id="thumbs" active={on("thumbs")} />
          </span>
          <Finger id="ri" active={on("ri")} />
          <Finger id="rm" active={on("rm")} />
          <Finger id="rr" active={on("rr")} />
          <Finger id="rp" active={on("rp")} />
        </div>
        <p>Right</p>
      </div>
    </div>
  );
}
