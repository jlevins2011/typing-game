import type { Coat } from "../types";

const COATS: Record<Coat, { body: string; belly: string; ear: string; shade: string }> = {
  ember: { body: "#e07a3d", belly: "#f7d7b5", ear: "#c45c26", shade: "#a8481c" },
  snow: { body: "#efe6d6", belly: "#fffaf2", ear: "#d9c4a8", shade: "#c4b49a" },
  dusk: { body: "#6b5b7a", belly: "#d9cce6", ear: "#4a3c58", shade: "#3a2e46" },
  moss: { body: "#6f8f4e", belly: "#dce8c8", ear: "#4f6b34", shade: "#3d5428" },
};

export function Pip({
  coat = "ember",
  pose = "idle",
  size = 96,
}: {
  coat?: Coat;
  pose?: "idle" | "run" | "stumble" | "celebrate" | "sit" | "jump" | "fall";
  size?: number;
}) {
  const c = COATS[coat];
  return (
    <svg
      className={`pip pip-${pose}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="108" rx="28" ry="6" fill="rgba(0,0,0,0.18)" />
      <g className="pip-body">
        <path d="M86 78 C108 70 112 92 96 100 C90 86 86 84 86 78Z" fill={c.body} />
        <circle className="pip-lantern" cx="102" cy="98" r="9" fill="#f4c14e" />
        <circle cx="102" cy="98" r="4" fill="#fff6d4" />
        <ellipse cx="58" cy="78" rx="28" ry="22" fill={c.body} />
        <ellipse cx="58" cy="84" rx="16" ry="12" fill={c.belly} />
        <g className="pip-leg pip-leg-l">
          <rect x="42" y="92" width="8" height="16" rx="4" fill={c.shade} />
        </g>
        <g className="pip-leg pip-leg-r">
          <rect x="64" y="92" width="8" height="16" rx="4" fill={c.ear} />
        </g>
        <circle cx="62" cy="46" r="22" fill={c.body} />
        <ellipse cx="74" cy="52" rx="12" ry="8" fill={c.body} />
        <ellipse cx="80" cy="54" rx="8" ry="5" fill={c.belly} />
        <path d="M44 32 L36 8 L56 28Z" fill={c.ear} />
        <path d="M72 26 L90 6 L84 32Z" fill={c.ear} />
        <path d="M46 30 L40 14 L54 28Z" fill="#f3b6c4" />
        <path d="M74 26 L88 10 L82 32Z" fill="#f3b6c4" />
        <circle cx="56" cy="44" r="3.2" fill="#1a1714" />
        <circle cx="70" cy="42" r="3.2" fill="#1a1714" />
        <circle cx="57" cy="43" r="1" fill="#fff" />
        <circle cx="71" cy="41" r="1" fill="#fff" />
        <ellipse cx="84" cy="54" rx="4.5" ry="3" fill="#c45c26" />
        <path d="M84 57 Q78 64 68 60" fill="none" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export const COAT_OPTIONS: { id: Coat; name: string }[] = [
  { id: "ember", name: "Ember" },
  { id: "snow", name: "Snow" },
  { id: "dusk", name: "Dusk" },
  { id: "moss", name: "Moss" },
];
