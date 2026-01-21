import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SkillsBrowse from "./pages/SkillsBrowse";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import BrowseMentors from "./pages/BrowseMentors";
import MentorDetail from "./pages/MentorDetail";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import ActiveSession from "./pages/ActiveSession";
import OAuthCallback from "./pages/auth/callback";
import { useAuthStore } from "./store/authStore";
import { fetchMe } from "./api/auth";
import ChatPage from "./pages/ChatPage";
import LandingPage from "./pages/LandingPage";
import RoadmapPage from "./pages/RoadmapPage";
import VideoCall from "./pages/VideoCall";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const initUser = async () => {
      try {
        const data = await fetchMe();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.log("User not authenticated on app load");
      } finally {
        setLoading(false);
      }
    };
    initUser();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isVideoCall = location.pathname.startsWith('/video-call/');

  return (
    <div className="min-h-screen flex flex-col">
      {!isVideoCall && <NavBar />}
      <main className="flex-1">
        <div className={isLanding || isVideoCall ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
          <div className="bg-transparent transition-opacity duration-200 ease-in-out">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/home" replace /> : <LandingPage />} />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/login"
                element={user ? <Navigate to="/home" replace /> : <Login />}
              />

              <Route
                path="/signup"
                element={user ? <Navigate to="/home" replace /> : <Signup />}
              />

              <Route path="/auth/callback" element={<OAuthCallback />} />

              <Route path="/skills" element={<SkillsBrowse />} />

              <Route path="/mentors" element={<BrowseMentors />} />

              <Route path="/mentor/:id" element={<MentorDetail />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/session/:id"
                element={
                  <ProtectedRoute>
                    <ActiveSession />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />

              <Route path="/chat" element={<ChatPage />} />

              <Route
                path="/video-call/:sessionId"
                element={
                  <ProtectedRoute>
                    <VideoCall />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/roadmap"
                element={
                  <ProtectedRoute>
                    <RoadmapPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="*" element={<div className="p-8 text-center text-gray-600">Page not found</div>} />
            </Routes>
          </div>
        </div>
      </main>



      {
        !isVideoCall && (
          <footer className="border-t bg-white/60 backdrop-blur-sm py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-600 flex items-center justify-between">
              <div>© {new Date().getFullYear()} SkillSwap</div>
              <div>
                Built with ❤️ —{" "}
                <a className="underline" href="/">
                  Docs
                </a>
              </div>
            </div>
          </footer>
        )
      }
    </div >
  );
}
