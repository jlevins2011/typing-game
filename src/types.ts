export type FingerId =
  | "lp"
  | "lr"
  | "lm"
  | "li"
  | "thumbs"
  | "ri"
  | "rm"
  | "rr"
  | "rp";

export type Coat = "ember" | "snow" | "dusk" | "moss";

export type LessonKind = "guide" | "drill" | "words" | "adventure" | "exam";

export type Stage = "beginner" | "developing" | "fluent" | "proficient";

export type View =
  | { name: "title" }
  | { name: "profiles" }
  | { name: "map" }
  | { name: "lesson"; lessonId: string }
  | { name: "results"; lessonId: string; sessionId: string }
  | { name: "parent-gate" }
  | { name: "parent" }
  | { name: "settings" };

export type LessonGoals = {
  accuracy: number;
  wpm: number;
};

export type Lesson = {
  id: string;
  worldId: string;
  number: number;
  title: string;
  tease: string;
  kind: LessonKind;
  keys: string;
  newKeys: string;
  fingerFocus: FingerId[];
  lenientCase: boolean;
  promptChars: number;
  goals: LessonGoals;
  starWpm: [number, number];
  intro: string;
  tip: string;
};

export type World = {
  id: string;
  name: string;
  subtitle: string;
  mood: "dawn" | "day" | "dusk" | "fire" | "night";
};

export type LessonRecord = {
  stars: number;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
  completedAt: number;
};

export type Session = {
  id: string;
  childId: string;
  lessonId: string;
  startedAt: number;
  durationMs: number;
  wpm: number;
  accuracy: number;
  errors: number;
  correct: number;
  charsTyped: number;
  keyErrors: Record<string, number>;
  stars: number;
  passed: boolean;
};

export type Child = {
  id: string;
  name: string;
  coat: Coat;
  createdAt: number;
  completedLessons: Record<string, LessonRecord>;
  sessions: Session[];
};

export type Settings = {
  sound: boolean;
  highContrast: boolean;
  showKeyboard: boolean;
};

export type StoreData = {
  version: 1;
  parentPin: string | null;
  children: Child[];
  activeChildId: string | null;
  settings: Settings;
};

export type TypingSnapshot = {
  prompt: string;
  index: number;
  startedAt: number | null;
  correct: number;
  errors: number;
  keyErrors: Record<string, number>;
  combo: number;
  bestCombo: number;
  lastWasError: boolean;
  finished: boolean;
};
