import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const API = process.env.REACT_APP_API_URL;

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_or_username: emailOrUsername,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("user_id", data.user_id);
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Backend not reachable");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Login</h2>

        <input
          placeholder="Email or Username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "10px" }}>
          New user?{" "}
          <span
            style={{ color: "#6c63ff", cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign Up here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;