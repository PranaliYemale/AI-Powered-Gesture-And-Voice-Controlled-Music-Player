import React, { useState } from "react";

function GestureControl() {
  const API = process.env.REACT_APP_API_URL;

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const startGesture = async () => {
    try {
      setLoading(true);
      await fetch(`${API}/api/gesture/start`, { method: "POST" });
      setRunning(true);
    } catch (err) {
      console.error("Start gesture error:", err);
      alert("Failed to start gesture control");
    } finally {
      setLoading(false);
    }
  };

  const stopGesture = async () => {
    try {
      setLoading(true);
      await fetch(`${API}/api/gesture/stop`, { method: "POST" });
      setRunning(false);
    } catch (err) {
      console.error("Stop gesture error:", err);
      alert("Failed to stop gesture control");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <p>
        Status:{" "}
        <b style={{ color: running ? "#4caf50" : "#ff5252" }}>
          {running ? "Running" : "Stopped"}
        </b>
      </p>

      {!running ? (
        <button className="btn" onClick={startGesture} disabled={loading}>
          🖐 Start Gesture
        </button>
      ) : (
        <button
          className="btn btn-red"
          onClick={stopGesture}
          disabled={loading}
        >
          ✋ Stop Gesture
        </button>
      )}
    </div>
  );
}

export default GestureControl;