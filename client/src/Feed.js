import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// ---- CONFIG ----
const HOST = "https://shorts-t2dk.onrender.com";

// ---- UTILITIES ----
function truncateString(str, maxLen = 90) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  const nextSpace = str.indexOf(" ", maxLen);
  return (
    str.substring(0, nextSpace === -1 ? str.length : nextSpace) +
    "…"
  );
}
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function getProfilePic(v) {
  return (
    v.avatar ||
    v.profilePic ||
    `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
      v.author || "anonymous"
    )}`
  );
}
function fakeAvatar(i) {
  const urls = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/63.jpg",
    "https://randomuser.me/api/portraits/men/75.jpg",
    "https://randomuser.me/api/portraits/women/22.jpg",
    "https://randomuser.me/api/portraits/men/18.jpg"
  ];
  return urls[i % urls.length];
}
function fakeTime(i) {
  return [
    "2h ago",
    "1h ago",
    "45m ago",
    "30m ago",
    "15m ago",
    "Just now"
  ][i % 6] || "Just now";
}
function throttle(fn, wait) {
  let locked = false;
  return (...args) => {
    if (locked) return;
    locked = true;
    fn(...args);
    setTimeout(() => (locked = false), wait);
  };
}

// ---- SVG ICONS ----
function HeartSVG({ filled }) {
  return (
    <svg aria-label={filled ? "Unlike" : "Like"} height="28" width="28" viewBox="0 0 48 48">
      <path
        fill={filled ? "#ed4956" : "none"}
        stroke={filled ? "#ed4956" : "#fff"}
        strokeWidth="3"
        d="M34.3 7.8c-3.4 0-6.5 1.7-8.3 4.4-1.8-2.7-4.9-4.4-8.3-4.4C11 7.8 7 12 7 17.2c0 3.7 2.6 7 6.6 11.1 3.1 3.1 9.3 8.6 10.1 9.3.6.5 1.5.5 2.1 0 .8-.7 7-6.2 10.1-9.3 4-4.1 6.6-7.4 6.6-11.1 0-5.2-4-9.4-8.6-9.4z"
      />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width={82} height={82} viewBox="0 0 82 82">
      <circle cx="41" cy="41" r="40" fill="#000A" />
      <rect x="26" y="20" width="10" height="42" rx="3" fill="#fff" />
      <rect x="46" y="20" width="10" height="42" rx="3" fill="#fff" />
    </svg>
  );
}
function PulseHeart({ visible }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", left: "50%", top: "50%", zIndex: 106,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none", opacity: visible ? 1 : 0,
        animation: visible ? "heartPulseAnim .75s cubic-bezier(.1,1.6,.6,1)" : "none"
      }}
    >
      <svg viewBox="0 0 96 96" width={90} height={90} style={{ display: "block" }}>
        <path
          d="M48 86C48 86 12 60 12 32.5 12 18.8 24.5 10 36 10c6.2 0 11.9 3.3 12 3.3S53.8 10 60 10c11.5 0 24 8.8 24 22.5C84 60 48 86 48 86Z"
          fill="#ed4956"
          stroke="#ed4956"
          strokeWidth="7"
        />
      </svg>
      <style>{`
        @keyframes heartPulseAnim {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(0);}
          14% { opacity: 0.92; transform: translate(-50%,-50%) scale(1.22);}
          27% { opacity: 1; transform: translate(-50%,-50%) scale(0.89);}
          44%, 82% { opacity: 0.92; transform: translate(-50%,-50%) scale(1);}
          100% { opacity: 0; transform: translate(-50%,-50%) scale(0);}
        }
      `}</style>
    </div>
  );
}
function MuteMicIcon({ muted }) {
  return muted ? (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff2" stroke="#fff"/>
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#fff"/>
      <line x1="4.8" y1="4.8" x2="19.2" y2="19.2" stroke="#fff" strokeWidth="2.6"/>
    </svg>
  ) : (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff1" stroke="#fff"/>
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#fff"/>
    </svg>
  );
}

