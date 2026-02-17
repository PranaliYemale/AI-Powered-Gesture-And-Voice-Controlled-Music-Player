import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoiceStatus from "./VoiceStatus";
import VoiceHelp from "./VoiceHelp";
import GestureControl from "./GestureControl";

function Dashboard() {
  const API = process.env.REACT_APP_API_URL;

  const [mode, setMode] = useState("local");
  const [status, setStatus] = useState("Stopped");
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [gesture, setGesture] = useState(false);

  const navigate = useNavigate();

  // Fetch songs
  useEffect(() => {
    fetch(`${API}/api/songs`)
      .then(res => res.json())
      .then(data => setSongs(data.songs || []))
      .catch(() => {});
  }, [API]);

  // Poll state
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/api/state`)
        .then(res => res.json())
        .then(data => {
          setCurrentIndex(data.current_index ?? 0);
          setStatus(data.status ?? "Stopped");
          setMode(data.mode ?? "local");
          setLikes(data.likes ?? 0);
          setDislikes(data.dislikes ?? 0);
          setGesture(data.gesture ?? false);
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [API]);

  const playSelectedSong = (index) => {
    fetch(`${API}/api/play_index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
  };

  const btn = (name, api) => (
    <button
      className="btn"
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
    <div style={{ padding: 20 }}>
      <button className="btn btn-red" onClick={handleLogout}>
        Logout
      </button>

      <h1>🎧 Smart Music Player</h1>

      <VoiceStatus />

      <div className="glass">
        <b>Mode:</b> {mode.toUpperCase()}
        <br />
        <b>Status:</b> {status}
        <br />
        <b>Gesture:</b> {gesture ? "Active 🟢" : "Stopped 🔴"}

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

        <div style={{ marginTop: 10 }}>
          ❤️ Likes: {likes} | 💔 Dislikes: {dislikes}
        </div>

        <div style={{ marginTop: 25 }}>
          <h3>🖐 Gesture Control</h3>
          <GestureControl />
        </div>
      </div>

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

      <VoiceHelp />
    </div>
  );
}

export default Dashboard;