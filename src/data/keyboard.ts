import type { FingerId } from "../types";

export const FINGER_META: Record<
  FingerId,
  { label: string; short: string; hand: "left" | "right" | "both"; color: string }
> = {
  lp: { label: "left pinky", short: "L pinky", hand: "left", color: "#e07a9b" },
  lr: { label: "left ring", short: "L ring", hand: "left", color: "#e09b4e" },
  lm: { label: "left middle", short: "L middle", hand: "left", color: "#7ec8a3" },
  li: { label: "left pointer", short: "L pointer", hand: "left", color: "#6eb5e0" },
  thumbs: { label: "thumbs", short: "thumbs", hand: "both", color: "#c4b5a0" },
  ri: { label: "right pointer", short: "R pointer", hand: "right", color: "#7e9ae0" },
  rm: { label: "right middle", short: "R middle", hand: "right", color: "#b07ee0" },
  rr: { label: "right ring", short: "R ring", hand: "right", color: "#e07a3d" },
  rp: { label: "right pinky", short: "R pinky", hand: "right", color: "#e0c36e" },
};

/** Standard QWERTY touch-typing map. Public-domain pedagogy, not a licensed method. */
export const KEY_FINGER: Record<string, FingerId> = {
  "`": "lp",
  "~": "lp",
  "1": "lp",
  "!": "lp",
  q: "lp",
  a: "lp",
  z: "lp",
  "2": "lr",
  "@": "lr",
  w: "lr",
  s: "lr",
  x: "lr",
  "3": "lm",
  "#": "lm",
  e: "lm",
  d: "lm",
  c: "lm",
  "4": "li",
  $: "li",
  r: "li",
  f: "li",
  v: "li",
  "5": "li",
  "%": "li",
  t: "li",
  g: "li",
  b: "li",
  "6": "ri",
  "^": "ri",
  y: "ri",
  h: "ri",
  n: "ri",
  "7": "ri",
  "&": "ri",
  u: "ri",
  j: "ri",
  m: "ri",
  "8": "rm",
  "*": "rm",
  i: "rm",
  k: "rm",
  ",": "rm",
  "<": "rm",
  "9": "rr",
  "(": "rr",
  o: "rr",
  l: "rr",
  ".": "rr",
  ">": "rr",
  "0": "rp",
  ")": "rp",
  p: "rp",
  ";": "rp",
  ":": "rp",
  "/": "rp",
  "?": "rp",
  "-": "rp",
  _: "rp",
  "=": "rp",
  "+": "rp",
  "[": "rp",
  "{": "rp",
  "]": "rp",
  "}": "rp",
  "\\": "rp",
  "|": "rp",
  "'": "rp",
  '"': "rp",
  " ": "thumbs",
};

export const HOME_KEYS = ["a", "s", "d", "f", "j", "k", "l", ";"] as const;

export const KEYBOARD_ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

export function fingerForKey(char: string): FingerId | null {
  if (char === " ") return "thumbs";
  const lower = char.toLowerCase();
  return KEY_FINGER[char] ?? KEY_FINGER[lower] ?? null;
}

export function displayKeyLabel(char: string): string {
  if (char === " ") return "Space";
  if (char === ";") return ";";
  return char.length === 1 ? char.toUpperCase() : char;
}
