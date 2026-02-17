import React, { useState, useRef, useEffect } from "react";

function Player({ songs }) {
  const API = process.env.REACT_APP_API_URL?.replace(/\/$/, "");
  const audioRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  // sync with backend state
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/api/state`)
        .then(res => res.json())
        .then(data => {
          if (data.current_index !== undefined) {
            setCurrentIndex(data.current_index);
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [API]);

  useEffect(() => {
    if (audioRef.current && songs.length > 0) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, songs]);

  if (songs.length === 0) return null;

  return (
    <div className="player">
      <h3>Now Playing: {songs[currentIndex]}</h3>

      <audio
        ref={audioRef}
        src={`${API}/music/${songs[currentIndex]}`}
        controls
      />
    </div>
  );
}

export default Player;