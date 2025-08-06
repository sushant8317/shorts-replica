// src/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const loggedIn = localStorage.getItem("shorts_loggedin") === "true";
  const location = useLocation();
  if (!loggedIn) {
    // Send user to login page and remember which page they intended
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return children;
}

export default ProtectedRoute;
