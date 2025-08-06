// src/Login.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  function handleSubmit(e) {
    e.preventDefault();
    // simple hardcoded login; replace with your logic
    if (user === "admin" && pass === "password") {
      localStorage.setItem("shorts_loggedin", "true");
      // Redirect to originally requested page or home
      let to = location.state?.from || "/";
      navigate(to, { replace: true });
    } else {
      alert("Invalid credentials");
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", background: "#111" }}>
      <form onSubmit={handleSubmit} style={{ background: "#222", padding: 32, borderRadius: 12, color: "#fff" }}>
        <h2 style={{ marginBottom: 24 }}>Login</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Username"
            value={user}
            onChange={e => setUser(e.target.value)}
            style={{ padding: 8, borderRadius: 6, width: 200, border: "none", marginBottom: 12 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            style={{ padding: 8, borderRadius: 6, width: 200, border: "none" }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 22px", borderRadius: 6, border: "none", background: "#33b6ff", color: "#fff", fontWeight: 600 }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;

