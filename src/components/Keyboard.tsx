import { FINGER_META, KEYBOARD_ROWS, fingerForKey } from "../data/keyboard";

export function Keyboard({
  highlight,
  homeOnly,
  error,
}: {
  highlight?: string;
  homeOnly?: boolean;
  error?: boolean;
}) {
  const rows = homeOnly ? [KEYBOARD_ROWS[2]] : KEYBOARD_ROWS;
  const expected = highlight?.length ? highlight : "";
  return (
    <div className={`kb ${homeOnly ? "kb-home" : ""}`} aria-hidden="true">
      {rows.map((row, i) => (
        <div className="kb-row" key={i} style={{ marginLeft: homeOnly ? 0 : i * 12 }}>
          {row.map((key) => {
            const finger = fingerForKey(key);
            const active = expected.toLowerCase() === key || (expected === " " && key === "space");
            return (
              <span
                key={key}
                className={`kb-key ${active ? "is-active" : ""} ${error && active ? "is-error" : ""}`}
                style={{ ["--finger" as string]: finger ? FINGER_META[finger].color : "#889" }}
              >
                {key === ";" ? ";" : key.toUpperCase()}
              </span>
            );
          })}
        </div>
      ))}
      <div className="kb-row kb-space-row">
        <span
          className={`kb-key kb-space ${expected === " " ? "is-active" : ""} ${error && expected === " " ? "is-error" : ""}`}
          style={{ ["--finger" as string]: FINGER_META.thumbs.color }}
        >
          space
        </span>
      </div>
    </div>
  );
}
