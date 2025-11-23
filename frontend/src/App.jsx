import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import useAuthStore from "./store/authStore";
import ExercisePlayer from "./pages/ExercisePlayer";
import { Toaster } from "react-hot-toast";

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user); // <--- GET USER TO CHECK ROLE

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              {/* Optional: Add security so students can't see admin page */}
              {user?.role === "admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* FIX: If user is Admin, force them to /admin. Else show Dashboard */}
              {user?.role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Dashboard />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/exercise/:id"
          element={
            <ProtectedRoute>
              <ExercisePlayer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
