import React from "react";

export default function VoiceHelp() {
  return (
    <div className="voice-help">

      <h3>🎙 Voice Commands</h3>

      <ul>
        <li>▶ player play song</li>
        <li>⏸ player stop song</li>
        <li>⏭ player next song</li>
        <li>⏮ player previous song</li>

        <li>🎧 player spotify play</li>
        <li>❤️ player spotify stop</li>
        <li>❤️ player spotify previous song</li>
        <li>❤️ player spotify next song</li>

        <li>⛔ player stop listening</li>
      </ul>

      <p>💡 Tip: Speak clearly after saying player</p>

    </div>
  );
}
