import React, { useState, useRef, useEffect } from "react";

function Player({ songs = [] }) {
  const API = process.env.REACT_APP_API_URL?.replace(/\/$/, "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);

  const play = () => audioRef.current?.play();
  const pause = () => audioRef.current?.pause();

  const next = () => {
    if (!songs.length) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  };

  const prev = () => {
    if (!songs.length) return;
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  };

  useEffect(() => {
    if (audioRef.current && songs.length > 0) {
      audioRef.current.load();
    }
  }, [currentIndex, songs]);

  if (!songs.length) {
    return <div>No songs available</div>;
  }

  return (
    <div className="player">
      <h2>{songs[currentIndex]}</h2>

      <audio
        ref={audioRef}
        src={`${API}/music/${songs[currentIndex]}`}
        controls
      />

      <div className="controls">
        <button onClick={prev}>Prev</button>
        <button onClick={play}>Play</button>
        <button onClick={pause}>Pause</button>
        <button onClick={next}>Next</button>
      </div>
    </div>
  );
}

export default Player;