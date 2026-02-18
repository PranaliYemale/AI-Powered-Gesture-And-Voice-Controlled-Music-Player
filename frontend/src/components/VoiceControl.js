import React, { useState } from "react";

const API = process.env.REACT_APP_API_URL || "";

const VoiceControl = () => {
  const [listening, setListening] = useState(false);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";

  const startListening = () => {
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognition.stop();
    setListening(false);
  };

  recognition.onresult = (event) => {
    const command =
      event.results[event.results.length - 1][0].transcript.toLowerCase();

    console.log("Command:", command);

    if (command.includes("play")) {
      fetch(`${API}/api/play`, { method: "POST" });
    }

    if (command.includes("pause")) {
      fetch(`${API}/api/pause`, { method: "POST" });
    }

    if (command.includes("next")) {
      fetch(`${API}/api/next`, { method: "POST" });
    }

    if (command.includes("previous")) {
      fetch(`${API}/api/prev`, { method: "POST" });
    }
  };

  return (
    <div>
      <button onClick={startListening}>🎤 Start Voice</button>
      <button onClick={stopListening}>🛑 Stop Voice</button>
      <p>{listening ? "Listening..." : "Not Listening"}</p>
    </div>
  );
};

export default VoiceControl;