// ---- SKELETON SHORT ----
function SkeletonShort() {
  return (
    <div
      style={{
        width: "100vw", height: "100dvh",
        position: "relative",
        background: "#111",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
      }}
    >
      <div style={{
        width: "100vw", height: "100dvh",
        background: "linear-gradient(90deg,#16181f 0%,#212332 50%,#181924 100%)",
        animation: "skelAnim 1.3s infinite linear",
        position: "absolute", top: 0, left: 0, zIndex: 1
      }} />
      <style>{`
        @keyframes skelAnim { 0% { filter:brightness(1);} 55% { filter:brightness(1.07);} 100% { filter:brightness(1);}}
      `}</style>
      <div style={{
        position: "absolute", top: 20, right: 20, zIndex: 20,
        background: "rgba(28,29,34,0.65)",
        borderRadius: 16, width: 39, height: 39,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 24, height: 24,
          background: "linear-gradient(90deg,#222 30%,#333 60%,#222 100%)",
          borderRadius: "50%"
        }} />
      </div>
    </div>
  );
}

// ---- ANTI-INSPECT ----
function useAntiInspect() {
  useEffect(() => {
    const blockDevtools = e => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const preventRightClick = e => e.preventDefault();
    window.addEventListener("contextmenu", preventRightClick);
    window.addEventListener("keydown", blockDevtools);
    return () => {
      window.removeEventListener("contextmenu", preventRightClick);
      window.removeEventListener("keydown", blockDevtools);
    };
  }, []);
}

