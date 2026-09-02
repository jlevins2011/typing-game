import { WORLDS, lessonsInWorld } from "../data/curriculum";
import { isLessonUnlocked, progressPercent, recommendedLessonId, totalStars, maxStars } from "../lib/stats";
import { useActiveChild, useStore } from "../store/StoreContext";
import { Pip } from "./Pip";

export function TrailMap() {
  const { dispatch } = useStore();
  const child = useActiveChild();
  if (!child) return null;
  const rec = recommendedLessonId(child);

  return (
    <div className="screen map-screen">
      <header className="map-top">
        <button className="text-back" onClick={() => dispatch({ type: "go", view: { name: "profiles" } })}>
          ← Explorers
        </button>
        <div className="map-who">
          <Pip coat={child.coat} pose="idle" size={64} />
          <div>
            <h1>{child.name}’s trail</h1>
            <p>
              {progressPercent(child)}% lit · {totalStars(child)}/{maxStars()} stars
            </p>
          </div>
        </div>
        <button
          className="btn primary"
          onClick={() => dispatch({ type: "go", view: { name: "lesson", lessonId: rec } })}
        >
          Continue
        </button>
        <button className="btn ghost" onClick={() => dispatch({ type: "go", view: { name: "settings" } })}>
          Settings
        </button>
      </header>

      <div className="worlds">
        {WORLDS.map((world) => {
          const lessons = lessonsInWorld(world.id);
          return (
            <section key={world.id} className={`world mood-${world.mood}`}>
              <header>
                <h2>{world.name}</h2>
                <p>{world.subtitle}</p>
              </header>
              <ol className="nodes">
                {lessons.map((lesson) => {
                  const record = child.completedLessons[lesson.id];
                  const unlocked = isLessonUnlocked(child, lesson.id);
                  const stars = record?.stars ?? 0;
                  return (
                    <li key={lesson.id}>
                      <button
                        className={`node ${unlocked ? "is-open" : "is-locked"} ${rec === lesson.id ? "is-next" : ""} ${stars ? "is-done" : ""}`}
                        disabled={!unlocked}
                        onClick={() => dispatch({ type: "go", view: { name: "lesson", lessonId: lesson.id } })}
                      >
                        <span className="node-num">{lesson.number}</span>
                        <span className="node-title">{lesson.title}</span>
                        <span className="node-tease">{unlocked ? lesson.tease : "Locked"}</span>
                        <span className="node-stars">{stars ? "★".repeat(stars) + "☆".repeat(3 - stars) : unlocked ? "☆☆☆" : "🔒"}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
