import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoiceStatus from "./VoiceStatus";
import VoiceHelp from "./VoiceHelp";
import GestureControl from "./GestureControl";
import Player from "./Player";

function Dashboard() {
  const API = process.env.REACT_APP_API_URL;

  const [mode, setMode] = useState("local");
  const [status, setStatus] = useState("Stopped");
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gestureOn, setGestureOn] = useState(false); // ⭐ NEW

  const navigate = useNavigate();
  console.log("API URL:", API);

  // fetch songs
  useEffect(() => {
    if (mode === "local") {
      fetch(`${API}/api/songs`)
        .then((res) => res.json())
        .then((data) => setSongs(data.songs || []))
        .catch((err) => console.error("Songs fetch error:", err));
    }
  }, [mode, API]);

  // poll state (5 sec ⭐)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/api/state`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setCurrentIndex(data.current_index ?? 0);
            setStatus(data.status ?? "Stopped");
            setMode(data.mode ?? "local");
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [API]);

  const playSelectedSong = (index) => {
    fetch(`${API}/api/play_index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
  };

  const btn = (name, api, red = false) => (
    <button
      className={`btn ${red ? "btn-red" : ""}`}
      onClick={() => fetch(`${API}${api}`, { method: "POST" })}
    >
      {name}
    </button>
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ padding: 20, position: "relative" }}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button className="btn btn-red" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <h1>🎧 Smart Music Player</h1>

      <VoiceStatus />

      <div className="glass">
        <b>Mode:</b> {mode.toUpperCase()}

        <div style={{ marginTop: 10 }}>
          <b>Status:</b> {status}
        </div>

        <div style={{ marginTop: 15 }}>
          {btn("▶ Play", "/api/play")}
          {btn("⏸ Pause", "/api/pause")}
          {btn("⏭ Next", "/api/next")}
          {btn("⏮ Prev", "/api/prev")}
          {btn("🔊 Vol+", "/api/volume_up")}
          {btn("🔉 Vol-", "/api/volume_down")}
          {btn("👍 Like", "/api/like")}
          {btn("👎 Dislike", "/api/dislike")}
        </div>

        {/* ⭐ GESTURE */}
        <div style={{ marginTop: 25 }}>
          <h3>🖐 Gesture Control</h3>

          <button
            className="btn"
            onClick={() => {
              fetch(`${API}/api/gesture/start`, { method: "POST" });
              setGestureOn(true);
            }}
          >
            Start Gesture
          </button>

          <button
            className="btn btn-red"
            onClick={() => {
              fetch(`${API}/api/gesture/stop`, { method: "POST" });
              setGestureOn(false);
            }}
          >
            Stop Gesture
          </button>

          {gestureOn && <GestureControl />}
        </div>
      </div>

      {/* PLAYER */}
      <div className="glass" style={{ marginTop: 15 }}>
        <Player songs={songs} />
      </div>

      {/* SONG LIST */}
      {mode === "local" && (
        <div className="glass" style={{ marginTop: 15 }}>
          <h3>Local Songs</h3>
          <select
            value={currentIndex}
            onChange={(e) => playSelectedSong(Number(e.target.value))}
          >
            {songs.map((s, i) => (
              <option key={i} value={i}>
                {i === currentIndex ? "▶ " : ""} {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <VoiceHelp />
    </div>
  );
}

export default Dashboard;