import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api"; // correct path apne project ke hisaab se

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await API.post("/signup", {
        username,
        email,
        password,
      });

      alert(res.data.message || "Signup successful!");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      alert(err.response?.data?.error || "Signup failed!");
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