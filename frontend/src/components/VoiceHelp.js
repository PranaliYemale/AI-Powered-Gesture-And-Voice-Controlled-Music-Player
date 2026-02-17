import React from "react";

export default function VoiceHelp() {
  return (
    <div className="voice-help">

      <h3>🎙 Voice Commands</h3>

      <ul>
        <li>▶ kiki play song</li>
        <li>⏸ kiki stop song</li>
        <li>⏭ kiki next song</li>
        <li>⏮ kiki previous song</li>
      </ul>

      <h4>System Commands</h4>

      <ul>
        <li>🎤 player start listening</li>
        <li>⛔ player stop listening</li>
      </ul>

      <p>💡 Tip: Speak clearly after saying kiki</p>

    </div>
  );
}