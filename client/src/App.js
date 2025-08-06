import { BrowserRouter, Routes, Route } from "react-router-dom";
import Feed from "./Feed";
import VideoPlayer from "./VideoPlayer";
import AdminDashboard from "./AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main (random order, all videos) */}
        <Route path="/" element={<Feed />} />
        {/* Single video by filename */}
        <Route path="/shorts/:filename" element={<VideoPlayer />} />
        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Optional: Not found route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

