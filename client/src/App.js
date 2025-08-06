import { BrowserRouter, Routes, Route } from "react-router-dom";
import Feed from "./Feed";
import VideoPlayer from "./VideoPlayer";
import AdminDashboard from "./AdminDashboard";
import Login from "./Login";                // ← add this import
import ProtectedRoute from "./ProtectedRoute"; // ← and this one

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main (random order, all videos) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        {/* Single video by filename */}
        <Route
          path="/shorts/:filename"
          element={
            <ProtectedRoute>
              <VideoPlayer />
            </ProtectedRoute>
          }
        />
        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Login route (does NOT require auth) */}
        <Route path="/login" element={<Login />} />

        {/* Optional: Not found route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
