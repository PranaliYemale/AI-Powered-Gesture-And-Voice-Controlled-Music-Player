import React from "react";

function Player({ songs, currentIndex }) {

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
        src={currentSong?.url}
      />

      <div style={{ marginTop: 10 }}>
        {currentSong?.name}
      </div>
    </div>
  );
}

export default Player;