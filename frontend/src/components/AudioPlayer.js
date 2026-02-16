import { useRef } from "react";

function AudioPlayer({ songUrl }) {
  const audioRef = useRef(null);

  return (
    <div>
      <audio ref={audioRef} src={songUrl} controls />
      <button onClick={() => audioRef.current.play()}>Play</button>
      <button onClick={() => audioRef.current.pause()}>Pause</button>
    </div>
  );
}

export default AudioPlayer;