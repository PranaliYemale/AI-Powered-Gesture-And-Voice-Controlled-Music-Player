import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const API = process.env.REACT_APP_API_URL;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      alert("Signup successful!");
      navigate("/login");

    } catch (err) {
      console.error("Signup error:", err);
      alert("Backend not reachable");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Signup</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p>
          Already have an account?{" "}
          <span
            style={{ color: "#6c63ff", cursor: "pointer" }}
            onClick={() => navigate("/login")}
          >
            Login here
          </span>
        </p>

        <button onClick={handleSignup}>
          {loading ? "Signing up..." : "Signup"}
        </button>
      </div>
    </div>
  );
}

export default Signup;