// ---- MAIN FEED COMPONENT ----
export default function Feed() {
  useAntiInspect();
  const location = useLocation();
  const navigate = useNavigate();
  // CORE STATE
  const [shorts, setShorts] = useState([]);
  const [aloneVideo, setAloneVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // LOCAL UI STATE
  const videoRefs = useRef({});
  const [muted, setMuted] = useState(true);
  const [mutePulse, setMutePulse] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showPulseHeart, setShowPulseHeart] = useState(false);
  const [likePending, setLikePending] = useState({});
  const [showComments, setShowComments] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [videoProgress, setVideoProgress] = useState({});

  // Comments modal drag
  const [modalDragY, setModalDragY] = useState(0);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const dragStartY = useRef(0);

  // "Replay-protection" overlay
  const [replayCounts, setReplayCounts] = useState({});
  const [overlayShown, setOverlayShown] = useState({});

  // ---- FETCH ----
  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setAloneVideo(null);
    setShorts([]);
    setReplayCounts({});
    setOverlayShown({});
    const params = new URLSearchParams(location.search);
    const filename = params.get("v");
    if (filename) {
      axios.get(`${HOST}/shorts/${filename}`)
        .then(res => setAloneVideo({
          ...res.data,
          url: res.data.url || `/shorts/${filename}`
        }))
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    } else {
      axios.get(HOST + "/shorts")
        .then(res => setShorts(shuffleArray(res.data)))
        .finally(() => setLoading(false));
    }
  }, [location.search]);

  // ---- PAGING: Only one video at a time, strictly state-based ----
  // No scroll container! Paging only through up/down
  const pageLock = useRef(false);

  function changeIdx(direction) {
    if (pageLock.current) return;
    let next = currentIdx + direction;
    if (next < 0 || next >= shorts.length) return;
    pageLock.current = true;
    setCurrentIdx(next);
    setTimeout(() => (pageLock.current = false), 500); // lock for anim duration
  }

  // Wheel and swipe listeners
  useEffect(() => {
    if (aloneVideo) return;

    function onWheel(e) {
      if (Math.abs(e.deltaY) < 16) return;
      if (e.deltaY > 0) changeIdx(1);
      else if (e.deltaY < 0) changeIdx(-1);
      e.preventDefault();
    }

    let touchStartY = null;
    function onTouchStart(e) {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
    }
    function onTouchEnd(e) {
      if (!touchStartY || !e.changedTouches) return;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dy) > 40) {
        if (dy < 0) changeIdx(1);
        if (dy > 0) changeIdx(-1);
      }
      touchStartY = null;
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [currentIdx, shorts.length, aloneVideo]);

  // ---- VIDEO CONTROL: Play/pause
  useEffect(() => {
    // Mute, pause all others, play current if not overlay
    if (aloneVideo) return;
    Object.entries(videoRefs.current).forEach(([idx, vid]) => {
      let nidx = Number(idx);
      if (!vid) return;
      if (nidx === currentIdx) {
        vid.muted = muted;
        const filename = shorts[nidx] && shorts[nidx].url.split("/").pop();
        if (!overlayShown[filename]) {
          vid.play().catch(() => {});
        }
      } else {
        vid.pause && vid.pause();
        vid.muted = true;
      }
    });
    setShowPause(false);
    setShowPulseHeart(false);
  }, [currentIdx, muted, aloneVideo, shorts, overlayShown]);

  useEffect(() => {
    // Pause all on tab switch
    function visibilityHandler() {
      if (document.visibilityState !== "visible") {
        Object.values(videoRefs.current).forEach((vid) => vid && vid.pause());
      }
    }
    document.addEventListener("visibilitychange", visibilityHandler);
    return () => document.removeEventListener("visibilitychange", visibilityHandler);
  }, []);

  // ---- LIKE / COMMENT / SHARE
  function isLiked(filename) {
    return localStorage.getItem("like_" + filename) === "1";
  }
  function setLiked(filename, yes) {
    if (yes) localStorage.setItem("like_" + filename, "1");
    else localStorage.removeItem("like_" + filename);
  }
  function handleLike(idx, filename, wantPulse = false) {
    if (likePending[filename]) return;
    const liked = isLiked(filename);
    setLikePending((l) => ({ ...l, [filename]: true }));
    if (!liked) {
      axios.post(`${HOST}/shorts/${filename}/like`).then(() => {
        setShorts((prev) =>
          prev.map((v, i) =>
            i === idx ? { ...v, likes: (v.likes || 0) + 1 } : v
          )
        );
        setAloneVideo((prev) =>
          prev && prev.url && prev.url.endsWith(filename)
            ? { ...prev, likes: (prev.likes || 0) + 1 }
            : prev
        );
        setLiked(filename, true);
        setLikePending((l) => ({ ...l, [filename]: false }));
      });
      if (wantPulse) {
        setShowPulseHeart(true);
        setTimeout(() => setShowPulseHeart(false), 720);
      }
    } else {
      setShorts((prev) =>
        prev.map((v, i) =>
          i === idx && (v.likes || 0) > 0
            ? { ...v, likes: v.likes - 1 }
            : v
        )
      );
      setAloneVideo((prev) =>
        prev && prev.url && prev.url.endsWith(filename) && (prev.likes || 0) > 0
          ? { ...prev, likes: prev.likes - 1 }
          : prev
      );
      setLiked(filename, false);
      setLikePending((l) => ({ ...l, [filename]: false }));
    }
  }
  function handleShare(filename) {
    const url = window.location.origin + "/?v=" + filename;
    if (navigator.share) {
      navigator.share({ url, title: "Watch this short!" });
    } else {
      navigator.clipboard.writeText(url);
      const temp = document.createElement("div");
      temp.innerText = "Link copied!";
      temp.style =
        "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#222c;padding:8px 26px;border-radius:17px;color:white;font-weight:600;z-index:9999;font-size:15px;box-shadow:0 4px 16px #0004";
      document.body.appendChild(temp);
      setTimeout(() => document.body.removeChild(temp), 1200);
    }
  }
  function handleAddComment(idx, filename) {
    const text = (commentInputs[filename] || "").trim();
    if (!text) return;
    axios
      .post(`${HOST}/shorts/${filename}/comment`, { name: "You", text })
      .then(() => {
        setShorts((prev) =>
          prev.map((v, i) =>
            i === idx
              ? {
                  ...v,
                  comments: [...(v.comments || []), { name: "You", text }]
                }
              : v
          )
        );
        setAloneVideo((prev) =>
          prev && prev.url && prev.url.endsWith(filename)
            ? {
                ...prev,
                comments: [...(prev.comments || []), { name: "You", text }]
              }
            : prev
        );
        setCommentInputs((prev) => ({ ...prev, [filename]: "" }));
      });
  }
  const handleCaptionExpand = (filename) =>
    setExpandedCaptions((prev) => ({
      ...prev,
      [filename]: !prev[filename]
    }));

  // ---- Comments modal drag
  function handleModalTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    dragStartY.current = e.touches[0].clientY;
    setIsDraggingModal(true);
  }
  function handleModalTouchMove(e) {
    if (!isDraggingModal || !e.touches || e.touches.length !== 1) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) setModalDragY(dy);
  }
  function handleModalTouchEnd() {
    setIsDraggingModal(false);
    if (modalDragY > 65) setShowComments(null);
    setModalDragY(0);
  }

  // ---- Video Progress
  function handleTimeUpdate(idx, filename) {
    const vid = videoRefs.current[idx];
    setVideoProgress((prev) => ({
      ...prev,
      [filename]:
        vid && vid.duration && isFinite(vid.duration)
          ? vid.currentTime / vid.duration
          : 0
    }));
  }

  // ---- ============= REPLAY PROTECTION =============== ----
  function handleVideoEnded(idx, filename) {
    setReplayCounts((prev) => {
      const prevCount = prev[filename] || 0;
      if (prevCount < 2) {
        if (videoRefs.current[idx]) {
          videoRefs.current[idx].currentTime = 0;
          videoRefs.current[idx].play().catch(() => {});
        }
        return { ...prev, [filename]: prevCount + 1 };
      } else {
        setOverlayShown((prevOverlay) => ({
          ...prevOverlay,
          [filename]: true,
        }));
        if (videoRefs.current[idx]) {
          videoRefs.current[idx].pause();
        }
        return { ...prev, [filename]: prevCount + 1 };
      }
    });
  }
  function handleOverlayContinue(idx, filename) {
    setReplayCounts((prev) => ({ ...prev, [filename]: 0 }));
    setOverlayShown((prev) => ({ ...prev, [filename]: false }));
    if (videoRefs.current[idx]) {
      videoRefs.current[idx].currentTime = 0;
      videoRefs.current[idx].play().catch(() => {});
    }
  }

  // ---- TAP + HEART UI ----
  function handleVideoEvents(idx, filename) {
    let tapTimeout = null;
    return {
      onClick: () => {
        if (tapTimeout) clearTimeout(tapTimeout);
        tapTimeout = setTimeout(() => {
          const vid = videoRefs.current[idx];
          if (!vid) return;
          if (vid.paused) {
            vid.play();
            setShowPause(false);
          } else {
            vid.pause();
            setShowPause(true);
          }
        }, 240);
      },
      onDoubleClick: () => {
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          tapTimeout = null;
        }
        if (!isLiked(filename)) handleLike(idx, filename, true);
        setShowPulseHeart(true);
        setTimeout(() => setShowPulseHeart(false), 700);
      },
      onTouchEnd: (e) => {
        if (!e || !e.changedTouches || e.changedTouches.length !== 1) return;
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          tapTimeout = null;
          if (!isLiked(filename)) handleLike(idx, filename, true);
          setShowPulseHeart(true);
          setTimeout(() => setShowPulseHeart(false), 700);
        } else {
          tapTimeout = setTimeout(() => {
            const vid = videoRefs.current[idx];
            if (vid) {
              if (vid.paused) {
                vid.play();
                setShowPause(false);
              } else {
                vid.pause();
                setShowPause(true);
              }
            }
            tapTimeout = null;
          }, 250);
        }
      }
    };
  }
  function handleSeek(idx, e, isTouch = false) {
    let clientX;
    if (isTouch) {
      if (!e.touches || e.touches.length !== 1) return;
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = x / rect.width;
    const vid = videoRefs.current[idx];
    if (vid && vid.duration && isFinite(vid.duration)) {
      vid.currentTime = Math.max(0, Math.min(percent, 1)) * vid.duration;
    }
  }

  // ---- PAGED RENDER LOGIC ----
  function getPagedShorts() {
    if (shorts.length === 0) return [];
    return [
      currentIdx - 1,
      currentIdx,
      currentIdx + 1,
    ]
      .filter((idx) => idx >= 0 && idx < shorts.length)
      .map((idx) => ({ ...shorts[idx], _idx: idx }));
  }

  // ---- RENDER VIDEO ----
  function renderVideo({
    v,
    idx,
    filename,
    prog,
    liked,
    isCurrent,
    allComments,
    caption,
    showFull,
    isTruncated,
    displayedCaption,
    inFeed
  }) {
    const isOverlayShown = overlayShown[filename];
    return (
      <div
        key={filename}
        style={{
          width: "100vw", height: "100dvh", position: "absolute", left: 0, top: 0,
          transition: "transform 0.44s cubic-bezier(.5,1,.5,1)",
          willChange: "transform",
          background: "black",
          overflow: "hidden"
        }}
      >
        <video
          ref={el => el && (videoRefs.current[idx] = el)}
          src={HOST + v.url}
          loop={false}
          playsInline
          style={{
            width: "100vw", height: "100dvh", objectFit: "contain", background: "#000",
            cursor: "pointer", display: "block"
          }}
          muted={muted}
          autoPlay
          onTimeUpdate={() => handleTimeUpdate(idx, filename)}
          onEnded={() => handleVideoEnded(idx, filename)}
          {...handleVideoEvents(idx, filename)}
        />
        {isOverlayShown && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1002,
          }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", minWidth: "260px",
              minHeight: "92px", background: "rgba(30,30,38,0.41)", borderRadius: "16px",
              boxShadow: "0 8px 32px 0 rgba(12,16,30,0.21), 0 1.5px 11px #0004",
              backdropFilter: "blur(14px) saturate(160%)", border: "1.6px solid rgba(80,80,86,0.16)",
              padding: "24px 26px 18px 26px", animation: "glassRise .36s cubic-bezier(.61,2,.22,1.02)"
            }}>
              <span style={{ color: "#fff", fontSize: "1.11rem", fontWeight: 600, marginBottom: "6px" }}>
                Continue watching?
              </span>
              <button onClick={() => handleOverlayContinue(idx, filename)} style={{
                background: "rgba(0,0,0,0.30)", color: "#fff", fontFamily: "inherit", padding: "8px 28px",
                fontSize: "1rem", fontWeight: 500, borderRadius: "12px", border: "1.1px solid rgba(255,255,255,0.085)",
                boxShadow: "0 1.5px 8px #0004", outline: "none", marginTop: "1px", cursor: "pointer", letterSpacing: "0.01em"
              }}>
                Continue
              </button>
            </div>
            <style>{`
              @keyframes glassRise {
                from { opacity: 0; transform: translateY(60px) scale(1.07);}
                to   { opacity: 1; transform: translateY(0) scale(1);}
              }
            `}</style>
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); setMuted(m => !m); setMutePulse(true); setTimeout(() => setMutePulse(false), 350); }}
          aria-label={muted ? "Unmute" : "Mute"}
          tabIndex={0}
          style={{
            position: "absolute", top: 20, right: 20, zIndex: 60,
            background: "rgba(28,29,34,0.65)", border: "none",
            borderRadius: 16, width: 39, height: 39,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 2px 6px #0002", outline: "none",
            transition: "box-shadow .22s,ease",
            ...(mutePulse
              ? { animation: "mutepulseanim 0.38s cubic-bezier(.3,1.5,.65,1.05)", boxShadow: "0 0 0 9px #33b6ff27" }
              : {})
          }}
        >
          <MuteMicIcon muted={muted} />
          <style>{`
            @keyframes mutepulseanim {
              0% { box-shadow: 0 0 0 0 #33b6ff88; transform: scale(1.09);}
              75%{ box-shadow:0 0 0 13px #33b6ff22; transform: scale(1.13);}
              100% { box-shadow: 0 0 0 0 #33b6ff00; transform: scale(1);}
            }
          `}</style>
        </button>
        {isCurrent && showPause && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 105, background: 'rgba(0,0,0,0.26)', pointerEvents: "none",
            animation: 'fadeInPause .29s'
          }}>
            <PauseIcon />
            <style>{`@keyframes fadeInPause { from {opacity:0; transform:scale(.85);} to {opacity:1; transform:scale(1);} }`}</style>
          </div>
        )}
        {isCurrent && <PulseHeart visible={showPulseHeart} />}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: 4, background: "rgba(255,255,255,0.18)", zIndex: 32, borderRadius: 2, overflow: "hidden", cursor: "pointer"
        }}
          onClick={e => handleSeek(idx, e, false)}
          onTouchStart={e => handleSeek(idx, e, true)}
          role="progressbar" aria-valuenow={Math.round(prog * 100)}
        >
          <div style={{
            width: `${Math.min(prog * 100, 100)}%`,
            height: "100%", background: "rgb(42, 131, 254)",
            transition: "width 0.22s cubic-bezier(.4,1,.5,1)", pointerEvents: "none"
          }} />
        </div>
        <div style={{
          position: 'absolute', right: '12px', bottom: '100px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 10
        }}>
          <div style={{
            marginBottom: 6, width: 48, height: 48,
            borderRadius: "50%", overflow: "hidden"
          }}>
            <img src={getProfilePic(v)} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              aria-label={liked ? "Unlike" : "Like"}
              disabled={likePending[filename]}
              onClick={e => { e.stopPropagation(); handleLike(idx, filename, !liked); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 0 }}
            ><HeartSVG filled={liked} /></button>
            <span style={{ color: liked ? '#ed4956' : '#fff', fontSize: '13px', marginTop: '4px' }}>{v.likes || 0}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              aria-label="Comment"
              onClick={e => { e.stopPropagation(); setShowComments(filename); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <svg aria-label="Comment" fill="#fff" height="24" viewBox="0 0 24 24" width="24">
                <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22Z" fill="none" stroke="#fff" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            <span style={{ color: '#fff', fontSize: '13px', marginTop: '4px' }}>{v.comments?.length || 0}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              aria-label="Share"
              onClick={() => handleShare(filename)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <svg aria-label="Share Post" fill="#fff" height="24" viewBox="0 0 24 24" width="24">
                <line fill="none" stroke="#fff" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
                <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="#fff" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            <span style={{ color: '#fff', fontSize: '13px', marginTop: '4px' }}>Share</span>
          </div>
        </div>
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: "linear-gradient(0deg,#000e 88%,transparent 100%)",
          color: "#fff", padding: "20px 18px 28px 18px", zIndex: 6,
          display: "flex", flexDirection: "column", userSelect: "none"
        }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            @{v.author || "anonymous"}
          </div>
          {caption && (
            <div style={{
              display: "flex", alignItems: "flex-end", minHeight: "26px", maxWidth: 500
            }}>
              <div
                style={{
                  fontWeight: 400, fontSize: 16, color: "#fff", lineHeight: 1.4,
                  maxHeight: showFull ? "none" : "2.8em",
                  overflow: showFull ? "visible" : "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: showFull ? "unset" : 2,
                  WebkitBoxOrient: "vertical", wordBreak: "break-word", marginRight: isTruncated ? 10 : 0,
                  whiteSpace: "pre-line"
                }}
              >
                {displayedCaption}
              </div>
              {isTruncated && (
                <button
                  style={{
                    background: "none", border: "none", color: "#33b6ff", fontWeight: 600, fontSize: 15,
                    cursor: "pointer", marginLeft: 2, padding: 0, lineHeight: 1.3, textDecoration: "underline"
                  }}
                  tabIndex={0} onClick={() => handleCaptionExpand(filename)}
                >{showFull ? "less" : "more"}</button>
              )}
            </div>
          )}
          {v.comments && v.comments.length > 0 && (
            <div style={{ fontSize: 14, color: "#bae6fd" }}>
              {v.comments[0].name === "You" ? (
                <>{v.comments[0].text}</>
              ) : (
                <><b>{v.comments[0].name}:</b> {v.comments[0].text}</>
              )}
            </div>
          )}
          <div
            style={{ color: "#b2bec3", fontSize: 15, marginTop: 3, cursor: "pointer" }}
            onClick={() => setShowComments(filename)}
          >View all {v.comments ? v.comments.length : 0} comments</div>
        </div>
        {showComments === filename &&
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.91)",
              display: "flex", flexDirection: "column", justifyContent: "flex-end"
            }}
            onClick={() => setShowComments(null)}
          >
            <div
              className="comments-modal"
              style={{
                backgroundColor: "#000",
                borderTopLeftRadius: 15, borderTopRightRadius: 15, padding: 15,
                minHeight: '36vh', height: '70vh',
                display: 'flex', flexDirection: 'column',
                maxWidth: 500, width: "97vw", margin: "0 auto",
                border: '1px solid #262626',
                touchAction: "none",
                transition: isDraggingModal ? "none" : "transform 0.22s cubic-bezier(.43,1.5,.48,1.16)",
                transform: modalDragY ? `translateY(${Math.min(modalDragY, 144)}px)` : "translateY(0)"
              }}
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: 15, borderBottom: '1px solid #262626'
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Comments</h2>
                <span
                  className="fas fa-times"
                  style={{ fontSize: 22, color: "#fff", cursor: "pointer" }}
                  onClick={() => setShowComments(null)}
                  tabIndex={0}
                >×</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                {allComments.length === 0 ? (
                  <div style={{ color: "#ccc", textAlign: "center", padding: "40px 0" }}>No comments yet.</div>
                ) : (
                  allComments.map((c, i) => (
                    <div className="comment" style={{ display: 'flex', marginBottom: 15 }} key={i}>
                      <img
                        src={c.avatar}
                        className="comment-avatar"
                        alt=""
                        style={{ width: 30, height: 30, borderRadius: "50%", marginRight: 10 }}
                      />
                      <div className="comment-content" style={{ flex: 1 }}>
                        <div>
                          <span className="comment-username" style={{
                            fontWeight: 600, fontSize: 14, marginRight: 5, color: "#fff"
                          }}>{c.name}</span>
                          <span className="comment-text" style={{ fontSize: 14, color: "#fff" }}>{c.text}</span>
                        </div>
                        <div className="comment-time" style={{
                          fontSize: 12, color: "#a8a8a8", marginTop: 2
                        }}>{c.time}</div>
                        <div className="comment-actions" style={{ display: 'flex', marginTop: 5 }}>
                          <span style={{ fontSize: 12, color: "#a8a8a8", marginRight: 15, cursor: "pointer", userSelect: "none" }}>Reply</span>
                          <span style={{ fontSize: 12, color: "#a8a8a8", marginRight: 15, cursor: "pointer", userSelect: "none" }}>Like</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                paddingTop: 10, borderTop: '1px solid #262626'
              }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  style={{
                    flex: 1, backgroundColor: "#262626", border: "none", borderRadius: 20,
                    padding: "10px 15px", color: "white", fontSize: 14
                  }}
                  value={commentInputs[filename] || ""}
                  onChange={e => setCommentInputs(prev => ({
                    ...prev,
                    [filename]: e.target.value
                  }))}
                  onKeyDown={e => e.key === "Enter" && (commentInputs[filename] || "").trim() !== "" && handleAddComment(idx, filename)}
                />
                <button
                  style={{
                    color: "#0095f6", fontWeight: 600, marginLeft: 10, fontSize: 14,
                    background: "none", border: "none",
                    cursor: (commentInputs[filename] || "").trim() !== "" ? "pointer" : "default",
                    opacity: (commentInputs[filename] || "").trim() !== "" ? 1 : 0.5
                  }}
                  disabled={(commentInputs[filename] || "").trim() === ""}
                  onClick={() => handleAddComment(idx, filename)}
                >Post</button>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }

  // ---- VIDEO FEED UI STATE ----
  if (notFound) {
    return (
      <div style={{
        fontFamily: "Inter, Arial,sans-serif",
        color: "#ca7979", textAlign: "center", marginTop: 120, fontSize: 22,
        background: "#000", minHeight: "100dvh"
      }}>
        <div style={{ marginBottom: 12 }}>Video not found.</div>
        <button
          onClick={() => navigate("/", { replace: true })}
          style={{
            color: "#fff", background: "#33b6ff",
            border: "none", borderRadius: 10, fontWeight: 600,
            fontSize: 16, padding: "8px 28px", cursor: "pointer"
          }}>
          Back to Feed
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <>
        <SkeletonShort />
      </>
    );
  }

  // ---- Single video mode ----
  if (aloneVideo) {
    const v = aloneVideo;
    const urlParts = (v.url || "").split("/");
    const filename = urlParts[urlParts.length - 1];
    const liked = isLiked(filename);
    const prog = videoProgress[filename] || 0;
    const allComments = (v.comments || []).map((c, i) => ({
      ...c, avatar: fakeAvatar(i), time: fakeTime(i)
    }));
    const caption = v.caption || "";
    const previewLimit = 90;
    const isTruncated = caption && caption.length > previewLimit;
    const showFull = expandedCaptions[filename];
    const displayedCaption = !caption ? "" : showFull ? caption : truncateString(caption, previewLimit);

    return (
      <div
        style={{
          width: "100vw", height: "100dvh", position: "relative", background: "black",
          overflow: "hidden"
        }}
      >
        {renderVideo({
          v, idx: 0, filename, prog, liked, isCurrent: true, allComments,
          caption, showFull, isTruncated, displayedCaption, inFeed: false
        })}
        <button
          onClick={() => navigate("/", { replace: true })}
          aria-label="Back to Feed"
          style={{
            position: "absolute", top: 20, left: 16, zIndex: 100,
            background: "#222f", color: "#fff",
            fontWeight: 600, fontSize: 16, padding: "6px 17px",
            borderRadius: 15, border: "none", cursor: "pointer", letterSpacing: ".02em",
            boxShadow: "0 2px 10px #0003"
          }}>
          ← Feed
        </button>
      </div>
    );
  }
  if (!loading && shorts.length === 0) {
    return (
      <div style={{
        fontFamily: "Inter, Arial,sans-serif",
        color: "#bbb", textAlign: "center", marginTop: 120, fontSize: 20,
        background: "#0a0a0c", minHeight: "100dvh", letterSpacing: ".01em"
      }}>
        No shorts uploaded yet.
      </div>
    );
  }

  // ---- STRICT YT/REELS STYLE PAGED FEED ----
  // Only current, previous and next video are rendered, strictly one page at a time.
  return (
    <div
      style={{
        position: "relative", height: "100dvh", width: "100vw", background: "black", margin: 0, padding: 0, overflow: "hidden",
        fontFamily: "Inter, Arial,sans-serif"
      }}>
      {getPagedShorts().map((v, j) => {
        const idx = v._idx;
        const filename = v.url.split("/").pop();
        const liked = isLiked(filename);
        const prog = videoProgress[filename] || 0;
        const allComments = (v.comments || []).map((c, i) => ({
          ...c, avatar: fakeAvatar(i), time: fakeTime(i)
        }));
        const caption = v.caption || "";
        const previewLimit = 90;
        const isTruncated = caption && caption.length > previewLimit;
        const showFull = expandedCaptions[filename];
        const displayedCaption = !caption ? "" : showFull ? caption : truncateString(caption, previewLimit);
        const isCurrent = idx === currentIdx;
        return (
          <div
            key={filename || idx}
            style={{
              width: "100vw", height: "100dvh", position: "absolute", left: 0, top: 0,
              transition: "transform 0.44s cubic-bezier(.5,1,.5,1)",
              willChange: "transform",
              zIndex: idx === currentIdx ? 2 : 1,
              transform: `translateY(${(idx - currentIdx) * 100}%)`
            }}
          >
            {renderVideo({
              v, idx, filename, prog, liked, isCurrent, allComments,
              caption, showFull, isTruncated, displayedCaption, inFeed: true
            })}
          </div>
        );
      })}
    </div>
  );
}



