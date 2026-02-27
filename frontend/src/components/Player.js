import React, { useState, useEffect } from "react";

function Player({ songs }) {
  const API = process.env.REACT_APP_API_URL || "";
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/api/state`)
        .then((res) => res.json())
        .then((data) => {
          if (data.current_index !== undefined) {
            setCurrentIndex(data.current_index);
          }
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [API]);

  if (!songs || songs.length === 0) {
    return <div>No songs available</div>;
  }

  const currentSong = songs[currentIndex];

  return (
    <div>
      <h3>🎵 Now Playing</h3>

      <audio
        key={currentIndex}
        controls
        autoPlay
        style={{ width: "100%" }}
        src={currentSong?.url}   // ✅ FIXED
      />

      <div style={{ marginTop: 10 }}>
        {currentSong?.name}      // ✅ FIXED
      </div>
    </div>
  );
}

export default Player;