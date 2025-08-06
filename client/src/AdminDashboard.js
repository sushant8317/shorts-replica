// AdminDashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";

const HOST = "https://shorts-t2dk.onrender.com";

// ============= LOGIN FORM COMPONENT =============
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setStatus('');
    axios.post(HOST + "/admin/login", { email, password })
      .then(res => {
        localStorage.setItem("adminToken", res.data.token);
        onLogin();
      })
      .catch(() => setStatus("Wrong email or password!"));
  }

  return (
    <form onSubmit={handleSubmit} style={{margin:"100px auto",maxWidth:350,padding:40,background:"#222",borderRadius:16}}>
      <h2 style={{color:"#fff"}}>Admin Login</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Gmail" required style={{width:"100%",padding:8,marginBottom:10}} />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" required style={{width:"100%",padding:8,marginBottom:20}} />
      {status && <div style={{color:"#f66",marginBottom:10}}>{status}</div>}
      <button type="submit" style={{width:"100%",padding:10,background:"#3079ed",color:"#fff",fontWeight:700,border:0,borderRadius:7}}>Sign In</button>
    </form>
  )
}

// ============= BYTES UTILITY =============
function bytesToSize(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return Math.round((bytes / Math.pow(1024, i)) * 10) / 10 + " " + sizes[i];
}

