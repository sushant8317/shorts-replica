const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json()); // For parsing JSON bodies

// === Use Render persistent disk path ===
const DISK_PATH = '/data'; // Mount this in Render settings as persistent disk
if (!fs.existsSync(DISK_PATH)) fs.mkdirSync(DISK_PATH, { recursive: true });

// === All metadata (video list) IN THE DISK as well ===
const VIDEOS_JSON = path.join(DISK_PATH, 'videos.json');
function getVideos() {
  if (!fs.existsSync(VIDEOS_JSON)) return [];
  try {
    return JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf-8') || '[]');
  } catch {
    return [];
  }
}
function saveVideos(videos) {
  fs.writeFileSync(VIDEOS_JSON, JSON.stringify(videos, null, 2), 'utf-8');
}

// Debug endpoint: see current files in disk
app.get('/_diskdebug', (req, res) => {
  try {
    const files = fs.existsSync(DISK_PATH) ? fs.readdirSync(DISK_PATH) : [];
    res.json({ disk_path: DISK_PATH, files });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== Auth & Admin ==============
const ADMIN_EMAIL = "propscholars@gmail.com";
const ADMIN_PASSWORD = "Hindi@1234";
const SECRET = "super-strong-secret-key-change-this"; // Use env var for production

app.post("/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, SECRET, { expiresIn: "4h" });
    return res.json({ token });
  }
  res.status(401).json({ error: "Unauthorized" });
});

function adminJwtAuth(req, res, next) {
  const header = req.header("Authorization");
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.email !== ADMIN_EMAIL) throw new Error();
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ========= Multer for uploads ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DISK_PATH),
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Serve uploaded videos statically
app.use('/uploads', express.static(DISK_PATH));

// === Utilities ===
function fileHashSync(filepath) {
  const buffer = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
function findVideo(videos, filename) {
  return videos.find(v => v.filename === filename);
}
function findVideoByHash(videos, hash) {
  return videos.find(v => v.sha256 === hash);
}

// ========== Public Endpoints =============

// List all videos
app.get('/shorts', (req, res) => { res.json(getVideos()); });

// Get a single video by filename
app.get('/shorts/:filename', (req, res) => {
  const v = findVideo(getVideos(), req.params.filename);
  if (!v) return res.status(404).json({ error: "Video not found" });
  res.json(v);
});

// Increment view count
app.post('/shorts/:filename/view', (req, res) => {
  const videos = getVideos();
  const vid = findVideo(videos, req.params.filename);
  if (!vid) return res.status(404).json({ error: "Video not found" });
  vid.views = (vid.views || 0) + 1;
  saveVideos(videos);
  res.json({ success: true, views: vid.views });
});

// Like (increment like count)
app.post('/shorts/:filename/like', (req, res) => {
  const videos = getVideos();
  const vid = findVideo(videos, req.params.filename);
  if (!vid) return res.status(404).json({ error: "Video not found" });
  vid.likes = (vid.likes || 0) + 1;
  saveVideos(videos);
  res.json({ success: true, likes: vid.likes });
});

// Add a comment
app.post('/shorts/:filename/comment', (req, res) => {
  const { name = "Anonymous", text } = req.body || {};
  if (!text) return res.status(400).json({ error: "No comment text" });
  const videos = getVideos();
  const vid = findVideo(videos, req.params.filename);
  if (!vid) return res.status(404).json({ error: "Video not found" });
  vid.comments = vid.comments || [];
  vid.comments.push({ name, text });
  saveVideos(videos);
  res.json({ success: true, comments: vid.comments });
});

// ========== ADMIN Endpoints (protected) ==========

// Upload (dedupe by hash)
app.post('/upload', adminJwtAuth, upload.single('video'), (req, res) => {
  const tempPath = path.join(DISK_PATH, req.file.filename);
  let videos = getVideos();

  let incomingHash;
  try {
    incomingHash = fileHashSync(tempPath);
  } catch {
    fs.unlinkSync(tempPath);
    return res.status(400).json({ error: "Failed to read file for hashing." });
  }
  // Duplicate check
  const dup = findVideoByHash(videos, incomingHash);
  if (dup) {
    fs.unlinkSync(tempPath);
    return res.json({ 
      success: true, 
      duplicate: true, 
      url: dup.url, 
      message: "Duplicate upload detected. Using existing video URL.", 
      filename: dup.filename
    });
  }

  const videoUrl = `/uploads/${req.file.filename}`;
  const stats = fs.statSync(tempPath);
  const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
  const author = typeof req.body.author === "string" ? req.body.author.trim() : "";
  if (caption.length > 250) {
    fs.unlinkSync(tempPath);
    return res.status(400).json({ error: "Caption too long" });
  }
  videos.unshift({
    url: videoUrl,
    filename: req.file.filename,
    sha256: incomingHash,
    createdAt: new Date(),
    size: stats.size,
    caption,
    author,
    likes: 0,
    views: 0,
    comments: []
  });
  saveVideos(videos);
  res.json({ success: true, url: videoUrl, filename: req.file.filename });
});

// PATCH (edit caption)
app.patch('/shorts/:filename', adminJwtAuth, (req, res) => {
  const filename = req.params.filename;
  const { caption } = req.body || {};
  let videos = getVideos();
  const vid = findVideo(videos, filename);
  if (!vid) return res.status(404).json({ error: "Video not found" });

  if (typeof caption === "string") {
    if (caption.length > 250) return res.status(400).json({ error: "Caption too long" });
    vid.caption = caption.trim();
    saveVideos(videos);
    return res.json({ success: true, updated: { caption: vid.caption } });
  }
  return res.status(400).json({ error: "No caption sent" });
});

// DELETE video
app.delete('/delete/:filename', adminJwtAuth, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DISK_PATH, filename);
  let deletedVideo = null;

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath); 
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete video file" });
    }
  }
  let videos = getVideos();
  const initialLength = videos.length;
  videos = videos.filter(v => {
    if (v.filename === filename) {
      deletedVideo = v;
      return false;
    }
    return true;
  });
  if (!deletedVideo && initialLength === videos.length)
    return res.status(404).json({ error: "Video not found" });

  saveVideos(videos);
  res.json({ success: true, deleted: filename });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
