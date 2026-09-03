import type { Lesson } from "../types";

export type TrailMode = "story" | "action";

export type PickupKind = "berry" | "glow";

export type Gap = { id: string; at: number; width: number };
export type Pickup = { id: string; at: number; kind: PickupKind };

export type TrailLayout = {
  gaps: Gap[];
  pickups: Pickup[];
};

export type RunRules = {
  mode: TrailMode;
  lives: number;
  jumpCombo: number;
  powerWpm: number;
  gloomPerError: number;
  gloomPerTick: number;
};

export type RunSnapshot = {
  lives: number;
  maxLives: number;
  powered: boolean;
  collected: string[];
  clearedGaps: string[];
  failedGaps: string[];
  gloom: number;
  dead: boolean;
  deadReason: "gap" | "gloom" | null;
};

export type RunEvent =
  | { type: "jump"; ok: boolean; gapId: string }
  | { type: "pickup"; id: string; kind: PickupKind }
  | { type: "life"; lives: number; reason: "gap" | "gloom" }
  | { type: "dead"; reason: "gap" | "gloom" }
  | { type: "power" };

export function trailModeFor(lesson: Lesson): TrailMode {
  return lesson.kind === "adventure" || lesson.kind === "exam" ? "action" : "story";
}

export function runRulesFor(lesson: Lesson): RunRules {
  const mode = trailModeFor(lesson);
  if (mode === "story") {
    return {
      mode,
      lives: 99,
      jumpCombo: 0,
      powerWpm: 0,
      gloomPerError: 0,
      gloomPerTick: 0,
    };
  }
  const tier =
    lesson.worldId === "home-camp"
      ? 0
      : lesson.worldId === "high-ridge"
        ? 1
        : lesson.worldId === "riverbed"
          ? 2
          : lesson.worldId === "campfire"
            ? 3
            : 4;
  return {
    mode,
    lives: tier === 0 ? 4 : 3,
    jumpCombo: 3 + tier,
    powerWpm: Math.max(8, lesson.starWpm[0] - 4),
    gloomPerError: 0.035 + tier * 0.012,
    gloomPerTick: 0.003 + tier * 0.002,
  };
}

export function trailLayout(mode: TrailMode): TrailLayout {
  if (mode === "story") {
    return {
      gaps: [],
      pickups: [
        { id: "s1", at: 0.22, kind: "berry" },
        { id: "s2", at: 0.48, kind: "glow" },
        { id: "s3", at: 0.74, kind: "berry" },
      ],
    };
  }
  return {
    gaps: [
      { id: "gap-1", at: 0.26, width: 0.045 },
      { id: "gap-2", at: 0.5, width: 0.05 },
      { id: "gap-3", at: 0.74, width: 0.055 },
    ],
    pickups: [
      { id: "berry-1", at: 0.14, kind: "berry" },
      { id: "glow-1", at: 0.38, kind: "glow" },
      { id: "berry-2", at: 0.62, kind: "berry" },
      { id: "glow-2", at: 0.86, kind: "glow" },
    ],
  };
}

export function createRun(rules: RunRules): RunSnapshot {
  return {
    lives: rules.lives,
    maxLives: rules.lives,
    powered: false,
    collected: [],
    clearedGaps: [],
    failedGaps: [],
    gloom: -0.18,
    dead: false,
    deadReason: null,
  };
}

export function crossed(from: number, to: number, at: number): boolean {
  return from < at && to >= at;
}

function hurt(run: RunSnapshot, reason: "gap" | "gloom", events: RunEvent[]): RunSnapshot {
  const lives = run.lives - 1;
  events.push({ type: "life", lives, reason });
  if (lives <= 0) {
    events.push({ type: "dead", reason });
    return { ...run, lives: 0, dead: true, deadReason: reason, powered: false };
  }
  return {
    ...run,
    lives,
    powered: false,
    gloom: Math.min(run.gloom, -0.08),
  };
}

export function advanceRun(
  run: RunSnapshot,
  from: number,
  to: number,
  input: {
    combo: number;
    wpm: number;
    justMissed: boolean;
    tick: boolean;
    rules: RunRules;
    layout: TrailLayout;
  },
): { run: RunSnapshot; events: RunEvent[] } {
  if (run.dead) return { run, events: [] };
  const events: RunEvent[] = [];
  let next: RunSnapshot = { ...run, collected: [...run.collected], clearedGaps: [...run.clearedGaps], failedGaps: [...run.failedGaps] };
  const { rules, layout } = input;
  const progress = Math.min(1, Math.max(0, to));

  if (rules.mode === "action") {
    if (input.justMissed) {
      next.gloom += rules.gloomPerError;
      if (next.powered) {
        next.powered = false;
        next.gloom -= rules.gloomPerError * 0.7;
      }
    }
    if (input.tick) {
      const slow = input.wpm > 0 && input.wpm < rules.powerWpm * 0.55;
      next.gloom += slow ? rules.gloomPerTick * 1.8 : rules.gloomPerTick;
    }
    if (progress > 0.08 && next.gloom >= progress) {
      next = hurt(next, "gloom", events);
      if (next.dead) return { run: next, events };
    }
  }

  for (const gap of layout.gaps) {
    if (next.clearedGaps.includes(gap.id) || next.failedGaps.includes(gap.id)) continue;
    if (!crossed(from, progress, gap.at)) continue;
    const canJump =
      rules.mode === "story" ||
      next.powered ||
      input.combo >= rules.jumpCombo ||
      input.wpm >= rules.powerWpm;
    if (canJump) {
      next.clearedGaps.push(gap.id);
      next.powered = false;
      events.push({ type: "jump", ok: true, gapId: gap.id });
    } else {
      next.failedGaps.push(gap.id);
      events.push({ type: "jump", ok: false, gapId: gap.id });
      next = hurt(next, "gap", events);
      if (next.dead) return { run: next, events };
    }
  }

  for (const pickup of layout.pickups) {
    if (next.collected.includes(pickup.id)) continue;
    if (!crossed(from, progress, pickup.at)) continue;
    const fastEnough =
      rules.mode === "story" ||
      next.powered ||
      input.combo >= Math.max(4, rules.jumpCombo - 1) ||
      input.wpm >= rules.powerWpm * 0.75;
    if (!fastEnough) continue;
    next.collected.push(pickup.id);
    events.push({ type: "pickup", id: pickup.id, kind: pickup.kind });
    if (pickup.kind === "berry") {
      next.lives = Math.min(next.maxLives, next.lives + 1);
    } else {
      next.powered = true;
      events.push({ type: "power" });
    }
  }

  return { run: next, events };
}