// ============= MAIN DASHBOARD =============
export default function AdminDashboard() {
  const [shorts, setShorts] = useState([]);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [editState, setEditState] = useState({});
  const [scrollCounts, setScrollCounts] = useState({});
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("adminToken"));

  // Force logout on certain failures
  function handleLogout() {
    localStorage.removeItem("adminToken");
    setLoggedIn(false);
  }

  // Helper to add auth header if logged in
  function authHeaders() {
    const token = localStorage.getItem("adminToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  // Fetch all videos (and scroll/view counts)
  const refreshShorts = () => {
    axios
      .get(HOST + "/shorts")
      .then((res) => setShorts(res.data))
      .catch(() => setStatus("Could not fetch shorts."));

    // Fetch scroll/view counts (if you use a /views endpoint)
    axios.get(HOST + "/views")
      .then(res => setScrollCounts(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    if (loggedIn) refreshShorts();
    // eslint-disable-next-line
  }, [loggedIn]);

  // UPLOAD
  const handleUpload = (e) => {
    e.preventDefault();
    if (!video) { setStatus("Please select a file!"); return; }
    setUploading(true); setUploadProgress(0); setStatus("");
    const formData = new FormData();
    formData.append("video", video);

    axios
      .post(HOST + "/upload", formData, {
        headers: {
          ...authHeaders()
        },
        onUploadProgress: progressEvent => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      })
      .then(() => {
        setVideo(null);
        setStatus("Upload Successful!");
        setUploadProgress(0);
        refreshShorts();
      })
      .catch((err) => {
        setUploading(false);
        setUploadProgress(0);
        if (err.response && err.response.status === 401) {
          setStatus("Login expired. Please log in again.");
          handleLogout();
        } else if (err.response && err.response.status === 413) {
          setStatus("Upload Failed: File too large.");
        } else {
          setStatus("Upload Failed: " + (err.message || ""));
        }
        console.error("Upload error:", err);
      })
      .finally(() => setUploading(false));
  };

  // DELETE
  const handleDelete = (filename) => {
    if (!window.confirm("Delete this video permanently?")) return;
    axios
      .delete(`${HOST}/delete/${filename}`, {
        headers: { ...authHeaders() }
      })
      .then(() =>
        setShorts((prev) => prev.filter((s) => s.filename !== filename))
      )
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setStatus("Login expired. Please log in again.");
          handleLogout();
        } else {
          alert("Delete failed!");
        }
      });
  };

  // Caption EDIT
  const handleCaptionChange = (filename, value) => {
    setEditState((prev) => ({
      ...prev,
      [filename]: { ...prev[filename], caption: value, saved: false, error: null },
    }));
  };

  const saveCaption = (filename, origCaption) => {
    const caption = (editState[filename]?.caption || "").trim();
    if (caption === (origCaption || "")) return;
    setEditState((prev) => ({
      ...prev,
      [filename]: { ...prev[filename], loading: true, error: null },
    }));

    axios
      .patch(`${HOST}/shorts/${filename}`, { caption }, { headers: { ...authHeaders() } })
      .then(() => {
        setShorts((current) =>
          current.map((video) =>
            video.filename === filename ? { ...video, caption } : video
          )
        );
        setEditState((prev) => ({
          ...prev,
          [filename]: { ...prev[filename], loading: false, saved: true, error: null },
        }));
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setStatus("Login expired. Please log in again.");
          handleLogout();
        } else {
          setEditState((prev) => ({
            ...prev,
            [filename]: { ...prev[filename], loading: false, error: "Failed to save" },
          }));
        }
      });
  };

  const totalSize = shorts.reduce(
    (sum, v) => sum + (v.size ? Number(v.size) : 0),
    0
  );

  // Require login
  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#181C23",
        display: "flex",
        flexDirection: "row",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* LEFT: Upload/meta/file list */}
      <div
        style={{
          flex: "0 0 340px",
          padding: "32px 18px",
          background: "linear-gradient(180deg, #0a1d4c 70%, #1a1529 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <button onClick={handleLogout} style={{
          position:"absolute", top:18, right:22, zIndex:100,
          background:"#FE5555", color:"#fff", fontWeight:800, border:"none", borderRadius:8, padding:"7px 13px", cursor:"pointer"
        }}>Logout</button>
        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop:24 }}>
          <label
            htmlFor="upload"
            style={{
              background: "#47A3F3",
              color: "#fff",
              fontWeight: 600,
              fontSize: 18,
              padding: "12px 22px",
              borderRadius: 8,
              cursor: "pointer",
              display: "inline-block",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Upload Video
            <input
              id="upload"
              type="file"
              accept="video/mp4"
              style={{ display: "none" }}
              onChange={(e) => setVideo(e.target.files[0])}
            />
          </label>
          <button
            type="submit"
            disabled={uploading || !video}
            style={{
              background: uploading ? "#333" : "#0bb259",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              border: "none",
              borderRadius: 5,
              padding: "8px 0",
              cursor: uploading || !video ? "wait" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Submit"}
          </button>
          {uploadProgress > 0 && (
            <div style={{width: '100%', background: '#333', borderRadius: 8, marginTop: 10, position:'relative'}}>
              <div style={{
                width: `${uploadProgress}%`,
                height: 18, background: '#3eeaa7', borderRadius: 8,
                transition: "width 0.17s"
              }} />
              <div style={{
                position: "absolute", color: "#000", fontWeight: 700,
                fontSize: 15, left: 8, top: 1
              }}>
                {uploadProgress}%
              </div>
            </div>
          )}
          {status && (
            <div
              style={{
                background: status.includes("Success") ? "#0f0" : "#f33",
                color: "#000",
                padding: "4px 0",
                borderRadius: 4,
                textAlign: "center",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {status}
            </div>
          )}
        </form>
        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: "bold" }}>
            No. of videos: <span style={{ color: "#22d3ee" }}>{shorts.length}</span>
          </div>
          <div>
            File size:{" "}
            <span style={{ color: "#22d3ee" }}>
              {totalSize ? bytesToSize(totalSize) : "N/A"}
            </span>
          </div>
        </div>
        {/* File List */}
        <div
          style={{
            background: "#111116",
            padding: 16,
            borderRadius: 10,
            boxShadow: "0 2px 12px #0002",
            minHeight: 150,
            maxHeight: 330,
            overflowY: "auto",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#fff" }}>
            Uploaded Files
          </div>
          {shorts.length === 0 ? (
            <div style={{ color: "#aaa", textAlign: "center", fontSize: 14 }}>
              No videos uploaded yet.
            </div>
          ) : shorts.map((s, i) => {
            const filename = s.filename;
            return (
              <div
                key={filename}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: i === shorts.length - 1 ? "none" : "1px solid #23223c",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: "#abe",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordBreak: "break-all",
                    maxWidth: 150,
                  }}
                >
                  {filename}
                </span>
                <span style={{
                  fontSize: 13,
                  color: "#fff9",
                  margin: "0 8px",
                }}>
                  {s.size ? bytesToSize(Number(s.size)) : ""}
                </span>
                <button
                  type="button"
                  style={{
                    background: "#e11d48",
                    color: "#fff",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: 4,
                    fontSize: 13,
                    padding: "2px 9px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDelete(filename)}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Editable video list with view scroll counter */}
      <div
        style={{
          flex: 1,
          margin: "36px 24px 36px 0",
          background: "#000",
          borderRadius: 18,
          boxShadow: "0 6px 16px #0003",
          padding: "24px 0 24px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: 22,
            color: "#8cd9ff",
            marginBottom: 18,
          }}
        >
          Scrollable Videos
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 30,
          }}
        >
          {shorts.length === 0 && (
            <div
              style={{
                color: "#888",
                textAlign: "center",
                marginTop: 100,
              }}
            >
              No videos uploaded yet.
            </div>
          )}
          {shorts.map((s, i) => {
            const filename = s.filename;
            const state = editState[filename] || {};
            const origCaption = s.caption ?? "";
            const caption = state.caption !== undefined ? state.caption : origCaption;
            const viewCount = scrollCounts[filename] || 0;

            return (
              <div
                key={filename}
                style={{
                  background: "#1a1529",
                  borderRadius: 12,
                  padding: 15,
                  boxShadow: "0 1px 10px #0002",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span style={{ color: "#68d", fontWeight: "bold", fontSize: 14 }}>
                  VIDEO-{i + 1}
                </span>
                <video
                  src={HOST + s.url}
                  controls
                  loop
                  style={{
                    width: "100%",
                    maxHeight: "260px",
                    background: "#000",
                    borderRadius: 10,
                    objectFit: "cover",
                    marginBottom: 7,
                  }}
                />
                <small style={{ color: "#aaa" }}>{filename}</small>
                <div>
                  <strong style={{color:'#43e'}}>Views/Scrolls:</strong>{" "}
                  <span style={{color:'#0fa'}}>{viewCount}</span>
                </div>
                <div style={{ margin: "12px 0 3px 0" }}>
                  <label
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#33b6ff",
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    Caption / Title (shows to users):
                  </label>
                  <textarea
                    rows={2}
                    value={caption}
                    maxLength={250}
                    placeholder="Enter a clean caption for this video (up to 250 chars)..."
                    onChange={(e) => handleCaptionChange(filename, e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 9,
                      border: "1.5px solid #22283c",
                      padding: "8px 13px",
                      fontSize: 15,
                      background: state.error ? "#fee6e6" : "#110b23",
                      color: "#eee",
                      resize: "vertical",
                      outline: "none",
                      marginBottom: 4,
                      fontWeight: 400,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#888",
                      alignItems: "center"
                    }}
                  >
                    <span>
                      {caption.length}/250
                    </span>
                    {state.error && (
                      <span style={{ color: "#e11d48", marginLeft: 12 }}>
                        {state.error}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => saveCaption(filename, origCaption)}
                    disabled={state.loading || caption === origCaption}
                    style={{
                      background: "#2596ff",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      border: "none",
                      borderRadius: 7,
                      padding: "7px 20px",
                      cursor:
                        caption &&
                        caption !== origCaption &&
                        !state.loading
                          ? "pointer"
                          : "not-allowed",
                      opacity:
                        caption &&
                        caption !== origCaption &&
                        !state.loading
                          ? 1
                          : 0.57,
                      marginTop: 8,
                      transition: "all .13s",
                      minWidth: 85
                    }}
                  >
                    {state.loading
                      ? "Saving..."
                      : state.saved
                      ? "Saved ✓"
                      : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}




