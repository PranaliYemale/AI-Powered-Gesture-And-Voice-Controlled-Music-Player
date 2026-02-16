import React, { useState, useRef, useEffect } from "react";

function Player({ songs }) {
  const API = process.env.REACT_APP_API_URL;

  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);

  // Play / Pause functions
  const play = () => audioRef.current?.play();
  const pause = () => audioRef.current?.pause();

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  };

  // Auto-play when currentIndex changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {}); // in case auto-play blocked
    }
  }, [currentIndex]);

  return (
    <div className="player">
      {songs.length > 0 && (
        <>
          <h2>{songs[currentIndex]}</h2>

          <audio ref={audioRef} controls>
            <source src={`${API}/music/${songs[currentIndex]}`} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>

          <div className="controls">
            <button onClick={prev}>Prev</button>
            <button onClick={play}>Play</button>
            <button onClick={pause}>Pause</button>
            <button onClick={next}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Player;