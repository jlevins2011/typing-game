import { describe, expect, it } from "vitest";
import { getLesson } from "../data/curriculum";
import {
  advanceRun,
  createRun,
  crossed,
  runRulesFor,
  trailLayout,
  trailModeFor,
} from "./run";
import { evaluateLesson, createSnapshot } from "./engine";

describe("trail modes", () => {
  it("uses a story trail for drills and an action trail for adventures", () => {
    const drill = getLesson("left-f");
    const adventure = getLesson("ridge-trail");
    if (!drill || !adventure) throw new Error("missing lessons");
    expect(trailModeFor(drill)).toBe("story");
    expect(trailModeFor(adventure)).toBe("action");
    expect(runRulesFor(adventure).lives).toBe(3);
    expect(runRulesFor(getLesson("home-trail")!).lives).toBe(4);
  });
});

describe("advanceRun", () => {
  it("always collects pickups on a story trail", () => {
    const lesson = getLesson("left-f")!;
    const rules = runRulesFor(lesson);
    const layout = trailLayout(rules.mode);
    let run = createRun(rules);
    const pickup = layout.pickups[0];
    const result = advanceRun(run, pickup.at - 0.01, pickup.at + 0.01, {
      combo: 1,
      wpm: 0,
      justMissed: false,
      tick: false,
      rules,
      layout,
    });
    expect(result.run.collected).toContain(pickup.id);
    expect(result.events.some((e) => e.type === "pickup")).toBe(true);
  });

  it("clears a gap with combo or power, and falls without them", () => {
    const lesson = getLesson("ridge-trail")!;
    const rules = runRulesFor(lesson);
    const layout = trailLayout("action");
    const gap = layout.gaps[0];
    const hop = advanceRun(createRun(rules), gap.at - 0.02, gap.at + 0.01, {
      combo: rules.jumpCombo,
      wpm: 0,
      justMissed: false,
      tick: false,
      rules,
      layout,
    });
    expect(hop.events).toContainEqual({ type: "jump", ok: true, gapId: gap.id });
    expect(hop.run.lives).toBe(rules.lives);

    const fall = advanceRun(createRun(rules), gap.at - 0.02, gap.at + 0.01, {
      combo: 0,
      wpm: 0,
      justMissed: false,
      tick: false,
      rules,
      layout,
    });
    expect(fall.events.some((e) => e.type === "jump" && e.ok === false)).toBe(true);
    expect(fall.run.lives).toBe(rules.lives - 1);
  });

  it("ends the run when lives run out", () => {
    const lesson = getLesson("ridge-trail")!;
    const rules = { ...runRulesFor(lesson), lives: 1 };
    const layout = trailLayout("action");
    const gap = layout.gaps[0];
    let run = createRun(rules);
    run = { ...run, lives: 1 };
    const result = advanceRun(run, gap.at - 0.02, gap.at, {
      combo: 0,
      wpm: 0,
      justMissed: false,
      tick: false,
      rules,
      layout,
    });
    expect(result.run.dead).toBe(true);
    expect(result.run.deadReason).toBe("gap");
  });

  it("lets a glow power-up save a jump", () => {
    const lesson = getLesson("ridge-trail")!;
    const rules = runRulesFor(lesson);
    const layout = trailLayout("action");
    const run = { ...createRun(rules), powered: true };
    const gap = layout.gaps[0];
    const result = advanceRun(run, gap.at - 0.02, gap.at, {
      combo: 0,
      wpm: 0,
      justMissed: false,
      tick: false,
      rules,
      layout,
    });
    expect(result.events).toContainEqual({ type: "jump", ok: true, gapId: gap.id });
    expect(result.run.powered).toBe(false);
  });
});

describe("crossed", () => {
  it("fires once when progress passes a mark", () => {
    expect(crossed(0.2, 0.3, 0.25)).toBe(true);
    expect(crossed(0.3, 0.4, 0.25)).toBe(false);
  });
});

describe("evaluateLesson survival", () => {
  it("fails an adventure if Pip did not survive", () => {
    const lesson = getLesson("ridge-trail")!;
    const snap = { ...createSnapshot("x"), finished: true, correct: 80, errors: 2 };
    const ok = evaluateLesson(lesson, snap, 20_000);
    expect(ok.passed).toBe(true);
    const ko = evaluateLesson(lesson, snap, 20_000, { survived: false });
    expect(ko.passed).toBe(false);
    expect(ko.stars).toBe(0);
  });
});
