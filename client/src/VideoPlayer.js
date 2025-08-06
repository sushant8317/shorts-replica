// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";

// // UI helpers
// function MuteMicIcon({ muted }) {
//   return muted ? (
//     <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff2" stroke="#fff"/>
//       <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#fff"/>
//       <line x1="4.8" y1="4.8" x2="19.2" y2="19.2" stroke="#fff" strokeWidth="2.6"/>
//     </svg>
//   ) : (
//     <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff1" stroke="#fff"/>
//       <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#fff"/>
//     </svg>
//   );
// }

// // Truncate
// function truncateString(str, maxLen = 90) {
//   if (!str) return '';
//   if (str.length <= maxLen) return str;
//   let nextSpace = str.indexOf(" ", maxLen);
//   if (nextSpace === -1) nextSpace = str.length;
//   return str.substring(0, nextSpace) + '…';
// }

// const HOST = "https://shorts-t2dk.onrender.com";

// export default function VideoPlayer() {
//   const { filename } = useParams();
//   const [video, setVideo] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [muted, setMuted] = useState(true);
//   const [mutePulse, setMutePulse] = useState(false);
//   const [showPause, setShowPause] = useState(false);
//   const [showFull, setShowFull] = useState(false);
//   const [caption, setCaption] = useState("");
//   const videoRef = useRef();
//   const navigate = useNavigate();

//   useEffect(() => {
//     setLoading(true);
//     axios.get(HOST + "/shorts")
//       .then(res => {
//         let found = res.data.find(v => (v.url || "").endsWith(filename));
//         if (found) {
//           setVideo(found);
//           setCaption(found.caption || "");
//         } else {
//           setVideo(null);
//         }
//       }).finally(()=>setLoading(false));
//   }, [filename]);

//   useEffect(() => {
//     // Autoplay and mute/unmute logic
//     if (videoRef.current) {
//       videoRef.current.muted = muted;
//       if (!loading) videoRef.current.play().catch(()=>{});
//     }
//   }, [muted, loading]);

//   if (loading) return (
//     <div style={{ width: "100vw", height: "100dvh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
//       <span style={{ color: "#85d3ff", fontWeight: 600, fontSize: 22, letterSpacing: ".04em" }}>Loading Video...</span>
//     </div>
//   );

//   if (!video) return (
//     <div style={{ width: "100vw", height: "100dvh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
//       <div style={{ textAlign: "center" }}>
//         <div style={{ color: "#f33", fontSize: 30, fontWeight: 700, marginBottom: 10 }}>404</div>
//         <div style={{ color: "#eee", fontSize: 20 }}>Video not found</div>
//         <button style={{
//           marginTop: 32, fontSize: 18, borderRadius: 7, border: "none",
//           background: "#3bdcff", color: "#111", fontWeight: 700,
//           padding: "12px 38px", cursor: "pointer"
//         }}
//         onClick={() => navigate("/")}>
//           Go to Feed
//         </button>
//       </div>
//     </div>
//   );

//   const showButton = () => (
//     <button
//       onClick={() => { setMuted(m => !m); setMutePulse(true); setTimeout(() => setMutePulse(false), 350); }}
//       aria-label={muted ? "Unmute" : "Mute"}
//       style={{
//         position: "absolute", top: 20, right: 20, zIndex: 60,
//         background: "rgba(28,29,34,0.65)", border: "none", borderRadius: 16,
//         width: 39, height: 39, display: "flex", alignItems: "center", justifyContent: "center",
//         cursor: "pointer", boxShadow: "0 2px 6px #0002", outline: "none",
//         transition: "box-shadow .22s,ease",
//         ...(mutePulse ? { animation: "mutepulseanim 0.38s cubic-bezier(.3,1.5,.65,1.05)", boxShadow: "0 0 0 9px #33b6ff27" } : {})
//       }}>
//       <MuteMicIcon muted={muted} />
//       <style>{`@keyframes mutepulseanim {
//         0% { box-shadow: 0 0 0 0 #33b6ff88; transform: scale(1.09);}
//         75%{ box-shadow:0 0 0 13px #33b6ff22; transform: scale(1.13);}
//         100% { box-shadow: 0 0 0 0 #33b6ff00; transform: scale(1);}
//       }`}</style>
//     </button>
//   );

//   function handleVideoClick() {
//     if (!videoRef.current) return;
//     if (videoRef.current.paused) { videoRef.current.play(); setShowPause(false); }
//     else { videoRef.current.pause(); setShowPause(true); }
//   }

//   return (
//     <div style={{
//       minHeight: "100dvh", width: "100vw", position: "relative", background: "#000",
//       display: "flex", alignItems: "center", justifyContent: "center"
//     }}>
//       <video
//         ref={videoRef}
//         src={HOST + video.url}
//         style={{
//           width: "100vw", height: "100dvh", objectFit: "contain", background: "#000",
//           cursor: "pointer", display: "block"
//         }}
//         playsInline loop onClick={handleVideoClick}
//       />
//       {showButton()}
//       {showPause && (
//         <div style={{
//           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           zIndex: 105, background: 'rgba(0,0,0,0.26)', pointerEvents: "none",
//           animation: 'fadeInPause .29s'
//         }}>
//           <PauseIcon />
//           <style>{`@keyframes fadeInPause { from {opacity:0; transform:scale(.85);} to {opacity:1; transform:scale(1);} }`}</style>
//         </div>
//       )}
//       <div style={{
//         position: "absolute", left: 0, right: 0, bottom: 0,
//         background: "linear-gradient(0deg,#000e 88%,transparent 100%)", color: "#fff",
//         padding: "20px 18px 28px 18px", zIndex: 6, display: "flex", flexDirection: "column"
//       }}>
//         <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
//           @{video.author || "anonymous"}
//         </div>
//         {caption && (
//           <div style={{ display: "flex", alignItems: "flex-end", minHeight: "26px", maxWidth: 500 }}>
//             <div
//               style={{
//                 fontWeight: 400, fontSize: 16, color: "#fff", lineHeight: 1.4,
//                 maxHeight: showFull ? "none" : "2.8em",
//                 overflow: showFull ? "visible" : "hidden", textOverflow: "ellipsis",
//                 display: "-webkit-box", WebkitLineClamp: showFull ? "unset" : 2,
//                 WebkitBoxOrient: "vertical", wordBreak: "break-word",
//                 marginRight: caption.length > 90 ? 10 : 0, whiteSpace: "pre-line"
//               }}>
//               {showFull ? caption : truncateString(caption)}
//             </div>
//             {caption.length > 90 && (
//               <button
//                 style={{
//                   background: "none", border: "none", color: "#33b6ff", fontWeight: 600, fontSize: 15,
//                   cursor: "pointer", marginLeft: 2, padding: 0, lineHeight: 1.3,
//                   textDecoration: "underline", transition: "color .15s"
//                 }}
//                 onClick={() => setShowFull(f => !f)}
//                 tabIndex={0}
//               >
//                 {showFull ? "less" : "more"}
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//       <button style={{
//         position: "absolute", top: 22, left: 18,
//         background: "rgba(28,29,34,0.59)", color: "#fff", border: "none",
//         borderRadius: 18, fontSize: 16, fontWeight: 700, padding: "7px 19px", cursor: "pointer",
//         zIndex: 80, boxShadow: "0 1px 5px #0015"
//       }} onClick={() => navigate("/")}>← Feed</button>
//     </div>
//   );
// }
