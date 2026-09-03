import { useState, type FormEvent } from "react";
import { hashPin } from "../lib/storage";
import { useStore } from "../store/StoreContext";

export function ParentGate() {
  const { state, dispatch } = useStore();
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const setting = !state.parentPin;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (setting) {
      if (!/^\d{4}$/.test(pin)) {
        setError("Use four numbers.");
        return;
      }
      if (pin !== again) {
        setError("Those PINs did not match.");
        return;
      }
      dispatch({ type: "set-pin", pin });
      dispatch({ type: "go", view: { name: "parent" } });
      return;
    }
    if (hashPin(pin) !== state.parentPin) {
      setError("That PIN is not right.");
      setPin("");
      return;
    }
    dispatch({ type: "go", view: { name: "parent" } });
  }

  return (
    <div className="screen parent-gate">
      <button className="text-back" onClick={() => dispatch({ type: "go", view: { name: "title" } })}>
        ← Back
      </button>
      <h1>{setting ? "Make a parent PIN" : "Parent reports"}</h1>
      <p className="lede">
        {setting
          ? "This keeps curious explorers out of the progress charts. Pick four digits you will remember."
          : "Enter your four-digit PIN to see speed, accuracy, and time practiced."}
      </p>
      <form className="panel form" onSubmit={submit}>
        <label>
          PIN
          <input
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </label>
        {setting && (
          <label>
            Type it again
            <input
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={again}
              onChange={(e) => setAgain(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit">
          {setting ? "Save PIN" : "Open reports"}
        </button>
        {!setting && (
          <button
            type="button"
            className="text-back"
            onClick={() => {
              dispatch({ type: "clear-pin" });
              setPin("");
              setError("PIN cleared. Make a new one.");
            }}
          >
            Forgot PIN? Reset it on this device.
          </button>
        )}
      </form>
    </div>
  );
}
