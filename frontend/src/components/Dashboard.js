import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GestureControl from "./GestureControl";
import Player from "./Player";
import VoiceControl from "./VoiceControl";

function Dashboard() {
  const API = process.env.REACT_APP_API_URL || "";

  const [mode, setMode] = useState("local");
  const [status, setStatus] = useState("stopped");
  const [songs, setSongs] = useState([]); // always array
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gestureOn, setGestureOn] = useState(false);

  const navigate = useNavigate();

  console.log("API URL:", API);

  // ✅ Fetch songs safely
  useEffect(() => {
    if (mode === "local") {
      fetch(`${API}/api/songs`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Songs API response:", data);

          // 🔥 IMPORTANT FIX
          if (Array.isArray(data)) {
            setSongs(data);
          } else {
            setSongs([]);
          }
        })
        .catch((err) => {
          console.error("Songs fetch error:", err);
          setSongs([]);
        });
    }
  }, [mode, API]);

  // Poll state every 5 sec
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/api/state`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setCurrentIndex(data.current_index ?? 0);
            setStatus(data.status ?? "stopped");
            setMode(data.mode ?? "local");
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [API]);

  const playSelectedSong = async (index) => {
    try {
      const res = await fetch(`${API}/api/play_index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });

      const data = await res.json();

      if (data && !data.error) {
        setCurrentIndex(data.current_index ?? index);
        setStatus(data.status ?? "playing");
      } else {
        console.error("Play index error:", data.error);
      }
    } catch (err) {
      console.error("Error playing song:", err);
    }
  };

  const btn = (name, api, red = false) => (
    <button
      className={`btn ${red ? "btn-red" : ""}`}
      onClick={async () => {
        try {
          const res = await fetch(`${API}${api}`, { method: "POST" });
          const data = await res.json();

          if (api === "/api/play" || api === "/api/pause") {
            setStatus(data.status ?? status);
          }
        } catch (err) {
          console.error("Error:", err);
        }
      }}
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
        </div>
      </div>

      {/* Player */}
      <div className="glass" style={{ marginTop: 15 }}>
        <Player songs={songs} currentIndex={currentIndex} status={status} />
      </div>

      {/* Local Song List */}
      {mode === "local" && (
        <div className="glass" style={{ marginTop: 15 }}>
          <h3>Local Songs</h3>

          {/* 🔥 SAFE MAP FIX */}
          {Array.isArray(songs) && songs.length > 0 ? (
            <select
              value={currentIndex}
              onChange={(e) =>
                playSelectedSong(Number(e.target.value))
              }
            >
              {songs.map((s, i) => (
                <option key={i} value={i}>
                  {i === currentIndex ? "▶ " : ""} {s.name}
                </option>
              ))}
            </select>
          ) : (
            <p>No songs available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;