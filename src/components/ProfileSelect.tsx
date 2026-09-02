import { useState } from "react";
import { useStore } from "../store/StoreContext";
import type { Coat } from "../types";
import { COAT_OPTIONS, Pip } from "./Pip";

export function ProfileSelect() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState("");
  const [coat, setCoat] = useState<Coat>("ember");
  const [adding, setAdding] = useState(state.children.length === 0);

  return (
    <div className="screen profiles">
      <button className="text-back" onClick={() => dispatch({ type: "go", view: { name: "title" } })}>
        ← Back
      </button>
      <h1>Who is exploring?</h1>
      <p className="lede">Each kid gets a fox, a trail map, and their own speed history.</p>

      {state.children.length > 0 && !adding && (
        <div className="profile-grid">
          {state.children.map((child) => (
            <button
              key={child.id}
              className="profile-card"
              onClick={() => dispatch({ type: "select-child", id: child.id })}
            >
              <Pip coat={child.coat} pose="idle" size={88} />
              <strong>{child.name}</strong>
            </button>
          ))}
          <button className="profile-card add" onClick={() => setAdding(true)}>
            <span className="plus">+</span>
            <strong>Add explorer</strong>
          </button>
        </div>
      )}

      {(adding || state.children.length === 0) && (
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: "add-child", name, coat });
            setName("");
            setAdding(false);
          }}
        >
          <label>
            First name
            <input
              autoFocus
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pip’s friend"
            />
          </label>
          <p className="label">Fox coat</p>
          <div className="coat-row">
            {COAT_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                className={`coat-pick ${coat === opt.id ? "is-on" : ""}`}
                onClick={() => setCoat(opt.id)}
              >
                <Pip coat={opt.id} pose="sit" size={72} />
                {opt.name}
              </button>
            ))}
          </div>
          <div className="row-actions">
            {state.children.length > 0 && (
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
            )}
            <button className="btn primary" type="submit" disabled={!name.trim()}>
              Let’s go
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
