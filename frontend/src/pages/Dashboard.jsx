/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import Logo from "../components/Logo";
import { toast } from "react-hot-toast";

// Import Lucide Icons
import {
  Trophy,
  BarChart3,
  LogOut,
  User,
  Play,
  BookOpen,
  Calculator,
  Palette,
  Puzzle,
  Utensils,
  MessageCircle,
  Gamepad2,
  CheckCircle2,
  Lock,
} from "lucide-react";

// Helper: Icon Selector
// Since DB data doesn't have icons, we pick one based on the title or type
const getIconForExercise = (title, type) => {
  const t = title.toLowerCase();
  if (type === "game") return Gamepad2;
  if (t.includes("number") || t.includes("nombre")) return Calculator;
  if (t.includes("color") || t.includes("couleur")) return Palette;
  if (t.includes("food") || t.includes("nourriture")) return Utensils;
  if (t.includes("verb")) return Puzzle;
  if (t.includes("greet") || t.includes("salut")) return MessageCircle;
  return BookOpen; // Default
};

// Widget: Leaderboard
const Leaderboard = ({ batchId, refreshKey }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/leaderboard/${batchId}`);
        setLeaders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [batchId, refreshKey]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" /> Classement
      </h3>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <ul className="space-y-3">
          {leaders.length === 0 ? (
            <li className="text-gray-400 italic text-sm">
              No active students.
            </li>
          ) : (
            leaders.map((s, i) => (
              <li
                key={i}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                      i === 0
                        ? "bg-yellow-400 text-yellow-900"
                        : i === 1
                        ? "bg-gray-300"
                        : i === 2
                        ? "bg-orange-300"
                        : "bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-800">{s.name}</span>
                </div>
                <span className="font-bold text-red-700 text-sm">
                  {s.weekly_xp} XP
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

// Widget: User Progress
const UserProgress = ({ refreshKey }) => {
  const [stats, setStats] = useState({ total_xp: 0, lessons: [] });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/progress/me");
        setStats(res.data);
      } catch (e) {console.error(e); }
    };
    fetch();
  }, [refreshKey]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-500" /> Mon Progrès
      </h3>
      <div className="bg-red-50 rounded-lg p-4 mb-6 text-center border border-red-100">
        <p className="text-red-600 text-xs font-bold uppercase tracking-wider">
          Total Experience
        </p>
        <p className="text-4xl font-extrabold text-red-900">
          {stats.total_xp} XP
        </p>
      </div>
      <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase">
        Recent Activity
      </h4>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
        {stats.lessons.length === 0 && (
          <p className="text-xs text-gray-400">No lessons completed yet.</p>
        )}
        {stats.lessons.map((l, i) => (
          <div
            key={i}
            className="text-sm flex justify-between items-center text-gray-600 border-b border-gray-100 pb-2"
          >
            <span className="flex items-center gap-2 truncate w-40">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              {/* We might need to map ID to Title if DB stores IDs, for now showing ID/Key */}
              <span className="truncate">{l.title}</span>
            </span>
            <span className="text-green-600 font-bold text-xs">
              +{l.xp_gained} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard
const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [completing, setCompleting] = useState(null);

  const navigate = useNavigate();

  // REAL DATA STATE
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Fetch Exercises from DB
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await api.get("/exercises"); // Call the new endpoint
        setLessons(res.data);
      } catch (err) {
        console.error("Failed to load exercises", err);
      } finally {
        setLoadingLessons(false);
      }
    };
    fetchExercises();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  }

  const handleStartLesson = (exerciseId) => {
    navigate(`/exercise/${exerciseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <header className="bg-linear-to-r from-red-900 to-red-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 shadow-md rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight hidden sm:block">
              Le Français
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-red-200 uppercase">Bonjour,</p>
              <p className="font-semibold leading-none">{user?.name}</p>
            </div>
            <Link
              to="/profile"
              className="text-red-200 hover:text-white transition p-2 rounded-full hover:bg-red-700/50"
            >
              <User className="w-6 h-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-200 hover:text-white transition p-2 rounded-full hover:bg-red-700/50"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Dynamic Lessons Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md min-h-[500px]">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                <BookOpen className="w-6 h-6 text-red-800" />
                Leçons Disponibles
              </h2>

              {loadingLessons ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mb-2"></div>
                  <p>Loading curriculum...</p>
                </div>
              ) : lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                  <Lock className="w-12 h-12 mb-2 text-gray-300" />
                  <p>No lessons unlocked yet.</p>
                  <p className="text-xs">
                    Ask your teacher to unlock a chapter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {lessons.map((lesson) => {
                    const Icon = getIconForExercise(lesson.title, lesson.type);

                    return (
                      <div
                        key={lesson.exercise_id}
                        className="group border border-gray-200 rounded-xl p-5 hover:border-red-200 hover:shadow-md transition-all bg-white flex flex-col sm:flex-row justify-between items-center gap-4"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-700 group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-xs text-red-500 font-bold uppercase mb-0.5 tracking-wide">
                              {lesson.chapter_title}
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 group-hover:text-red-800 transition-colors">
                              {lesson.title}
                            </h4>
                            <p className="text-gray-400 text-xs capitalize flex items-center gap-1">
                              {lesson.type === "game" ? (
                                <Gamepad2 className="w-3 h-3" />
                              ) : (
                                <BookOpen className="w-3 h-3" />
                              )}
                              {lesson.type} Activity
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider border border-red-100">
                            {lesson.xp_reward} XP
                          </span>
                          <button
                            onClick={() =>
                              handleStartLesson(lesson.exercise_id)
                            }
                            disabled={completing === lesson.exercise_id}
                            className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-sm flex items-center gap-2 transform active:scale-95 ${
                              completing === lesson.exercise_id
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-linear-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600"
                            }`}
                          >
                            <Play className="w-4 h-4" fill="currentColor" />
                            {completing === lesson.exercise_id
                              ? "Saving..."
                              : "Start"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="space-y-8">
            <UserProgress refreshKey={refreshKey} />
            <Leaderboard batchId={user?.batch_id} refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
